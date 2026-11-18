import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // 親フォルダのlockfileをルートと誤認して入れ子の .next を作らないよう、
    // このプロジェクト直下をルートに固定する。
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;