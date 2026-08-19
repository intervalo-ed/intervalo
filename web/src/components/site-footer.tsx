import Image from "next/image"
import Link from "next/link"
import { Wordmark } from "@/components/wordmark"

// El footer de las páginas públicas (landing, about, privacidad). Vivía
// duplicado byte a byte en marketing-home.tsx y about/page.tsx; la única
// diferencia real era el botón izquierdo del banner violeta, que acá es prop:
// la landing invita a conocer más y las demás páginas vuelven al inicio.
// Server-safe a propósito: about y privacidad son server components.
export function SiteFooter({
  leftHref,
  leftLabel,
}: {
  leftHref: string
  leftLabel: string
}) {
  return (
    <footer>
      <div className="flex flex-col items-center gap-5 bg-[#7E80F7] px-6 py-16 text-center">
        <h2 className="max-w-[28rem] font-sans text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-[1.25] text-[#131324]">
          No pierdas lo que ya entendiste.
        </h2>
        <p className="text-[0.875rem] text-[rgba(19,19,36,0.65)]">
          Repasá de forma inteligente haciendo un poco todos los días.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={leftHref}
            className="inline-flex h-[52px] items-center justify-center rounded-[4px] border-[1.5px] border-[rgba(19,19,36,0.35)] bg-transparent px-8 font-mono text-[0.9rem] font-medium uppercase tracking-[0.1em] text-[#131324] transition-colors duration-150 hover:border-[rgba(19,19,36,0.5)] hover:bg-[rgba(19,19,36,0.08)]"
          >
            {leftLabel}
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex h-[52px] items-center justify-center rounded-[4px] bg-[#131324] px-8 font-mono text-[0.9rem] font-medium uppercase tracking-[0.1em] text-[#7E80F7] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(0,0,0,0.4)]"
          >
            Probar ahora
          </Link>
        </div>
      </div>

      <div className="bg-[#1A1A2A] px-5 py-10">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/nvranco"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <Image
                src="https://avatars.githubusercontent.com/nvranco"
                alt="Nicolás Vrancovich"
                width={44}
                height={44}
                unoptimized
                className="rounded-md object-cover grayscale brightness-[0.85]"
              />
              <div className="flex flex-col gap-px">
                <span className="text-[0.85rem] font-medium text-[#F6F8FC]">
                  Nicolás Vrancovich
                </span>
                <span className="font-mono text-[0.7rem] text-[#768899]">
                  @nvranco
                </span>
              </div>
            </a>
          </div>
          <div className="pr-12 max-md:pr-6">
            <Wordmark textClass="text-[1.1rem]" barClass="h-[2px]" />
          </div>
        </div>
        <div className="mx-auto flex max-w-[960px] flex-col items-center gap-1.5 pt-6 text-center text-[0.68rem] text-[#768899]">
          <p>Intervalo 2026. Desarrollado por y para estudiantes.</p>
          <Link
            href="/privacidad"
            className="underline underline-offset-2 transition-colors hover:text-[#F6F8FC]"
          >
            Política de privacidad
          </Link>
        </div>
      </div>
    </footer>
  )
}
