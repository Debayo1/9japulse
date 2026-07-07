import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.0.198", "192.168.0.198:3000",
    "192.168.0.200", "192.168.0.200:3000",
    "192.168.0.199", "192.168.0.199:3000",
    "localhost", "localhost:3000"
  ],
};

export default nextConfig;
