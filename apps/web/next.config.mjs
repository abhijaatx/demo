/** @type {import("next").NextConfig} */
const nextConfig = {
  // The local preview is opened through this LAN address by the desktop app.
  // This only permits Next development resources for that exact origin.
  allowedDevOrigins: ["10.2.13.175"],
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
