import { ref } from 'vue';
import { fetchCustomerTags, type CustomerTagItem } from './customer-tags';

export function useCustomerTags() {
  const tags = ref<CustomerTagItem[]>([]);

  const loadTags = async () => {
    try {
      tags.value = await fetchCustomerTags();
    } catch (error) {
      console.error(error);
    }
  };

  return {
    tags,
    loadTags,
  };
}
