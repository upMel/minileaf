import type { NextConfig } from "next";

import nextPwa from "next-pwa";

const withPwa = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "warply.s3.amazonaws.com",
        pathname: "/applications/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default withPwa(nextConfig);
