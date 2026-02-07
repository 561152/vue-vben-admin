import CryptoJS from 'crypto-js';

/**
 * "记住我"数据结构
 */
export interface RememberMeData {
  username: string;
  tenantCode?: string;
  timestamp: number;
}

/**
 * "记住我"加密存储助手
 *
 * 功能：
 * - AES 加密存储用户名和租户代码
 * - 30 天自动过期
 * - 支持从环境变量读取加密密钥
 */
export class RememberMeHelper {
  private static readonly STORAGE_KEY = `REMEMBER_ME_${location.hostname}`;
  private static readonly EXPIRY_DAYS = 30;
  private static readonly SECRET_KEY =
    import.meta.env.VITE_REMEMBER_ME_SECRET || 'omnireach-default-secret-key';

  /**
   * AES 加密并存储"记住我"数据
   */
  static encrypt(data: RememberMeData): void {
    const dataWithTimestamp: RememberMeData = {
      ...data,
      timestamp: Date.now(),
    };

    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(dataWithTimestamp),
      this.SECRET_KEY,
    ).toString();

    localStorage.setItem(this.STORAGE_KEY, encrypted);
  }

  /**
   * AES 解密并读取"记住我"数据
   * @returns 解密后的数据，如果不存在或已过期则返回 null
   */
  static decrypt(): RememberMeData | null {
    const encrypted = localStorage.getItem(this.STORAGE_KEY);
    if (!encrypted) {
      return null;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, this.SECRET_KEY);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedStr) {
        // 解密失败（可能是密钥错误）
        this.clear();
        return null;
      }

      const data: RememberMeData = JSON.parse(decryptedStr);

      // 检查是否过期（30 天）
      const expiryMs = this.EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > expiryMs) {
        this.clear();
        return null;
      }

      return data;
    } catch (error) {
      // 解密失败或数据格式错误
      console.error('Failed to decrypt remember-me data:', error);
      this.clear();
      return null;
    }
  }

  /**
   * 清除"记住我"数据
   */
  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 检查是否有记住的数据
   */
  static hasData(): boolean {
    return this.decrypt() !== null;
  }
}
