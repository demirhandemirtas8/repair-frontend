import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Mevcut diğer ayarlarınız (images, env vs.) buradaysa burada kalabilir

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
