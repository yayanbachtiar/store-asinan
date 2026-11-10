import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone: image Docker kecil, VPS tinggal pull & run (tanpa build di VPS).
  output: "standalone",
};

export default nextConfig;
