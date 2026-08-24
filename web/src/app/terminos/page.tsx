import { TerminosContent } from "@/components/legal-content"
import { SiteFooter } from "@/components/site-footer"
import { Wordmark } from "@/components/wordmark"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Términos y condiciones",
}

// El cuerpo vive en legal-content.tsx, compartido con el panel del onboarding.
export default function TerminosPage() {
  return (
    <main className="bg-[#131324] font-sans text-[#F6F8FC]">
      <nav className="sticky top-0 z-10 border-b border-[#38385A] bg-[#1A1A2A] px-5 py-3.5">
        <div className="mx-auto flex max-w-[960px] items-center justify-center">
          <Link href="/" className="inline-flex flex-col items-center gap-[5px] leading-none">
            <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
          </Link>
        </div>
      </nav>

      <TerminosContent />

      <SiteFooter leftHref="/" leftLabel="Volver" />
    </main>
  )
}
