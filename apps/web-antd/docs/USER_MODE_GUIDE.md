# 用户模式切换使用指南

## 📋 概述

用户模式切换功能允许在"家长模式"和"孩子模式"之间切换，提供不同的内容展示策略：

- **家长模式** - 显示完整分析、统计数据、专业术语
- **孩子模式** - 显示引导提示、激励内容、简化界面

---

## 🎯 核心组件

### 1. UserModeStore (Pinia Store)

**位置**: `src/store/modules/user-mode.ts`

**用法**:
```typescript
import { useUserModeStore } from '#/store/modules/user-mode';

const modeStore = useUserModeStore();

// 检查当前模式
if (modeStore.isParentMode) {
  // 家长模式逻辑
}

// 切换模式
modeStore.switchToChildMode();
modeStore.switchToParentMode();
modeStore.toggleMode(); // 在两种模式间切换

// 根据模式获取文本
const text = modeStore.getText(
  '这是家长看到的专业术语',
  '这是孩子看到的友好提示'
);

// 检查是否应该显示某个功能
if (modeStore.shouldShow('showDetailedAnalysis')) {
  // 显示详细分析
}
```

**可用配置**:
```typescript
interface UserModeConfig {
  showDetailedAnalysis: boolean; // 显示详细分析
  showStatistics: boolean;       // 显示统计数据
  showAnswers: boolean;          // 显示答案
  showSolutions: boolean;        // 显示解析
  showEncouragement: boolean;    // 显示鼓励语
  showGameElements: boolean;     // 显示游戏化元素
  language: 'professional' | 'friendly';
  complexity: 'simple' | 'detailed';
}
```

### 2. UserModeSwitch 组件

**位置**: `src/components/UserModeSwitch/index.vue`

**用法**:
```vue
<template>
  <Card>
    <template #title>
      <Space>
        <span>页面标题</span>
        <UserModeSwitch @change="handleModeChange" />
      </Space>
    </template>

    <!-- 页面内容 -->
  </Card>
</template>

<script setup lang="ts">
import UserModeSwitch from '#/components/UserModeSwitch/index.vue';

function handleModeChange(mode: 'PARENT' | 'CHILD') {
  console.log('Mode changed to:', mode);
  // 可以重新加载数据或调整UI
}
</script>
```

**Props**:
- `showLabel?: boolean` - 是否显示模式标签（默认 true）
- `size?: 'small' | 'default' | 'large'` - 组件大小

**Events**:
- `change: (mode: 'PARENT' | 'CHILD') => void` - 模式切换事件

### 3. ModeContent 组件

**位置**: `src/components/ModeContent/index.vue`

**用法**:
```vue
<template>
  <!-- 方式 1: 指定模式 -->
  <ModeContent mode="PARENT">
    <template #parent>
      <p>仅在家长模式显示</p>
    </template>
  </ModeContent>

  <ModeContent mode="CHILD">
    <template #child>
      <p>仅在孩子模式显示</p>
    </template>
  </ModeContent>

  <!-- 方式 2: 基于功能开关 -->
  <ModeContent feature="showStatistics">
    <Card title="统计图表">
      <!-- 仅在 showStatistics 为 true 时显示 -->
    </Card>
  </ModeContent>

  <!-- 方式 3: 两种模式都显示（自动适配） -->
  <ModeContent mode="BOTH">
    <template #parent>
      <DetailedView />
    </template>
    <template #child>
      <SimplifiedView />
    </template>
  </ModeContent>
</template>
```

**Props**:
- `mode?: 'PARENT' | 'CHILD' | 'BOTH'` - 内容适用的模式
- `feature?: string` - 基于功能开关的显示控制

---

## 🔧 实际应用场景

### 场景 1: 批改结果展示

**家长模式**:
```vue
<template>
  <div v-if="modeStore.isParentMode">
    <Descriptions bordered>
      <DescriptionsItem label="正确率">{{ accuracy }}%</DescriptionsItem>
      <DescriptionsItem label="知识点掌握度">{{ masteryRate }}%</DescriptionsItem>
      <DescriptionsItem label="错误类型">{{ errorTypes }}</DescriptionsItem>
      <DescriptionsItem label="建议复习时间">{{ reviewTime }}</DescriptionsItem>
    </Descriptions>

    <Alert
      message="家长指导建议"
      :description="parentGuidance"
      type="warning"
      show-icon
    />
  </div>
</template>
```

**孩子模式**:
```vue
<template>
  <div v-else>
    <Result status="success" title="太棒了！做对了 17 题！">
      <template #extra>
        <Progress :percent="accuracy" stroke-color="#52c41a" />
        <div class="encouragement">
          <span class="emoji">⭐</span>
          <p>继续保持！你已经掌握了大部分知识点</p>
          <p>有 3 道题可以再练习一下哦~</p>
        </div>
      </template>
    </Result>
  </div>
</template>
```

### 场景 2: 错题展示

**家长模式** - 显示完整信息:
```vue
<template>
  <div v-if="modeStore.config.showDetailedAnalysis">
    <div class="question-detail">
      <h4>题目</h4>
      <p>{{ question.content }}</p>

      <h4>学生答案</h4>
      <p>{{ question.studentAnswer }}</p>

      <h4 v-if="modeStore.config.showAnswers">正确答案</h4>
      <p v-if="modeStore.config.showAnswers">{{ question.correctAnswer }}</p>

      <h4 v-if="modeStore.config.showSolutions">解析</h4>
      <p v-if="modeStore.config.showSolutions">{{ question.solution }}</p>

      <h4>AI 分析</h4>
      <p>{{ question.aiAnalysis }}</p>

      <h4>学习建议</h4>
      <p>{{ question.aiSuggestion }}</p>
    </div>
  </div>
</template>
```

**孩子模式** - 隐藏答案，提供提示:
```vue
<template>
  <div v-else>
    <div class="question-simple">
      <h4>题目 {{ index + 1 }}</h4>
      <p>{{ question.content }}</p>

      <Alert
        v-if="modeStore.config.showEncouragement"
        message="小提示"
        :description="question.hint"
        type="info"
        show-icon
      />

      <Button type="primary" @click="showHint">
        需要帮助吗？
      </Button>
    </div>
  </div>
</template>
```

### 场景 3: 成长档案

**家长模式**:
```vue
<template>
  <Card title="学习进度分析" v-if="modeStore.isParentMode">
    <Row :gutter="16">
      <Col :span="6">
        <Statistic title="本月学习天数" :value="studyDays" suffix="天" />
      </Col>
      <Col :span="6">
        <Statistic title="平均正确率" :value="avgAccuracy" suffix="%" />
      </Col>
      <Col :span="6">
        <Statistic title="掌握知识点" :value="masteredPoints" suffix="个" />
      </Col>
      <Col :span="6">
        <Statistic title="待复习题目" :value="reviewCount" suffix="道" />
      </Col>
    </Row>

    <Divider />

    <!-- 详细图表 -->
    <div v-if="modeStore.config.showStatistics">
      <Chart type="line" :data="progressData" />
      <Chart type="radar" :data="abilityData" />
    </div>
  </Card>
</template>
```

**孩子模式**:
```vue
<template>
  <Card title="我的成长记录" v-else>
    <!-- 游戏化展示 -->
    <div class="achievement-showcase">
      <div class="level-badge">
        <img src="/assets/badge-level-5.png" alt="等级徽章" />
        <p>学习达人 Lv.5</p>
      </div>

      <Progress
        type="circle"
        :percent="experiencePercent"
        :format="() => `${currentExp}/${nextLevelExp}`"
      />

      <div class="recent-achievements">
        <h4>最近获得的勋章 🏆</h4>
        <Space>
          <img
            v-for="badge in recentBadges"
            :key="badge.id"
            :src="badge.icon"
            :alt="badge.name"
            class="badge-icon"
          />
        </Space>
      </div>
    </div>
  </Card>
</template>
```

### 场景 4: 动态文本替换

```vue
<script setup lang="ts">
import { useUserModeStore } from '#/store/modules/user-mode';

const modeStore = useUserModeStore();

// 根据模式返回不同的文本
const welcomeText = computed(() => {
  return modeStore.getText(
    '欢迎回来！让我们查看孩子最近的学习情况。',
    '欢迎回来！准备好继续学习了吗？'
  );
});

const buttonText = computed(() => {
  return modeStore.getText('查看详细报告', '开始学习');
});

const errorMessage = computed(() => {
  return modeStore.getText(
    '本题涉及二次函数的顶点式，需要掌握配方法。',
    '这道题目有点难，我们一起再想想办法吧！'
  );
});
</script>
```

---

## 🎨 UI 适配建议

### 颜色方案

**家长模式** - 专业、沉稳:
```less
.parent-mode {
  --primary-color: #1890ff; // 专业蓝
  --text-color: rgba(0, 0, 0, 0.85);
  --background-color: #f0f2f5;
}
```

**孩子模式** - 活泼、温暖:
```less
.child-mode {
  --primary-color: #52c41a; // 活力绿
  --text-color: rgba(0, 0, 0, 0.75);
  --background-color: #fff7e6; // 温暖背景
}
```

### 字体大小

**家长模式** - 标准字体:
```less
.parent-mode {
  font-size: 14px;
  line-height: 1.5;
}
```

**孩子模式** - 稍大字体:
```less
.child-mode {
  font-size: 16px;
  line-height: 1.8;
}
```

### 图标和表情

**家长模式** - 使用专业图标:
```vue
<CheckCircleOutlined /> <!-- 对勾图标 -->
<CloseCircleOutlined /> <!-- 错误图标 -->
<BarChartOutlined />    <!-- 统计图标 -->
```

**孩子模式** - 使用 Emoji:
```vue
<span class="emoji">✅</span> <!-- 对勾 -->
<span class="emoji">❌</span> <!-- 错误 -->
<span class="emoji">⭐</span> <!-- 星星 -->
<span class="emoji">🎉</span> <!-- 庆祝 -->
```

---

## 🔄 状态持久化

模式状态会自动保存到 `localStorage`，页面刷新后保持：

```typescript
// 自动保存
modeStore.switchMode('CHILD'); // 自动保存到 localStorage

// 手动保存（修改配置后）
modeStore.updateConfig({ showAnswers: false });
// 自动保存

// 加载存储的状态（Store 初始化时自动执行）
modeStore.loadFromStorage();

// 清除存储
modeStore.clearStorage();
```

**存储键**: `omnireach:user-mode`

**存储格式**:
```json
{
  "mode": "PARENT",
  "config": {
    "mode": "PARENT",
    "showDetailedAnalysis": true,
    "showStatistics": true,
    "showAnswers": true,
    "showSolutions": true,
    "showEncouragement": false,
    "showGameElements": false,
    "language": "professional",
    "complexity": "detailed"
  },
  "timestamp": 1706947200000
}
```

---

## 📱 响应式适配

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useUserModeStore } from '#/store/modules/user-mode';
import { useBreakpoints } from '@vueuse/core';

const modeStore = useUserModeStore();
const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024,
});

// 在移动端自动切换到孩子模式（简化界面）
const effectiveMode = computed(() => {
  if (breakpoints.smaller('tablet').value) {
    return 'CHILD'; // 移动端强制简化
  }
  return modeStore.currentMode;
});
</script>
```

---

## ✅ 最佳实践

### 1. 页面级别使用

在每个需要模式切换的页面顶部添加切换器：

```vue
<template>
  <div class="page-container">
    <PageHeader title="页面标题">
      <template #extra>
        <UserModeSwitch />
      </template>
    </PageHeader>

    <div class="page-content">
      <!-- 页面内容 -->
    </div>
  </div>
</template>
```

### 2. 组件级别适配

在可复用组件中使用 Store 适配：

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useUserModeStore } from '#/store/modules/user-mode';

const modeStore = useUserModeStore();

const componentText = computed(() => {
  return modeStore.getText('专业术语', '友好提示');
});

const shouldShowDetail = computed(() => {
  return modeStore.config.showDetailedAnalysis;
});
</script>
```

### 3. 性能优化

使用计算属性缓存模式相关的计算：

```vue
<script setup lang="ts">
const filteredData = computed(() => {
  if (modeStore.isChildMode) {
    // 孩子模式：过滤掉复杂数据
    return rawData.value.filter(item => item.difficulty <= 3);
  }
  // 家长模式：显示全部
  return rawData.value;
});
</script>
```

### 4. 测试建议

```typescript
// 单元测试
describe('UserModeStore', () => {
  it('should switch mode correctly', () => {
    const store = useUserModeStore();
    store.switchToChildMode();
    expect(store.isChildMode).toBe(true);
  });

  it('should persist to localStorage', () => {
    const store = useUserModeStore();
    store.switchToParentMode();
    expect(localStorage.getItem('omnireach:user-mode')).toBeTruthy();
  });
});

// E2E 测试
test('mode switch should update UI', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('[data-testid="mode-switch"]');
  await expect(page.locator('.child-mode-indicator')).toBeVisible();
});
```

---

## 🐛 常见问题

### Q1: 模式切换后数据没有更新？

**A**: 确保使用 `computed` 或 `watch` 监听模式变化：

```typescript
watch(() => modeStore.currentMode, (newMode) => {
  // 重新加载数据或调整UI
  loadData(newMode);
});
```

### Q2: LocalStorage 数据损坏？

**A**: Store 初始化时会自动处理错误，回退到默认配置。如果需要手动清理：

```typescript
modeStore.clearStorage();
modeStore.loadFromStorage(); // 重新加载默认配置
```

### Q3: 如何禁用某个页面的模式切换？

**A**: 不显示 `UserModeSwitch` 组件即可，但 Store 状态仍然可用：

```vue
<template>
  <!-- 不添加 UserModeSwitch 组件 -->
  <Card title="仅家长可见">
    <div v-if="modeStore.isParentMode">
      <!-- 内容 -->
    </div>
    <Alert v-else message="此页面仅限家长模式查看" type="warning" />
  </Card>
</template>
```

---

## 📚 相关文档

- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Ant Design Vue 组件](https://antdv.com/components/overview)

---

**最后更新**: 2026-02-03
