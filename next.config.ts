import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
    const T = 'http://31.97.56.148:3098'
    return ['/t.js', '/track', '/session', '/feedback'].map((p) => ({ source: p, destination: `${T}${p}` }))
  },
};

export default nextConfig;
