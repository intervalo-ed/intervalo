import { clerkMiddleware } from '@clerk/nextjs/server'

// Sin chequeos de auth acá: cada recurso protegido llama a auth.protect() por su
// cuenta (ver src/app/(app)/**). clerkMiddleware() sigue siendo necesario para
// que auth() funcione en los server components.
export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|mp3|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
