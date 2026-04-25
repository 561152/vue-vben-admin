import { ref } from 'vue';
import { defineStore } from 'pinia';
import { updatePreferences } from '@vben/preferences';
import { getBrandingApi, type BrandingSetting } from '#/api/settings/branding';

function applyToPreferences(data: BrandingSetting | null) {
  if (data?.systemName) {
    updatePreferences({ app: { name: data.systemName } });
  }
}

export const useBrandingStore = defineStore('branding', () => {
  const branding = ref<BrandingSetting | null>(null);
  const loaded = ref(false);

  async function fetchBranding() {
    try {
      branding.value = await getBrandingApi();
      // 同步系统名称到全局标题栏（preferences.app.name）
      applyToPreferences(branding.value);
    } catch {
      // 获取失败时保持 null，前端使用默认值
      branding.value = null;
    } finally {
      loaded.value = true;
    }
  }

  function setBranding(data: BrandingSetting) {
    branding.value = data;
    // 保存后立即同步到标题栏
    applyToPreferences(data);
  }

  function $reset() {
    branding.value = null;
    loaded.value = false;
  }

  return {
    branding,
    loaded,
    fetchBranding,
    setBranding,
    $reset,
  };
});
