/** @type {import('next').NextConfig} */
const apiTarget = process.env.API_PROXY_TARGET;

const nextConfig = {
  // Lets the browser call the API on the web origin (/api/...), e.g. behind a single-port preview or proxy.
  async rewrites() {
    return apiTarget ? [{ source: "/api/:path*", destination: `${apiTarget}/:path*` }] : [];
  },
};

export default nextConfig;
