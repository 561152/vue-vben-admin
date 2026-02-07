<template>
  <div class="faq-page">
    <Card>
      <template #title>
        <Space>
          <QuestionCircleOutlined />
          常见问题 (FAQ)
        </Space>
      </template>

      <!-- 搜索栏 -->
      <div class="search-section mb-4">
        <InputSearch
          v-model:value="searchQuery"
          placeholder="搜索常见问题..."
          size="large"
          allow-clear
          @search="handleSearch"
        >
          <template #enterButton>
            <Button type="primary">
              <SearchOutlined /> 搜索
            </Button>
          </template>
        </InputSearch>
      </div>

      <!-- 分类标签 -->
      <div class="category-section mb-4">
        <Space wrap>
          <Tag
            :color="selectedCategory === 'all' ? 'blue' : 'default'"
            class="category-tag"
            @click="handleCategoryClick('all')"
          >
            全部
          </Tag>
          <Tag
            v-for="category in categories"
            :key="category.value"
            :color="selectedCategory === category.value ? 'blue' : 'default'"
            class="category-tag"
            @click="handleCategoryClick(category.value)"
          >
            {{ category.label }}
          </Tag>
        </Space>
      </div>

      <!-- 热门问题（搜索前显示） -->
      <div v-if="!searchQuery && selectedCategory === 'all'" class="popular-section mb-4">
        <Card title="🔥 热门问题" size="small" :bordered="false">
          <List
            :data-source="popularFAQs"
            :loading="loadingPopular"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <ListItem class="faq-item" @click="handleFAQClick(item)">
                <ListItemMeta>
                  <template #title>
                    <a>{{ item.question }}</a>
                  </template>
                  <template #description>
                    <Space>
                      <Tag :color="getCategoryColor(item.category)">
                        {{ getCategoryLabel(item.category) }}
                      </Tag>
                      <Tag v-if="item.grade" color="green">
                        {{ item.grade }}
                      </Tag>
                      <Tag v-if="item.subject" color="purple">
                        {{ item.subject }}
                      </Tag>
                      <span class="popularity-text">
                        <FireOutlined /> {{ item.popularity }} 次查看
                      </span>
                    </Space>
                  </template>
                </ListItemMeta>
                <template #actions>
                  <RightOutlined />
                </template>
              </ListItem>
            </template>
          </List>
        </Card>
      </div>

      <!-- FAQ 列表（搜索或分类筛选后显示） -->
      <div v-if="searchQuery || selectedCategory !== 'all'" class="results-section">
        <div class="results-header mb-3">
          <Space>
            <span class="results-count">
              找到 <strong>{{ displayedFAQs.length }}</strong> 个相关问题
            </span>
            <Button
              v-if="searchQuery || selectedCategory !== 'all'"
              type="link"
              size="small"
              @click="handleReset"
            >
              重置筛选
            </Button>
          </Space>
        </div>

        <Spin :spinning="loading">
          <Collapse v-model:active-key="activeKeys" accordion>
            <CollapsePanel
              v-for="faq in displayedFAQs"
              :key="faq.id"
              :header="faq.question"
            >
              <template #extra>
                <Space>
                  <Tag :color="getCategoryColor(faq.category)">
                    {{ getCategoryLabel(faq.category) }}
                  </Tag>
                </Space>
              </template>

              <!-- FAQ 答案 -->
              <div class="faq-answer">
                <Alert :message="faq.answer" type="info" show-icon>
                  <template #icon>
                    <BulbOutlined />
                  </template>
                </Alert>

                <!-- 相关问题 -->
                <div v-if="faq.relatedQuestions.length > 0" class="related-questions mt-4">
                  <Divider orientation="left">
                    <small>相关问题</small>
                  </Divider>
                  <Space direction="vertical" style="width: 100%">
                    <Button
                      v-for="relatedId in faq.relatedQuestions"
                      :key="relatedId"
                      type="link"
                      size="small"
                      @click="handleRelatedClick(relatedId)"
                    >
                      <LinkOutlined /> {{ getRelatedQuestionTitle(relatedId) }}
                    </Button>
                  </Space>
                </div>

                <!-- 反馈按钮 -->
                <div class="feedback-section mt-4">
                  <Divider />
                  <Space>
                    <span class="feedback-label">这个回答有帮助吗？</span>
                    <Button
                      type="text"
                      size="small"
                      :class="{ 'feedback-active': feedbackMap[faq.id] === 'helpful' }"
                      @click="handleFeedback(faq.id, 'helpful')"
                    >
                      <LikeOutlined /> 有帮助
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      :class="{ 'feedback-active': feedbackMap[faq.id] === 'not-helpful' }"
                      @click="handleFeedback(faq.id, 'not-helpful')"
                    >
                      <DislikeOutlined /> 没帮助
                    </Button>
                  </Space>
                </div>
              </div>
            </CollapsePanel>
          </Collapse>

          <!-- 空状态 -->
          <Empty
            v-if="displayedFAQs.length === 0"
            description="没有找到相关问题"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          >
            <template #footer>
              <Button type="primary" @click="handleContactCounselor">
                <CustomerServiceOutlined /> 咨询 AI 咨询师
              </Button>
            </template>
          </Empty>
        </Spin>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Card,
  Input,
  Button,
  Space,
  Tag,
  List,
  ListItem,
  ListItemMeta,
  Collapse,
  CollapsePanel,
  Alert,
  Divider,
  Empty,
  Spin,
  message,
} from 'ant-design-vue';
import {
  QuestionCircleOutlined,
  SearchOutlined,
  FireOutlined,
  RightOutlined,
  BulbOutlined,
  LinkOutlined,
  LikeOutlined,
  DislikeOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons-vue';
import { requestClient } from '#/api/request';
import { useRouter } from 'vue-router';

const InputSearch = Input.Search;

// ==================== Interfaces ====================

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  relatedQuestions: string[];
  popularity: number;
  grade?: string;
  subject?: string;
}

// ==================== State ====================

const router = useRouter();
const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const activeKeys = ref<string[]>([]);
const loading = ref(false);
const loadingPopular = ref(false);

const allFAQs = ref<FAQItem[]>([]);
const popularFAQs = ref<FAQItem[]>([]);
const displayedFAQs = ref<FAQItem[]>([]);
const feedbackMap = ref<Record<string, 'helpful' | 'not-helpful'>>({});

// 分类配置
const categories = [
  { value: 'LEARNING_METHOD', label: '学习方法' },
  { value: 'MOTIVATION', label: '学习动机' },
  { value: 'HOMEWORK_GUIDANCE', label: '作业指导' },
  { value: 'EXAM_PREPARATION', label: '考试准备' },
  { value: 'TIME_MANAGEMENT', label: '时间管理' },
  { value: 'PARENT_CHILD', label: '亲子沟通' },
  { value: 'SUBJECT_SPECIFIC', label: '学科专项' },
  { value: 'PSYCHOLOGICAL', label: '心理辅导' },
];

// ==================== Computed ====================

const categoryMap = computed(() => {
  const map: Record<string, string> = {};
  categories.forEach((cat) => {
    map[cat.value] = cat.label;
  });
  return map;
});

// ==================== Methods ====================

/**
 * 获取所有 FAQ
 */
async function fetchAllFAQs() {
  try {
    const response = await requestClient.get('/api/ai-doctor/counselor/faq');
    allFAQs.value = response.data || [];
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
    message.error('加载常见问题失败');
  }
}

/**
 * 获取热门 FAQ
 */
async function fetchPopularFAQs() {
  loadingPopular.value = true;
  try {
    const response = await requestClient.get('/api/ai-doctor/counselor/faq/popular', {
      params: { limit: 10 },
    });
    popularFAQs.value = response.data || [];
  } catch (error) {
    console.error('Failed to fetch popular FAQs:', error);
  } finally {
    loadingPopular.value = false;
  }
}

/**
 * 搜索 FAQ
 */
async function handleSearch() {
  if (!searchQuery.value.trim()) {
    displayedFAQs.value = [];
    return;
  }

  loading.value = true;
  try {
    const response = await requestClient.get('/api/ai-doctor/counselor/faq/search', {
      params: { q: searchQuery.value },
    });
    displayedFAQs.value = response.data || [];
  } catch (error) {
    console.error('Failed to search FAQs:', error);
    message.error('搜索失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 处理分类点击
 */
async function handleCategoryClick(category: string) {
  selectedCategory.value = category;
  searchQuery.value = ''; // 清空搜索

  if (category === 'all') {
    displayedFAQs.value = [];
    return;
  }

  loading.value = true;
  try {
    const response = await requestClient.get(
      `/api/ai-doctor/counselor/faq/category/${category}`,
    );
    displayedFAQs.value = response.data || [];
  } catch (error) {
    console.error('Failed to fetch category FAQs:', error);
    message.error('加载分类问题失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 处理 FAQ 点击（跟踪热度）
 */
async function handleFAQClick(faq: FAQItem) {
  // 打开折叠面板
  activeKeys.value = [faq.id];

  // 如果当前没有显示在列表中，先获取该分类的 FAQ
  if (displayedFAQs.value.length === 0) {
    await handleCategoryClick(faq.category);
  }

  // 跟踪点击
  try {
    await requestClient.post(`/api/ai-doctor/counselor/faq/${faq.id}/click`);
    // 更新本地热度
    faq.popularity += 1;
  } catch (error) {
    console.error('Failed to track FAQ click:', error);
  }
}

/**
 * 处理相关问题点击
 */
function handleRelatedClick(relatedId: string) {
  const relatedFAQ = [...allFAQs.value, ...displayedFAQs.value].find(
    (faq) => faq.id === relatedId,
  );
  if (relatedFAQ) {
    handleFAQClick(relatedFAQ);
  }
}

/**
 * 获取相关问题标题
 */
function getRelatedQuestionTitle(relatedId: string): string {
  const faq = [...allFAQs.value, ...displayedFAQs.value].find(
    (item) => item.id === relatedId,
  );
  return faq?.question || '相关问题';
}

/**
 * 重置筛选
 */
function handleReset() {
  searchQuery.value = '';
  selectedCategory.value = 'all';
  displayedFAQs.value = [];
  activeKeys.value = [];
}

/**
 * 获取分类颜色
 */
function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    LEARNING_METHOD: 'blue',
    MOTIVATION: 'green',
    HOMEWORK_GUIDANCE: 'orange',
    EXAM_PREPARATION: 'red',
    TIME_MANAGEMENT: 'purple',
    PARENT_CHILD: 'cyan',
    SUBJECT_SPECIFIC: 'magenta',
    PSYCHOLOGICAL: 'geekblue',
  };
  return colorMap[category] || 'default';
}

/**
 * 获取分类标签
 */
function getCategoryLabel(category: string): string {
  return categoryMap.value[category] || category;
}

/**
 * 处理反馈
 */
function handleFeedback(faqId: string, type: 'helpful' | 'not-helpful') {
  feedbackMap.value[faqId] = type;
  message.success(type === 'helpful' ? '感谢您的反馈！' : '我们会改进这个回答');
}

/**
 * 联系咨询师
 */
function handleContactCounselor() {
  router.push('/ai-doctor/counselor');
}

// ==================== Lifecycle ====================

onMounted(async () => {
  await Promise.all([fetchAllFAQs(), fetchPopularFAQs()]);
});
</script>

<style scoped lang="less">
.faq-page {
  padding: 16px;

  .search-section {
    margin-bottom: 24px;
  }

  .category-section {
    .category-tag {
      cursor: pointer;
      transition: all 0.3s;
      padding: 4px 12px;
      font-size: 14px;

      &:hover {
        transform: scale(1.05);
      }
    }
  }

  .popular-section {
    .faq-item {
      cursor: pointer;
      transition: all 0.2s;
      padding: 12px 16px;
      border-radius: 4px;

      &:hover {
        background-color: #f5f5f5;
      }

      .popularity-text {
        color: #999;
        font-size: 12px;
      }
    }
  }

  .results-section {
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .results-count {
        font-size: 14px;
        color: #666;
      }
    }

    .faq-answer {
      .related-questions {
        :deep(.ant-btn-link) {
          padding-left: 0;
        }
      }

      .feedback-section {
        .feedback-label {
          color: #666;
          font-size: 13px;
        }

        .feedback-active {
          color: #1890ff;
          font-weight: 500;
        }
      }
    }
  }
}
</style>
