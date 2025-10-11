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
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": __dirname,
      "@/lib": path.join(__dirname, "lib"),
      "@/components": path.join(__dirname, "components"),
      "@/builder": path.join(__dirname, "components", "builder"),
    }
    return config
  },
}

export default nextConfig
