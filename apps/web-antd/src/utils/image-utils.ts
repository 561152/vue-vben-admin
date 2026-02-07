import imageCompression from 'browser-image-compression';

/**
 * 智能图片压缩
 *
 * 自动判断是否需要压缩，并根据阈值进行压缩
 *
 * @param file - 原始图片文件
 * @param thresholdMB - 压缩阈值（MB），超过此大小才压缩，默认 3MB
 * @returns 压缩结果（可能是原图或压缩后的图片）
 */
export async function autoCompressImage(file: File, thresholdMB = 3) {
  const fileSizeMB = file.size / 1024 / 1024;

  // 小于阈值，不压缩
  if (fileSizeMB <= thresholdMB) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressed: false,
    };
  }

  // 压缩配置
  const options = {
    maxSizeMB: 2, // 目标大小 2MB
    maxWidthOrHeight: 2048, // 最大宽高 2048px
    useWebWorker: true, // 使用 Web Worker 提升性能
    initialQuality: 0.8, // 初始质量
  };

  try {
    const compressed = await imageCompression(file, options);

    return {
      file: compressed,
      originalSize: file.size,
      compressedSize: compressed.size,
      compressed: true,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    // 压缩失败，返回原图
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 格式化文件大小为可读字符串
 *
 * @param bytes - 字节数
 * @returns 格式化的字符串（如 "1.5 MB"）
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 从 File 对象加载图片
 *
 * @param file - 图片文件
 * @returns HTMLImageElement Promise
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Canvas 转 File
 *
 * @param canvas - Canvas 元素
 * @param filename - 文件名
 * @param type - MIME 类型
 * @param quality - 质量（0-1）
 * @returns File Promise
 */
export function canvasToFile(
  canvas: HTMLCanvasElement,
  filename: string,
  type = 'image/jpeg',
  quality = 0.92,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas to Blob failed'));
          return;
        }
        const file = new File([blob], filename, { type });
        resolve(file);
      },
      type,
      quality,
    );
  });
}
