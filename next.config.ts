import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Ignora erros de tipo temporariamente até que os tipos do Supabase
    // sejam gerados a partir das migrations
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
