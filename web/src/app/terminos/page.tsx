import { SiteFooter } from "@/components/site-footer"
import { Wordmark } from "@/components/wordmark"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Términos y condiciones",
}

const GRID_BG_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
}

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

      {/* Lo esencial */}
      <section className="border-b border-[#38385A] px-5 py-20" style={GRID_BG_STYLE}>
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Términos y condiciones
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Intervalo es gratis y está para ayudarte a estudiar. Estas son las
            reglas para usarlo.{" "}
            <span className="font-medium text-[#F6F8FC]">
              Al crear tu cuenta, las estás aceptando.
            </span>
          </p>
          <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Todo lo que tenga que ver con tus datos vive en la{" "}
            <Link
              href="/privacidad"
              className="font-medium text-[#F6F8FC] underline underline-offset-2 transition-colors hover:text-[#7E80F7]"
            >
              política de privacidad
            </Link>
            , que es parte de este mismo trato.
          </p>
        </div>
      </section>

      {/* Qué es Intervalo */}
      <section className="border-b border-[#38385A] px-5 py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Qué es Intervalo, y qué no
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Intervalo es una herramienta de repaso:{" "}
            <span className="font-medium text-[#F6F8FC]">
              complementa tu cursada, no la reemplaza
            </span>
            . No sustituye las clases, la bibliografía ni la práctica de tu
            facultad, y no garantiza aprobar ningún examen — eso depende de
            muchas cosas que no controlamos. Lo que sí hacemos es ayudarte a no
            perder lo que ya entendiste.
          </p>
          <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            El contenido puede tener errores. Nos esforzamos para que no, y
            cada ejercicio tiene un botón para reportarlos.
          </p>
        </div>
      </section>

      {/* Tu cuenta y el juego limpio */}
      <section className="border-b border-[#38385A] px-5 py-20" style={GRID_BG_STYLE}>
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Tu cuenta y el juego limpio
          </h2>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
                Tu cuenta
              </h3>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                Entrás con tu cuenta de Google y es personal: tu progreso, tu
                racha y tu experiencia representan tu práctica, no la de un
                grupo. Podés borrarla cuando quieras escribiéndonos, como
                explica la política de privacidad.
              </p>
            </div>
            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
                El ranking
              </h3>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                El ranking de universidades funciona por una sola razón: los
                puntos significan práctica real de gente real.{" "}
                <span className="font-medium text-[#F6F8FC]">
                  Inflar experiencia con bots, scripts, cuentas duplicadas o
                  cualquier otra forma de trampa arruina el juego para todos
                </span>
                , así que si lo detectamos podemos resetear los puntos
                involucrados o suspender la cuenta. Si ves algo raro en el
                ranking, escribinos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* El contenido */}
      <section className="border-b border-[#38385A] px-5 py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            El contenido
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Los ejercicios, explicaciones y demás material de Intervalo son
            nuestros.{" "}
            <span className="font-medium text-[#F6F8FC]">
              Usalos para estudiar todo lo que quieras
            </span>{" "}
            — para eso están. Lo que no está permitido es copiarlos
            masivamente, scrapearlos o usarlos para armar otro producto.
          </p>
          <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Lo que nos mandás por los canales de la app — feedback, reportes de
            ejercicios, respuestas a encuestas — lo podemos usar para mejorar
            Intervalo. Es exactamente para lo que lo mandaste.
          </p>
        </div>
      </section>

      {/* Disponibilidad y responsabilidad */}
      <section className="border-b border-[#38385A] px-5 py-20" style={GRID_BG_STYLE}>
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Disponibilidad y responsabilidad
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Intervalo es un producto gratuito en desarrollo activo. Hacemos
            nuestro mejor esfuerzo para que ande siempre, pero se ofrece{" "}
            <span className="font-medium text-[#F6F8FC]">tal cual es</span>:
            puede tener interrupciones, cambiar o — esperemos que no —
            discontinuarse. Si algún día pasa algo grande con el servicio,
            vamos a intentar avisarte con tiempo.
          </p>
          <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Hasta donde la ley argentina lo permite, no respondemos por daños
            derivados de usar Intervalo o de que no esté disponible — desde una
            racha perdida por una caída hasta un examen que no salió como
            esperabas. Es una herramienta de estudio gratuita, no un servicio
            crítico.
          </p>
        </div>
      </section>

      {/* Cambios y ley aplicable */}
      <section className="border-b border-[#38385A] px-5 py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Si esto cambia
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Si alguna vez cambiamos estas reglas, lo vas a leer acá con la
            fecha actualizada, igual que en la política de privacidad. Seguir
            usando Intervalo después de un cambio es aceptarlo; si algo no te
            cierra, podés dejar de usarlo o pedirnos borrar tu cuenta.
          </p>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Intervalo opera desde Argentina y estos términos se rigen por sus
            leyes. Cualquier duda, escribinos a{" "}
            <a
              href="mailto:hola@intervalo.xyz"
              className="font-medium text-[#F6F8FC] underline underline-offset-2 transition-colors hover:text-[#7E80F7]"
            >
              hola@intervalo.xyz
            </a>
            .
          </p>
          <p className="max-w-[44rem] text-[0.875rem] leading-[1.8] text-[#768899]">
            Última actualización: agosto de 2026.
          </p>
        </div>
      </section>

      <SiteFooter leftHref="/" leftLabel="Volver" />
    </main>
  )
}
