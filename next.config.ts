import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone: satu server.js mandiri untuk image Docker Cloud Run.
  // Server menghormati $PORT yang disuntikkan Cloud Run.
  output: "standalone",
};

export default nextConfig;
