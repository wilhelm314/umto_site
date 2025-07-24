import type { NextConfig } from "next";
import { webpack } from "next/dist/compiled/webpack/webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  // // Required to generate static HTML files that don't depend on the Node.js server
  // distDir: '../static', // Output to a directory the FastAPI server can access
  // images: {
  //   unoptimized: true, // Required for static export
  // },
  // trailingSlash: true, // Recommended for static exports
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination:
          true //process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/:path*"
            : "/api/",
      },
      // {
      //   source: "/docs",
      //   destination:
      //     process.env.NODE_ENV === "development"
      //       ? "http://127.0.0.1:8000/api/py/docs"
      //       : "/api/py/docs",
      // },
      // {
      //   source: "/openapi.json",
      //   destination:
      //     process.env.NODE_ENV === "development"
      //       ? "http://127.0.0.1:8000/api/openapi.json"
      //       : "/api/py/openapi.json",
      // },
    ];
  },
}

module.exports = nextConfig

// const nextConfig: NextConfig = {
//   /* config options here */
//   async rewrites() {
//     return [
//       {
//         source: '/api/:path*',
//         destination: 'http://localhost:8000/api/:path*', // Proxy to Backend
//       },
//     ];
//   },
// };

export default nextConfig;
