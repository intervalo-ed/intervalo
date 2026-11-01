import { createRequire } from "node:module";
import path from "node:path";

import type { NextConfig } from "next";

// La copia de react-query que resuelve la app (web), no la de dx-core. Relativa
// al cwd porque resolveAlias de Turbopack no acepta rutas absolutas.
const reactQuery = path
  .relative(
    process.cwd(),
    path.dirname(createRequire(import.meta.url).resolve("@tanstack/react-query/package.json")),
  )
  .split(path.sep)
  .join("/")


const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // La lógica del juego vive en packages/dx-core como TypeScript sin compilar,
  // compartida con la app nativa.
  transpilePackages: ["@intervalo/dx-core"],
  // UNA sola copia de react-query. dx-core lo declara como peer y como
  // devDependency, y en el install de Vercel cada paquete del workspace puede
  // quedar con su propia copia: el bundle terminaba con dos contextos, el
  // QueryClientProvider de la app en uno y los hooks de dx-core leyendo el otro
  // ("No QueryClient set") y /derivadas caía al error boundary.
  turbopack: {
    resolveAlias: {
      "@tanstack/react-query": reactQuery.startsWith(".") ? reactQuery : `./${reactQuery}`,
    },
  },
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
