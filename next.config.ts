import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Permite que o build termine mesmo com erros de lint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora erros de tipagem durante o build
    ignoreBuildErrors: true,
  },
  output: "standalone",
};

export default nextConfig;
