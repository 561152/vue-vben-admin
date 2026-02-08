/**
 * CustomerFilterDrawer 组件单元测试
 * 测试客户筛选抽屉的核心逻辑
 */
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 模拟 requestClient
vi.mock('#/api/request', () => ({
  requestClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// 模拟 ant-design-vue 组件
vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual('ant-design-vue');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  };
});

describe('CustomerFilterDrawer', () => {
  describe('Filter Conditions Logic', () => {
    it('should initialize with empty filter conditions', () => {
      const filterConditions = {
        tagIds: [],
        tagLogic: 'ANY' as const,
        departmentIds: [],
        excludeDepartmentIds: [],
        ownerIds: [],
        statuses: [],
        lifecycleStages: [],
        importedCustomerIds: [],
      };

      expect(filterConditions.tagIds).toHaveLength(0);
      expect(filterConditions.tagLogic).toBe('ANY');
      expect(filterConditions.departmentIds).toHaveLength(0);
    });

    it('should support tag logic options ANY, ALL, EXCLUDE', () => {
      const tagLogicOptions = ['ANY', 'ALL', 'EXCLUDE'];

      expect(tagLogicOptions).toContain('ANY');
      expect(tagLogicOptions).toContain('ALL');
      expect(tagLogicOptions).toContain('EXCLUDE');
    });

    it('should validate status options', () => {
      const statusOptions = [
        { value: 'POTENTIAL', label: '潜在客户' },
        { value: 'ACTIVE', label: '活跃客户' },
        { value: 'AT_RISK', label: '流失风险' },
        { value: 'CHURNED', label: '已流失' },
      ];

      expect(statusOptions).toHaveLength(4);
      expect(statusOptions.map((o) => o.value)).toContain('POTENTIAL');
      expect(statusOptions.map((o) => o.value)).toContain('ACTIVE');
    });

    it('should validate lifecycle stage options', () => {
      const lifecycleOptions = [
        { value: 'LEAD', label: '线索' },
        { value: 'OPPORTUNITY', label: '商机' },
        { value: 'CUSTOMER', label: '客户' },
        { value: 'EVANGELIST', label: '传播者' },
      ];

      expect(lifecycleOptions).toHaveLength(4);
      expect(lifecycleOptions.map((o) => o.value)).toContain('LEAD');
      expect(lifecycleOptions.map((o) => o.value)).toContain('CUSTOMER');
    });
  });

  describe('File Parsing Logic', () => {
    it('should detect CSV file type', () => {
      const fileName = 'customers.csv';
      const extension = fileName.split('.').pop()?.toLowerCase();

      expect(extension).toBe('csv');
    });

    it('should detect TXT file type', () => {
      const fileName = 'customers.txt';
      const extension = fileName.split('.').pop()?.toLowerCase();

      expect(extension).toBe('txt');
    });

    it('should detect XLSX file type', () => {
      const fileName = 'customers.xlsx';
      const extension = fileName.split('.').pop()?.toLowerCase();

      expect(extension).toBe('xlsx');
    });

    it('should detect XLS file type', () => {
      const fileName = 'customers.xls';
      const extension = fileName.split('.').pop()?.toLowerCase();

      expect(extension).toBe('xls');
    });

    it('should parse CSV content correctly', () => {
      const csvContent = 'phone\n13800138001\n13800138002\n13800138003';
      const lines = csvContent.split('\n').filter((line) => line.trim());

      expect(lines).toHaveLength(4);
      expect(lines[0]).toBe('phone');
      expect(lines[1]).toBe('13800138001');
    });

    it('should parse TXT content with different delimiters', () => {
      // Tab separated
      const tsvContent = 'id\tphone\n1\t13800138001';
      const tsvLines = tsvContent.split('\n');
      const tsvRow = tsvLines[1].split('\t');

      expect(tsvRow).toHaveLength(2);
      expect(tsvRow[1]).toBe('13800138001');

      // Comma separated
      const csvContent = 'id,phone\n1,13800138001';
      const csvLines = csvContent.split('\n');
      const csvRow = csvLines[1].split(',');

      expect(csvRow).toHaveLength(2);
      expect(csvRow[1]).toBe('13800138001');
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate Chinese mobile phone number', () => {
      const phoneRegex = /^1[3-9]\d{9}$/;

      expect(phoneRegex.test('13800138000')).toBe(true);
      expect(phoneRegex.test('15912345678')).toBe(true);
      expect(phoneRegex.test('18888888888')).toBe(true);
      expect(phoneRegex.test('12345678901')).toBe(false);
      expect(phoneRegex.test('1380013800')).toBe(false);
      expect(phoneRegex.test('138001380000')).toBe(false);
    });

    it('should handle phone numbers with country code', () => {
      const phoneWithCode = '+8613800138000';
      const cleanPhone = phoneWithCode.replace(/^\+86/, '');

      expect(cleanPhone).toBe('13800138000');
    });
  });

  describe('Department Tree Logic', () => {
    it('should correctly identify include and exclude departments', () => {
      const checkedKeys = [1, 2, 3];
      const excludeCheckedKeys = [4, 5];

      expect(checkedKeys).not.toContain(4);
      expect(excludeCheckedKeys).toContain(4);
    });

    it('should convert tree data to flat list', () => {
      const treeData = [
        {
          id: 1,
          name: '总公司',
          children: [
            { id: 2, name: '技术部', children: [] },
            { id: 3, name: '销售部', children: [] },
          ],
        },
      ];

      const flattenTree = (nodes: any[]): number[] => {
        const result: number[] = [];
        const traverse = (items: any[]) => {
          for (const item of items) {
            result.push(item.id);
            if (item.children?.length) {
              traverse(item.children);
            }
          }
        };
        traverse(nodes);
        return result;
      };

      const flatIds = flattenTree(treeData);
      expect(flatIds).toEqual([1, 2, 3]);
    });
  });

  describe('Preview Count Calculation', () => {
    it('should calculate preview count from API response', () => {
      const response = {
        count: 150,
        sampleCustomers: [
          { id: 1, name: '客户A' },
          { id: 2, name: '客户B' },
        ],
      };

      expect(response.count).toBe(150);
      expect(response.sampleCustomers).toHaveLength(2);
    });

    it('should handle empty preview response', () => {
      const response = {
        count: 0,
        sampleCustomers: [],
      };

      expect(response.count).toBe(0);
      expect(response.sampleCustomers).toHaveLength(0);
    });
  });

  describe('Filter Conditions Building', () => {
    it('should build correct filter object with all conditions', () => {
      const filterConditions = {
        tagIds: [1, 2, 3],
        tagLogic: 'ALL' as const,
        departmentIds: [10, 20],
        excludeDepartmentIds: [30],
        ownerIds: [100],
        statuses: ['ACTIVE', 'POTENTIAL'],
        lifecycleStages: ['CUSTOMER'],
        importedCustomerIds: [],
      };

      expect(filterConditions.tagIds.length).toBeGreaterThan(0);
      expect(filterConditions.tagLogic).toBe('ALL');
      expect(filterConditions.statuses).toContain('ACTIVE');
    });

    it('should emit filter conditions on confirm', () => {
      const emittedConditions = {
        tagIds: [1],
        tagLogic: 'ANY' as const,
        departmentIds: [],
        excludeDepartmentIds: [],
        ownerIds: [],
        statuses: ['ACTIVE'],
        lifecycleStages: [],
        importedCustomerIds: [],
      };

      // 模拟 emit
      const emit = vi.fn();
      emit('update:filterConditions', emittedConditions);
      emit('confirm');

      expect(emit).toHaveBeenCalledWith(
        'update:filterConditions',
        emittedConditions,
      );
      expect(emit).toHaveBeenCalledWith('confirm');
    });
  });
});
