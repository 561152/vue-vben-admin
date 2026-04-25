import type { Ref } from 'vue';
import { ref } from 'vue';

import { requestClient } from '#/api/request';

/**
 * AsyncTaskSession 视图（来自 shared-async-task 的 /async-task-sessions/:id）。
 * 与后端 TaskViewDto 对齐：result / startedAt / completedAt 均存在。
 */
export interface SessionView {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  overallProgress: number;
  tasks: Array<{
    type: string;
    label: string;
    status: string;
    progress: number;
    result: Record<string, unknown> | null;
    error: string | null;
  }>;
  result: Record<string, unknown> | null;
  error: string | null;
}

/**
 * 前端整体进度展示视图（写到 syncProgress ref）。
 * 移除了 total / processed：它们原来存的是子任务数（1~3），不是记录条数，语义混乱。
 * 子任务明细通过 useSessionPolling 返回的 tasks ref 单独获取。
 */
export interface SessionProgress {
  title: string;
  percent: number;
  status: 'active' | 'completed' | 'failed';
}

/**
 * 单个子任务的进度视图。
 * - RUNNING 时：percent 来自 task.progress（0-100）
 * - COMPLETED 时：result 含新增/更新/失败数量
 */
export interface TaskProgress {
  type: string;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  percent: number;
  result: {
    created?: number;
    updated?: number;
    failed?: number;
    relationsCreated?: number;
  } | null;
  error: string | null;
}

export interface UseSessionPollingOptions {
  /** 进度展示用的标题前缀（RUNNING 阶段会拼上当前 task label）。*/
  titlePrefix?: string;
  /** 轮询间隔，默认 1000 ms。网络错误时用 2000 ms 退避。*/
  pollIntervalMs?: number;
  errorRetryMs?: number;
  /** 完成后清理进度条的延迟，默认 2000 ms。*/
  completeClearMs?: number;
}

/**
 * AsyncTaskSession 通用轮询封装。
 *
 * - 调 `GET /async-task-sessions/:sessionId` 拉最新状态
 * - 将 SessionView 拍平成 `SessionProgress` 写到传入的 ref
 * - 同时将子任务列表写到返回的 tasks ref
 * - COMPLETED / FAILED 自动停止轮询并回调 onComplete / onError
 * - `stop()` 方法用于页面 unmount 或用户手动停止
 */
export function useSessionPolling(progressRef: Ref<null | SessionProgress>) {
  let timer: null | ReturnType<typeof setTimeout> = null;
  const tasks = ref<TaskProgress[]>([]);

  const stop = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    tasks.value = [];
  };

  const start = (
    sessionId: string,
    onComplete: (result: Record<string, unknown>) => void,
    onError: (error: string) => void,
    options: UseSessionPollingOptions = {},
  ) => {
    const titlePrefix = options.titlePrefix ?? '同步进行中';
    const pollIntervalMs = options.pollIntervalMs ?? 1000;
    const errorRetryMs = options.errorRetryMs ?? 2000;
    const completeClearMs = options.completeClearMs ?? 2000;

    const poll = async () => {
      try {
        const session = await requestClient.get<SessionView>(
          `/async-task-sessions/${sessionId}`,
        );

        const runningTask = session.tasks.find((t) => t.status === 'RUNNING');
        const currentLabel = runningTask?.label || '准备中...';

        // 更新子任务列表
        tasks.value = session.tasks.map((t) => ({
          type: t.type,
          label: t.label,
          status: t.status as TaskProgress['status'],
          percent: t.progress,
          result:
            t.status === 'COMPLETED' && t.result
              ? (t.result as TaskProgress['result'])
              : null,
          error: t.error,
        }));

        // 更新整体进度
        progressRef.value = {
          title: `${titlePrefix} - ${currentLabel}`,
          percent: session.overallProgress,
          status: session.status === 'FAILED' ? 'failed' : 'active',
        };

        if (session.status === 'COMPLETED') {
          progressRef.value = {
            ...progressRef.value,
            percent: 100,
            status: 'completed',
          };
          setTimeout(() => {
            progressRef.value = null;
            tasks.value = [];
          }, completeClearMs);
          onComplete(session.result || {});
          return;
        }
        if (session.status === 'FAILED') {
          setTimeout(() => {
            progressRef.value = null;
            tasks.value = [];
          }, completeClearMs);
          onError(session.error || '同步失败');
          return;
        }

        timer = setTimeout(poll, pollIntervalMs);
      } catch (error) {
        console.error('轮询会话状态失败', error);
        timer = setTimeout(poll, errorRetryMs);
      }
    };

    stop();
    tasks.value = [];
    poll();
  };

  return { start, stop, tasks };
}
