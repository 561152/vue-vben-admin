import { requestClient } from '#/api/request';

export interface CustomerTagItem {
  id: number;
  name: string;
  color?: string;
  customerCount?: number;
}

export async function fetchCustomerTags(): Promise<CustomerTagItem[]> {
  const res = await requestClient.get<{ items: CustomerTagItem[] }>(
    '/customer/tag',
    {
      params: { pageSize: 100 },
    },
  );

  return res.items || [];
}
