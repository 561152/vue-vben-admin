import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlatformAiConfigPage from './index.vue';

const listCredentialsMock = vi.fn();
const getDefaultModelsMock = vi.fn();
const setDefaultModelsMock = vi.fn();
const getScenarioBindingsMock = vi.fn();

vi.mock('../../_shared/ai-config/credentials.api', () => ({
  listCredentials: (...args: unknown[]) => listCredentialsMock(...args),
  getDefaultModels: (...args: unknown[]) => getDefaultModelsMock(...args),
  setDefaultModels: (...args: unknown[]) => setDefaultModelsMock(...args),
  getScenarioBindings: (...args: unknown[]) => getScenarioBindingsMock(...args),
  testCredential: vi.fn(),
  deleteCredential: vi.fn(),
  createCredential: vi.fn(),
  updateCredential: vi.fn(),
  setScenarioBindings: vi.fn(),
}));

vi.mock('#/api/request', () => ({
  requestClient: { put: vi.fn().mockResolvedValue({}) },
}));

vi.mock('ant-design-vue', () => ({
  message: { success: vi.fn(), error: vi.fn() },
}));

describe('PlatformAiConfigPage (platform/ai-config)', () => {
  beforeEach(() => {
    listCredentialsMock.mockReset().mockResolvedValue([]);
    getDefaultModelsMock.mockReset().mockResolvedValue([]);
    setDefaultModelsMock.mockReset().mockResolvedValue([]);
    getScenarioBindingsMock.mockReset().mockResolvedValue([]);
  });

  it("forwards scope='platform' to all child components", async () => {
    const wrapper = mount(PlatformAiConfigPage);
    await flushPromises();
    expect(listCredentialsMock).toHaveBeenCalledWith('platform');
    const credList = wrapper.findComponent({ name: 'CredentialList' });
    expect(credList.props('scope')).toBe('platform');
  });

  it('on mount triggers GET listCredentials + getDefaultModels for platform', async () => {
    mount(PlatformAiConfigPage);
    await flushPromises();
    expect(listCredentialsMock).toHaveBeenCalledWith('platform');
    expect(getDefaultModelsMock).toHaveBeenCalledWith('platform');
  });

  it("tab2 default-model save calls setDefaultModels with 'platform'", async () => {
    const wrapper = mount(PlatformAiConfigPage);
    await flushPromises();
    await wrapper.find('[data-testid="tab-defaults"]').trigger('click');
    await flushPromises();
    await wrapper.find('[data-testid="defaults-save"]').trigger('click');
    await flushPromises();
    expect(setDefaultModelsMock.mock.calls[0]?.[0]).toBe('platform');
  });

  it("tab3 ScenarioBindingTable receives scope='platform'", async () => {
    const wrapper = mount(PlatformAiConfigPage);
    await flushPromises();
    await wrapper.find('[data-testid="tab-scenarios"]').trigger('click');
    await flushPromises();
    const table = wrapper.findComponent({ name: 'ScenarioBindingTable' });
    expect(table.props('scope')).toBe('platform');
  });

  it('renders 3 tabs same as tenant page', async () => {
    const wrapper = mount(PlatformAiConfigPage);
    await flushPromises();
    const tabs = wrapper.findAll('[data-testid^="tab-"]');
    const labels = tabs.map((t) => t.text());
    expect(labels).toContain('凭据管理');
    expect(labels).toContain('默认模型');
    expect(labels).toContain('场景覆盖（高级）');
  });
});
