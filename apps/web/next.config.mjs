/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: new URL("../../", import.meta.url).pathname
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://127.0.0.1:3001/api/v1/:path*"
      }
    ];
  }
};

export default nextConfig;
