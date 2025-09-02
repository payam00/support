import type { NextConfig } from "next";
import path from 'path';
const nextConfig: NextConfig = {
    eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true, 
  // Add the sassOptions configuration here
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src/styles')],
  },
};

export default nextConfig;
