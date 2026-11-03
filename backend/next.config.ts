import { loadEnvConfig } from "@next/env";
import { resolve } from "node:path";
import type { NextConfig } from "next";

loadEnvConfig(resolve(process.cwd()));
const nextConfig: NextConfig = {};
export default nextConfig;
