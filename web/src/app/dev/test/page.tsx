import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import TestConfig from "./test-config"

// Herramienta de QA para jugar ítems sueltos `(belt, topic, skill)` sin tocar
// el progreso. No está linkeada desde ningún lado, pero mientras vivió dentro
// de `(app)` cualquiera podía llegar tipeando la URL en producción. Solo existe
// en `next dev`: en producción la ruta es 404.
export default async function DevTestPage() {
  if (process.env.NODE_ENV === "production") notFound()

  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return <TestConfig />
}
