import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["mongoose", "@prisma/client", "prisma"],
};

export default nextConfig;
