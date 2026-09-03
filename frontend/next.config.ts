import type { NextConfig } from "next";


import { paraglide } from "@inlang/paraglide-next/plugin";

import path from "path";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return [
      {
        source: "/blog/:slug.md",
        destination: "/api/markdown/blog/:slug",
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      "$paraglide/runtime.js": "./paraglide/runtime.js",
    },
  },
};

export default paraglide({
  paraglide: {
    project: "./project.inlang",
    outdir: "./paraglide",
  },
  ...nextConfig,
});
