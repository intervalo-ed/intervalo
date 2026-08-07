import { Wordmark } from "@/components/wordmark"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Acerca de Intervalo",
}

const GRID_BG_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
}

export default function AboutPage() {
  return (
    <main className="bg-[#131324] font-sans text-[#F6F8FC]">
      <nav className="sticky top-0 z-10 border-b border-[#38385A] bg-[#1A1A2A] px-5 py-3.5">
        <div className="mx-auto flex max-w-[960px] items-center justify-center">
          <Link href="/" className="inline-flex flex-col items-center gap-[5px] leading-none">
            <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
          </Link>
        </div>
      </nav>

      {/* Problema */}
      <section className="border-b border-[#38385A] px-5 py-20" style={GRID_BG_STYLE}>
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Incorporar lo que ya entendimos
          </h2>

          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            El <span className="font-medium text-[#F6F8FC]">entendimiento</span> y el{" "}
            <span className="font-medium text-[#F6F8FC]">repaso</span> son dos partes esenciales
            en nuestro proceso de aprendizaje.
          </p>

          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Una vez que entendemos algo nuevo, incorporarlo a nuestra forma de resolver
            problemas, a nuestra intuición, requiere una práctica sostenida en el tiempo. Si no
            repasamos lo que entendemos, la tendencia natural es a olvidarlo.
          </p>

          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Cuando eso pasa, perdemos la oportunidad de aplicar lo que nos costó tiempo y
            esfuerzo entender, ya sea como base para otros conceptos, para rendir un examen, o
            para tener más herramientas al momento de plantear y resolver problemas de la vida
            real.
          </p>

          <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] font-semibold leading-[1.8] text-[#F6F8FC]">
            Repasar con frecuencia determina si lo que entendimos va a estar disponible cuando lo
            necesitamos.
          </p>
        </div>
      </section>

      {/* Propuesta */}
      <section className="border-b border-[#38385A] px-5 py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Para eso estamos
          </h2>

          <p className="mb-10 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            <span className="font-semibold text-[#F6F8FC]">Intervalo</span> convierte el repaso de
            conceptos en algo dinámico, entretenido y eficiente, a través de una interfaz
            gamificada y un algoritmo que automatiza las decisiones de qué y cuándo repasar.
          </p>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
                Gamificación
              </h3>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                Convierte el repaso en una experiencia con{" "}
                <span className="font-medium text-[#F6F8FC]">progresión visible</span>. A través
                del sistema de progreso, el estudiante ve en todo momento dónde está parado y
                hacia dónde va.
              </p>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                Transforma algo que puede sentirse como una obligación en algo concreto y
                motivador.
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
                Algoritmo
              </h3>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                Registra el desempeño en cada ejercicio y ajusta continuamente{" "}
                <span className="font-medium text-[#F6F8FC]">
                  qué practicar y con qué frecuencia
                </span>
                .
              </p>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                Los conceptos consolidados se repasan menos; los débiles, más. El tiempo se
                invierte donde más importa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Estructura */}
      <section className="border-b border-[#38385A] px-5 py-20" style={GRID_BG_STYLE}>
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            La estructura de fondo
          </h2>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">Cursos</h3>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                Cada curso agrupa el banco de ejercicios y el progreso de una materia.
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">Temas</h3>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                Cada curso se divide en temas, que organizan los contenidos y el progreso en el mismo.
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
                Habilidades
              </h3>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                Cada tema define habilidades puntuales que el estudiante tiene que incorporar.
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
                Ejercicios
              </h3>
              <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
                Los ejercicios son la unidad mínima de práctica: breves, específicos y diseñados
                para que el estudiante razone y visualice el problema antes de resolverlo.
              </p>
            </div>
          </div>
        </div>
      </section>

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
              href="/"
              className="inline-flex h-[52px] items-center justify-center rounded-[4px] border-[1.5px] border-[rgba(19,19,36,0.35)] bg-transparent px-8 font-mono text-[0.9rem] font-medium uppercase tracking-[0.1em] text-[#131324] transition-colors duration-150 hover:border-[rgba(19,19,36,0.5)] hover:bg-[rgba(19,19,36,0.08)]"
            >
              Volver
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
                  <span className="font-mono text-[0.7rem] text-[#768899]">@nvranco</span>
                </div>
              </a>
            </div>
            <div className="pr-12 max-md:pr-6">
              <Wordmark textClass="text-[1.1rem]" barClass="h-[2px]" />
            </div>
          </div>
          <div className="mx-auto max-w-[960px] pt-6 text-center text-[0.68rem] text-[#768899]">
            <p>Intervalo 2026. Desarrollado por y para estudiantes.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
