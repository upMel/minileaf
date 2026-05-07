declare module "next-pwa" {
  import type { NextConfig } from "next";

  export type NextPwaOptions = {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
  };

  export default function nextPwa(
    options: NextPwaOptions
  ): (nextConfig: NextConfig) => NextConfig;
}
