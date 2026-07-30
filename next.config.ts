/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora erros de tipagem durante o build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora erros de lint durante o build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
