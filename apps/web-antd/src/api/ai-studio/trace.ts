import { requestClient } from '../request';

export interface TraceListItem {
  trace_id: string;
  pipeline_id: string | null;
  execution_id: string | null;
  root_span_kind: string | null;
  root_span_name: string | null;
  start_time: string;
  duration_ms: number | null;
  status: string;
  total_tokens: number;
  total_cost_micros: number;
  span_count: number;
}

export interface SpanRow {
  tenant_id: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  span_kind: string;
  name: string;
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  status: string;
  error_message: string | null;
  attributes: string | Record<string, unknown>;
  events: string | unknown[];
}

export interface TraceListParams {
  startTime: string;
  endTime: string;
  pipelineId?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export interface TraceAggregateParams {
  startTime: string;
  endTime: string;
  dimension: 'hour' | 'pipeline' | 'status';
}

export interface TraceAggregateItem {
  bucket: string;
  trace_count: number;
  tokens: number;
  cost: number;
}

export function getTraces(params: TraceListParams) {
  return requestClient.get<TraceListItem[]>('/ai-studio/traces', { params });
}

export function getTraceDetail(traceId: string) {
  return requestClient.get<SpanRow[]>(`/ai-studio/traces/${traceId}`);
}

export function getTraceAggregate(params: TraceAggregateParams) {
  return requestClient.get<TraceAggregateItem[]>(
    '/ai-studio/traces/aggregate/summary',
    { params },
  );
}
