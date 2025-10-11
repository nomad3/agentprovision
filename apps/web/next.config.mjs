import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
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
      "@/lib": path.join(__dirname, "lib"),
      "@/components": path.join(__dirname, "components"),
    }
    return config
  },
}

export default nextConfig
