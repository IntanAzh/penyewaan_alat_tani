import nextEnv from "@next/env";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { loadEnvConfig } = nextEnv;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(projectRoot);
const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
