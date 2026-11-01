import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // La lógica del juego vive en packages/dx-core como TypeScript sin compilar,
  // compartida con la app nativa.
  transpilePackages: ["@intervalo/dx-core"],
  // Una sola copia de react-query en el bundle, la de la web.
  //
  // dx-core declara react-query como peer y además como devDependency (para su
  // propio typecheck), así que tiene su propio `node_modules/@tanstack/react-query`.
  // Si ese no apunta al MISMO directorio que el de la web —basta con que la
  // instalación lo deje como copia y no como symlink, cosa que pasó en Vercel—,
  // el bundler mete dos módulos distintos: el `QueryClientProvider` de
  // providers.tsx registra el cliente en el contexto de una copia y los hooks de
  // dx-core lo buscan en el de la otra. Resultado: "No QueryClient set" en
  // /derivadas, que es la única ruta que usa los hooks de dx-core.
  //
  // El alias es relativo a `web/`, así que todo `@tanstack/react-query` —se
  // importe desde donde se importe— resuelve al de la web.
  turbopack: {
    resolveAlias: {
      "@tanstack/react-query": "./node_modules/@tanstack/react-query",
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
