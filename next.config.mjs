/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bodo0tgbs4falkp7.public.blob.vercel-storage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'stfu.nyc3.cdn.digitaloceanspaces.com',
        port: '',
      },
    ],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
