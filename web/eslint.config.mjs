import clerkNext from "@clerk/eslint-plugin/next"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import { defineConfig, globalIgnores } from "eslint/config"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "@clerk/next": clerkNext },
    rules: {
      // Reemplaza al createRouteMatcher del proxy: cada page/layout/route/server
      // function bajo una carpeta protegida tiene que llamar a auth.protect().
      // Las rutas de src/app son públicas salvo el grupo (app); todo lo que vive
      // fuera de src/app arranca protegido para que una server function nueva en
      // una carpeta compartida no pase sin chequeo.
      "@clerk/next/require-auth-protection": [
        "error",
        {
          public: ["src/app/**"],
          protected: ["**", "src/app/(app)/**"],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
