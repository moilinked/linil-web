import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "*": ["node_modules/@swc/helpers/**/*"],
  },
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/api/files/favicon.ico",
      },
    ]
  },
}

export default nextConfig
