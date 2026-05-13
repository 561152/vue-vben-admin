declare module 'crypto-js' {
  interface CryptoJsWordArray {
    toString(encoder?: unknown): string;
  }

  interface CryptoJsCipherParams {
    toString(): string;
  }

  const CryptoJS: {
    AES: {
      decrypt(ciphertext: string, key: string): CryptoJsWordArray;
      encrypt(message: string, key: string): CryptoJsCipherParams;
    };
    enc: {
      Utf8: unknown;
    };
  };

  export default CryptoJS;
}
