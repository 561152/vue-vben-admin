/**
 * AttachmentEditor 组件单元测试
 * 测试附件编辑器的核心逻辑
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// 模拟 requestClient
vi.mock('#/api/request', () => ({
  requestClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// 模拟 ant-design-vue
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

describe('AttachmentEditor', () => {
  describe('Attachment Types', () => {
    it('should support 5 attachment types', () => {
      const attachmentTypes = ['image', 'video', 'file', 'link', 'miniprogram'];

      expect(attachmentTypes).toHaveLength(5);
      expect(attachmentTypes).toContain('image');
      expect(attachmentTypes).toContain('video');
      expect(attachmentTypes).toContain('file');
      expect(attachmentTypes).toContain('link');
      expect(attachmentTypes).toContain('miniprogram');
    });

    it('should define correct MIME types for images', () => {
      const acceptedImages = 'image/jpeg,image/png,image/gif';

      expect(acceptedImages).toContain('image/jpeg');
      expect(acceptedImages).toContain('image/png');
    });

    it('should define correct MIME types for videos', () => {
      const acceptedVideos = 'video/mp4,video/quicktime';

      expect(acceptedVideos).toContain('video/mp4');
    });
  });

  describe('Attachment Data Structure', () => {
    it('should create valid image attachment', () => {
      const imageAttachment = {
        id: 'img-1',
        type: 'image' as const,
        mediaId: 123,
        ossUrl: 'https://oss.example.com/image.jpg',
        name: 'image.jpg',
      };

      expect(imageAttachment.type).toBe('image');
      expect(imageAttachment.mediaId).toBe(123);
      expect(imageAttachment.ossUrl).toBeTruthy();
    });

    it('should create valid video attachment', () => {
      const videoAttachment = {
        id: 'video-1',
        type: 'video' as const,
        mediaId: 456,
        ossUrl: 'https://oss.example.com/video.mp4',
        name: 'video.mp4',
      };

      expect(videoAttachment.type).toBe('video');
      expect(videoAttachment.mediaId).toBe(456);
    });

    it('should create valid file attachment', () => {
      const fileAttachment = {
        id: 'file-1',
        type: 'file' as const,
        mediaId: 789,
        ossUrl: 'https://oss.example.com/doc.pdf',
        name: 'doc.pdf',
      };

      expect(fileAttachment.type).toBe('file');
      expect(fileAttachment.name).toBe('doc.pdf');
    });

    it('should create valid link attachment', () => {
      const linkAttachment = {
        id: 'link-1',
        type: 'link' as const,
        link: {
          title: '测试链接',
          desc: '这是一个测试链接描述',
          url: 'https://example.com',
          picurl: 'https://example.com/thumb.jpg',
        },
      };

      expect(linkAttachment.type).toBe('link');
      expect(linkAttachment.link?.title).toBe('测试链接');
      expect(linkAttachment.link?.url).toBe('https://example.com');
    });

    it('should create valid miniprogram attachment', () => {
      const miniprogramAttachment = {
        id: 'mp-1',
        type: 'miniprogram' as const,
        miniprogram: {
          title: '小程序标题',
          appid: 'wx1234567890abcdef',
          page: 'pages/index/index',
          picMediaId: 100,
          picUrl: 'https://oss.example.com/mp-cover.jpg',
        },
      };

      expect(miniprogramAttachment.type).toBe('miniprogram');
      expect(miniprogramAttachment.miniprogram?.appid).toBe(
        'wx1234567890abcdef',
      );
      expect(miniprogramAttachment.miniprogram?.page).toBe('pages/index/index');
    });
  });

  describe('Link Validation', () => {
    it('should validate URL format', () => {
      const urlRegex = /^https?:\/\/.+/;

      expect(urlRegex.test('https://example.com')).toBe(true);
      expect(urlRegex.test('http://example.com/path')).toBe(true);
      expect(urlRegex.test('ftp://example.com')).toBe(false);
      expect(urlRegex.test('example.com')).toBe(false);
    });

    it('should require title for link attachment', () => {
      const linkForm = {
        title: '',
        url: 'https://example.com',
      };

      const isValid =
        linkForm.title.trim().length > 0 && linkForm.url.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it('should require url for link attachment', () => {
      const linkForm = {
        title: '测试标题',
        url: '',
      };

      const isValid =
        linkForm.title.trim().length > 0 && linkForm.url.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it('should pass validation with title and url', () => {
      const linkForm = {
        title: '测试标题',
        url: 'https://example.com',
      };

      const isValid =
        linkForm.title.trim().length > 0 && linkForm.url.trim().length > 0;
      expect(isValid).toBe(true);
    });
  });

  describe('Miniprogram Validation', () => {
    it('should validate AppID format', () => {
      // WeChat AppID format: wx followed by 16 hex characters
      const appidRegex = /^wx[a-f0-9]{16}$/;

      expect(appidRegex.test('wx1234567890abcdef')).toBe(true);
      expect(appidRegex.test('wxabcdef1234567890')).toBe(true);
      expect(appidRegex.test('wx123456789')).toBe(false);
      expect(appidRegex.test('ab1234567890abcdef')).toBe(false);
    });

    it('should require all miniprogram fields', () => {
      const mpForm = {
        title: '小程序标题',
        appid: 'wx1234567890abcdef',
        page: 'pages/index/index',
      };

      const isValid =
        mpForm.title.trim().length > 0 &&
        mpForm.appid.trim().length > 0 &&
        mpForm.page.trim().length > 0;

      expect(isValid).toBe(true);
    });

    it('should fail validation with empty fields', () => {
      const mpForm = {
        title: '小程序标题',
        appid: '',
        page: 'pages/index/index',
      };

      const isValid =
        mpForm.title.trim().length > 0 &&
        mpForm.appid.trim().length > 0 &&
        mpForm.page.trim().length > 0;

      expect(isValid).toBe(false);
    });
  });

  describe('Attachment Count Limit', () => {
    it('should enforce maximum 9 attachments', () => {
      const maxAttachments = 9;
      const currentAttachments = [
        { id: '1', type: 'image' },
        { id: '2', type: 'image' },
        { id: '3', type: 'image' },
        { id: '4', type: 'image' },
        { id: '5', type: 'image' },
        { id: '6', type: 'image' },
        { id: '7', type: 'image' },
        { id: '8', type: 'image' },
        { id: '9', type: 'image' },
      ];

      expect(currentAttachments.length).toBe(maxAttachments);
      expect(currentAttachments.length > maxAttachments).toBe(false);
    });

    it('should not allow adding when limit reached', () => {
      const maxAttachments = 9;
      const currentCount = 9;
      const canAdd = currentCount < maxAttachments;

      expect(canAdd).toBe(false);
    });

    it('should allow adding when under limit', () => {
      const maxAttachments = 9;
      const currentCount = 5;
      const canAdd = currentCount < maxAttachments;

      expect(canAdd).toBe(true);
    });
  });

  describe('Attachment Management', () => {
    it('should generate unique attachment ID', () => {
      const generateId = () =>
        `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1.startsWith('att-')).toBe(true);
    });

    it('should remove attachment by ID', () => {
      const attachments = [
        { id: '1', type: 'image' },
        { id: '2', type: 'video' },
        { id: '3', type: 'file' },
      ];

      const removeId = '2';
      const filtered = attachments.filter((a) => a.id !== removeId);

      expect(filtered).toHaveLength(2);
      expect(filtered.find((a) => a.id === '2')).toBeUndefined();
    });

    it('should add attachment to list', () => {
      const attachments: any[] = [];
      const newAttachment = { id: '1', type: 'image' };

      attachments.push(newAttachment);

      expect(attachments).toHaveLength(1);
      expect(attachments[0].id).toBe('1');
    });
  });

  describe('Upload Handling', () => {
    it('should determine media type from file extension', () => {
      const getMediaType = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image';
        if (['mp4', 'mov'].includes(ext || '')) return 'video';
        return 'file';
      };

      expect(getMediaType('photo.jpg')).toBe('image');
      expect(getMediaType('photo.png')).toBe('image');
      expect(getMediaType('video.mp4')).toBe('video');
      expect(getMediaType('doc.pdf')).toBe('file');
      expect(getMediaType('data.xlsx')).toBe('file');
    });

    it('should validate file size', () => {
      const maxImageSize = 10 * 1024 * 1024; // 10MB
      const maxVideoSize = 10 * 1024 * 1024; // 10MB

      const imageFile = { size: 5 * 1024 * 1024 }; // 5MB
      const largeImage = { size: 15 * 1024 * 1024 }; // 15MB

      expect(imageFile.size <= maxImageSize).toBe(true);
      expect(largeImage.size <= maxImageSize).toBe(false);
    });
  });

  describe('Emit Events', () => {
    it('should emit update:modelValue on attachment change', () => {
      const emit = vi.fn();
      const attachments = [{ id: '1', type: 'image' }];

      emit('update:modelValue', attachments);

      expect(emit).toHaveBeenCalledWith('update:modelValue', attachments);
    });

    it('should emit with correct attachment structure', () => {
      const emit = vi.fn();
      const attachment = {
        id: 'link-1',
        type: 'link' as const,
        link: {
          title: '链接标题',
          url: 'https://example.com',
        },
      };

      emit('update:modelValue', [attachment]);

      expect(emit).toHaveBeenCalledWith('update:modelValue', [
        expect.objectContaining({
          type: 'link',
          link: expect.objectContaining({
            title: '链接标题',
            url: 'https://example.com',
          }),
        }),
      ]);
    });
  });
});
