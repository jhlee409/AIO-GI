import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // eslint-config-next 15 runs during `next build`; this repo has many pre-existing lint issues.
    ignoreDuringBuilds: true,
  },
  // Fix Next.js workspace root detection issue
  // This ensures Next.js uses the correct root directory for node_modules resolution
  outputFileTracingRoot: path.join(__dirname),
  // Increase body size limit for file uploads (EMT videos and images can be large)
  experimental: {
    serverActions: {
      bodySizeLimit: '250mb',
    },
  },
  // Fix Windows/OneDrive symlink issues
  // outputFileTracingIncludes 제거 - Next.js가 자동으로 필요한 파일만 추적
  // 이 설정이 메모리 과다 사용의 주요 원인이므로 제거
  // outputFileTracingIncludes: {
  //   '/**/*': ['./**/*'],
  // },
  // Disable symlink resolution for Windows compatibility
  webpack: (config, { isServer }) => {
    if (process.platform === 'win32') {
      config.resolve.symlinks = false;
    }
    
    // 메모리 최적화: 클라이언트 번들 최적화
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // 큰 라이브러리들을 별도 청크로 분리하여 메모리 사용 최적화
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
          },
        },
      };
    }
    
    return config;
  },
};

export default nextConfig;
