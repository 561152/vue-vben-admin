/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message, notification } from 'ant-design-vue';
import { h } from 'vue';

import { useAuthStore } from '#/store';
import { $t } from '#/locales';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// 登录过期倒计时管理
let loginExpiredTimer: NodeJS.Timeout | null = null;
let loginExpiredNotificationKey: string | null = null;

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑（优化版：倒计时通知）
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);

    // 如果已经有通知显示，不重复创建
    if (loginExpiredNotificationKey) {
      return;
    }

    // 优化：使用友好的倒计时通知替代强制模态框
    if (preferences.app.loginExpiredMode === 'modal' && accessStore.isAccessChecked) {
      showLoginExpiredNotification(authStore);
    } else {
      await authStore.logout();
    }
  }

  /**
   * 显示登录过期倒计时通知
   */
  function showLoginExpiredNotification(authStore: any) {
    let countdown = 30;
    const key = `login-expired-${Date.now()}`;
    loginExpiredNotificationKey = key;

    // 立即重新登录的回调
    function handleReloginNow() {
      clearLoginExpiredNotification();
      authStore.logout();
    }

    // 更新通知内容
    function updateNotification() {
      notification.warning({
        key,
        message: $t('authentication.loginExpired'),
        description: h('div', [
          h('p', `${$t('authentication.loginAgainSubTitle')} (${countdown}s)`),
          h(
            'button',
            {
              onClick: handleReloginNow,
              style: {
                marginTop: '8px',
                padding: '4px 12px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              },
            },
            $t('authentication.reloginNow'),
          ),
        ]),
        duration: 0, // 不自动关闭
        placement: 'topRight',
      });
    }

    // 初始显示
    updateNotification();

    // 启动倒计时
    loginExpiredTimer = setInterval(() => {
      countdown--;

      if (countdown <= 0) {
        // 倒计时结束，自动登出
        clearLoginExpiredNotification();
        authStore.logout();
      } else {
        // 更新倒计时
        updateNotification();
      }
    }, 1000);
  }

  /**
   * 清除登录过期通知
   */
  function clearLoginExpiredNotification() {
    if (loginExpiredTimer) {
      clearInterval(loginExpiredTimer);
      loginExpiredTimer = null;
    }
    if (loginExpiredNotificationKey) {
      notification.close(loginExpiredNotificationKey);
      loginExpiredNotificationKey = null;
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.message ?? '';
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });

// 导出 request 函数供共享组件使用
export const request = requestClient;
