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
    return config
  },
}

export default nextConfig
