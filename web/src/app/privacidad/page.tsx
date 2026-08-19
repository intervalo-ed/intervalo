import { SiteFooter } from "@/components/site-footer"
import { Wordmark } from "@/components/wordmark"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de privacidad",
}

const GRID_BG_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
}

// Un dato y para qué se usa, en una línea. La política entera está escrita
// alrededor de esta idea: si no podemos decir para qué guardamos algo, no lo
// tenemos que guardar.
function DataItem({ name, why }: { name: string; why: string }) {
  return (
    <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
      <span className="font-medium text-[#F6F8FC]">{name}.</span> {why}
    </p>
  )
}

export default function PrivacidadPage() {
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
            Política de privacidad
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Lo esencial, en tres frases: usamos tus datos para que Intervalo
            funcione y para mejorarlo.{" "}
            <span className="font-medium text-[#F6F8FC]">
              No los vendemos ni los compartimos con terceros para sus propios
              fines.
            </span>{" "}
            Y podés pedirnos verlos, corregirlos o borrarlos cuando quieras.
          </p>
          <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            El resto de esta página explica eso mismo con detalle, sin letra
            chica: qué guardamos, para qué, y qué derechos tenés.
          </p>
        </div>
      </section>

      {/* Qué datos guardamos */}
      <section className="border-b border-[#38385A] px-5 py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Qué datos guardamos
          </h2>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
                Tu cuenta
              </h3>
              <DataItem
                name="Tu nombre y tu email"
                why="Vienen de tu cuenta de Google cuando iniciás sesión. Tu contraseña no la vemos ni la guardamos nunca: el ingreso lo maneja Google."
              />
              <DataItem
                name="Lo que nos contás al registrarte"
                why="Tu universidad, tu carrera, qué te trajo a Intervalo, y el apodo y nombre de usuario que elegís. Sirven para armar el ranking de universidades y para entender a quién le estamos sirviendo."
              />
            </div>

            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
                Tu práctica
              </h3>
              <DataItem
                name="Tus sesiones y respuestas"
                why="Qué ejercicios hiciste, si los acertaste, cuánto tardaste, tu experiencia y tu racha. Este historial es el corazón del producto: el repaso espaciado decide qué te conviene repasar y cuándo mirando exactamente esto. Sin él, Intervalo no funciona."
              />
            </div>

            <div className="flex flex-col gap-3.5">
              <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
                Tu dispositivo
              </h3>
              <DataItem
                name="Datos técnicos"
                why="Si entrás desde iPhone, Android o computadora, si usás la app instalada o el navegador, tu zona horaria y desde qué link llegaste. Los usamos para que la app se comporte bien en tu dispositivo y para saber qué canales de difusión funcionan."
              />
              <DataItem
                name="Notificaciones"
                why="Solo si las activás: la suscripción de tu navegador y el horario que elegiste para los recordatorios. Se borra en cuanto las desactivás."
              />
              <DataItem
                name="Lo que nos escribís"
                why="El feedback y los reportes de ejercicios que mandás desde la app. Los leemos para arreglar lo que está mal."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Para qué los usamos */}
      <section className="border-b border-[#38385A] px-5 py-20" style={GRID_BG_STYLE}>
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Para qué los usamos
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Para tres cosas.{" "}
            <span className="font-medium text-[#F6F8FC]">
              Que el producto funcione
            </span>
            : planificar tus repasos, mantener tu progreso y tu racha, armar el
            ranking.{" "}
            <span className="font-medium text-[#F6F8FC]">Mejorarlo</span>:
            mirar métricas de uso para entender qué anda, qué confunde y qué
            falta.{" "}
            <span className="font-medium text-[#F6F8FC]">Avisarte</span>: los
            recordatorios de repaso que hayas activado y algún email si hace
            mucho que no venís — todos con baja en un click.
          </p>
          <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Nada más. No hay publicidad en Intervalo, así que tus datos no se
            usan para perfilarte ni para venderte nada.
          </p>
        </div>
      </section>

      {/* Con quién los compartimos */}
      <section className="border-b border-[#38385A] px-5 py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Con quién los compartimos
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            <span className="font-medium text-[#F6F8FC]">
              Con nadie, para sus propios fines.
            </span>{" "}
            No vendemos datos, no los alquilamos, no los cedemos a anunciantes
            ni a nadie que quiera usarlos para lo suyo.
          </p>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Lo que sí existe, como en casi cualquier servicio, son proveedores
            de infraestructura que procesan datos por cuenta nuestra y solo
            para que Intervalo funcione: Google para el inicio de sesión (vía
            Clerk), PostHog para las métricas de uso, Resend para mandar
            emails, y Railway y Vercel donde corren la base de datos y la
            aplicación. Cada uno con sus propias obligaciones de
            confidencialidad y seguridad.
          </p>
          <div className="flex flex-col gap-3.5">
            <h3 className="font-sans text-[1.15rem] font-semibold text-[#F6F8FC]">
              Qué es público
            </h3>
            <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
              Tu nombre de usuario, tu universidad y tu experiencia aparecen en el ranking,
              visibles para otros usuarios: es la parte del juego de bancar a tu
              universidad.{" "}
              <span className="font-medium text-[#F6F8FC]">
                Tu nombre real y tu email no se muestran nunca.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Tus derechos */}
      <section className="border-b border-[#38385A] px-5 py-20" style={GRID_BG_STYLE}>
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Tus derechos
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Tus datos son tuyos. Podés pedirnos{" "}
            <span className="font-medium text-[#F6F8FC]">
              verlos, corregirlos o borrarlos por completo
            </span>{" "}
            — incluida tu cuenta — escribiendo a{" "}
            <a
              href="mailto:hola@intervalo.xyz"
              className="font-medium text-[#F6F8FC] underline underline-offset-2 transition-colors hover:text-[#7E80F7]"
            >
              hola@intervalo.xyz
            </a>{" "}
            desde el email con el que te registraste. Te respondemos nosotros,
            no un sistema.
          </p>
          <p className="max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Intervalo opera desde Argentina y se rige por la Ley 25.326 de
            Protección de Datos Personales. Eso te garantiza, entre otras
            cosas, el acceso gratuito a tus datos a intervalos no menores a
            seis meses. La Agencia de Acceso a la Información Pública, como
            órgano de control de la ley, atiende denuncias y reclamos por
            incumplimiento de las normas de protección de datos.
          </p>
        </div>
      </section>

      {/* Cambios */}
      <section className="border-b border-[#38385A] px-5 py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]">
            Si esto cambia
          </h2>
          <p className="mb-8 max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]">
            Si alguna vez cambiamos qué datos guardamos o para qué, lo vas a
            leer acá antes de que pase, con la fecha actualizada. No vamos a
            esconder cambios importantes en una edición silenciosa.
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
