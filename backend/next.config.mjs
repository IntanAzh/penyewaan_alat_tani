import nextEnv from "@next/env";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { loadEnvConfig } = nextEnv;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(projectRoot);

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
