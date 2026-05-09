import { requestClient } from '#/api/request';

import type { AiProviderKey, ModelPreset } from './ProviderPresets';

export type CredentialScope = 'platform' | 'tenant';

export type CredentialTestStatus =
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'OK'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface CredentialTestResult {
  message?: string;
  status: CredentialTestStatus;
  testedAt?: string;
}

export interface AiCredentialDto {
  apiKeyHint: string;
  baseUrl: string;
  displayName: string;
  enabledModels: ModelPreset[];
  id: number;
  isActive: boolean;
  lastTestStatus?: CredentialTestStatus | null;
  lastTestedAt?: string | null;
  provider: AiProviderKey;
}

export interface AiCredentialUpsertDto {
  apiKey?: string;
  baseUrl: string;
  displayName: string;
  enabledModels: ModelPreset[];
  isActive?: boolean;
  provider: AiProviderKey;
}

function basePath(scope: CredentialScope): string {
  return scope === 'platform' ? '/platform/ai-credentials' : '/settings/ai-credentials';
}

export function listCredentials(scope: CredentialScope) {
  return requestClient.get<AiCredentialDto[]>(basePath(scope));
}

export function createCredential(scope: CredentialScope, dto: AiCredentialUpsertDto) {
  return requestClient.post<AiCredentialDto>(basePath(scope), dto);
}

export function updateCredential(
  scope: CredentialScope,
  id: number,
  dto: AiCredentialUpsertDto,
) {
  return requestClient.put<AiCredentialDto>(`${basePath(scope)}/${id}`, dto);
}

export function deleteCredential(scope: CredentialScope, id: number) {
  return requestClient.delete<void>(`${basePath(scope)}/${id}`);
}

export function testCredential(scope: CredentialScope, id: number) {
  return requestClient.post<CredentialTestResult>(`${basePath(scope)}/${id}/test`);
}

// Default-model bindings
export interface DefaultModelBindingDto {
  capability: 'EMBEDDING' | 'LLM' | 'VISION';
  credentialId: number;
  modelName: string;
}

export function getDefaultModels(scope: CredentialScope) {
  return requestClient.get<DefaultModelBindingDto[]>(`${basePath(scope)}/defaults`);
}

export function setDefaultModels(scope: CredentialScope, dto: DefaultModelBindingDto[]) {
  return requestClient.put<DefaultModelBindingDto[]>(`${basePath(scope)}/defaults`, dto);
}

// Scenario bindings
export interface ScenarioBindingDto {
  credentialId: number;
  modelName: string;
  scenario: string;
}

export function getScenarioBindings(scope: CredentialScope) {
  return requestClient.get<ScenarioBindingDto[]>(`${basePath(scope)}/scenarios`);
}

export function setScenarioBindings(scope: CredentialScope, dto: ScenarioBindingDto[]) {
  return requestClient.put<ScenarioBindingDto[]>(`${basePath(scope)}/scenarios`, dto);
}
