/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/avatars/**",
      },
      // not sure if this could be combined or not based on Next.JS documentation
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "embed/avatars/*",
      },
    ],
  },
};

export default config;
