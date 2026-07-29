import { auth } from "@clerk/nextjs/server"
import TestConfig from "./test-config"

export default async function TestPage() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return <TestConfig />
}
