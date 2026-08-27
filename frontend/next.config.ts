import type { NextConfig } from "next";


import { paraglide } from "@inlang/paraglide-next/plugin";

import path from "path";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
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
