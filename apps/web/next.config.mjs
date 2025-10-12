import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.dicebear.com",
      },
    ],
  },
  experimental: {
    // Ensure trace generation walks the monorepo root during standalone builds
    outputFileTracingRoot: path.join(__dirname, "..", ".."),
  },
}

export default nextConfig
