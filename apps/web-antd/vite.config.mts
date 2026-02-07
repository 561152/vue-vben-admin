import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        host: '0.0.0.0',
        port: 5666,
        strictPort: true, // 如果端口被占用则报错，而不是自动切换端口
        proxy: {
          '/api': {
            changeOrigin: true,
            // 代理到后端 API 服务 (测试环境使用 5100)
            target: process.env.VITE_API_URL || 'http://localhost:5100',
            ws: true,
          },
        },
      },
    },
  };
});
