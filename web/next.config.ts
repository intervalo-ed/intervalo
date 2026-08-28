import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      {
        // El juego vivió unas horas en /derivemos, mientras probábamos ese
        // nombre. Volvió a /derivadas al unificar la marca bajo Intervalo.
        //
        // OJO: esta regla apunta al revés que la que hubo antes. Si quedaran las
        // dos, /derivadas y /derivemos se redirigirían mutuamente y la ruta del
        // juego sería un bucle infinito.
        source: "/derivemos",
        destination: "/derivadas",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
