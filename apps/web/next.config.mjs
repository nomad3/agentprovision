import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.dicebear.com",
      },
    ],
  },
  webpack: (config) => {
    config.snapshot = config.snapshot || {}
    config.snapshot.managedPaths = []
    config.snapshot.immutablePaths = []
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve?.alias || {}),
      "@": path.resolve(__dirname),
    }
    return config
  },
}

export default nextConfig
