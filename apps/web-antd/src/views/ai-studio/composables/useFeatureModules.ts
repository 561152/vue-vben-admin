import { computed, ref } from 'vue';
import {
  getFeatureModules,
  type FeatureModule,
} from '#/api/ai-studio/pipeline';

export function useFeatureModules() {
  const featureModules = ref<FeatureModule[]>([]);
  const showFeatureFilter = computed(() => featureModules.value.length > 0);

  const loadFeatureModules = async () => {
    try {
      const modules = await getFeatureModules();
      featureModules.value = modules || [];
    } catch (error: any) {
      if (error?.response?.status === 403) {
        console.warn('No permission to view feature modules');
      } else {
        console.error('Failed to load feature modules:', error);
      }
      featureModules.value = [];
    }
  };

  return {
    featureModules,
    showFeatureFilter,
    loadFeatureModules,
  };
}
