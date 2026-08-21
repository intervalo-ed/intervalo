"use client"

import { LegalIndex } from "@/components/legal-index"
import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"

// El cuerpo de /privacidad y /terminos, extraído de las páginas para poder
// renderizarlo también dentro del panel del onboarding (legal-sheet.tsx).
// `compact` achica el respiro vertical de cada sección para la lectura en
// panel; `onCrossLink` reemplaza la navegación de la referencia cruzada entre
// documentos por un intercambio de contenido sin cerrar el panel.

const GRID_BG_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
}

const H2_CLASS =
  "mb-10 font-sans text-[clamp(1.6rem,4vw,2.25rem)] font-semibold text-[#F6F8FC]"
const H3_CLASS = "font-sans text-[1.15rem] font-semibold text-[#F6F8FC]"
const P_CLASS =
  "max-w-[44rem] text-[clamp(1rem,3vw,1.2rem)] leading-[1.8] text-[#E6EEFA]"
const STRONG_CLASS = "font-medium text-[#F6F8FC]"
const LINK_CLASS =
  "font-medium text-[#F6F8FC] underline underline-offset-2 transition-colors hover:text-[#7E80F7]"

function Section({
  id,
  grid,
  compact,
  children,
}: {
  id?: string
  grid?: boolean
  compact: boolean
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 border-b border-[#38385A] px-5 ${compact ? "py-10" : "py-20"}`}
      style={grid ? GRID_BG_STYLE : undefined}
    >
      <div className="mx-auto max-w-[960px]">{children}</div>
    </section>
  )
}

// La referencia cruzada entre los dos documentos: en las páginas navega, en el
// panel intercambia el contenido.
function CrossLink({
  href,
  onCrossLink,
  children,
}: {
  href: string
  onCrossLink?: () => void
  children: ReactNode
}) {
  if (onCrossLink) {
    return (
      <button type="button" onClick={onCrossLink} className={LINK_CLASS}>
        {children}
      </button>
    )
  }
  return (
    <Link href={href} className={LINK_CLASS}>
      {children}
    </Link>
  )
}

// Un dato y para qué se usa, en una línea. La política entera está escrita
// alrededor de esta idea: si no podemos decir para qué guardamos algo, no lo
// tenemos que guardar.
function DataItem({ name, why }: { name: string; why: string }) {
  return (
    <p className={P_CLASS}>
      <span className={STRONG_CLASS}>{name}.</span> {why}
    </p>
  )
}

export function PrivacidadContent({
  compact = false,
  onCrossLink,
}: {
  compact?: boolean
  onCrossLink?: () => void
}) {
  return (
    <>
      {/* Lo esencial */}
      <Section grid compact={compact}>
        <h2 className={H2_CLASS}>Política de privacidad</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          Lo esencial, en tres frases: usamos tus datos para que Intervalo
          funcione y para mejorarlo.{" "}
          <span className={STRONG_CLASS}>
            No los vendemos ni los compartimos con terceros para sus propios
            fines.
          </span>{" "}
          Y podés pedirnos verlos, corregirlos o borrarlos cuando quieras.
        </p>
        <p className={P_CLASS}>
          El resto de esta página explica eso mismo con detalle, sin letra
          chica: qué guardamos, para qué, y qué derechos tenés. Y las reglas
          para usar Intervalo viven en los{" "}
          <CrossLink href="/terminos" onCrossLink={onCrossLink}>
            términos y condiciones
          </CrossLink>
          , de los que esta política es parte.
        </p>
        <LegalIndex
          items={[
            { href: "#datos", label: "Qué datos guardamos" },
            { href: "#uso", label: "Para qué los usamos" },
            { href: "#terceros", label: "Con quién los compartimos" },
            { href: "#derechos", label: "Tus derechos" },
            { href: "#cambios", label: "Si esto cambia" },
          ]}
        />
      </Section>

      {/* Qué datos guardamos */}
      <Section id="datos" compact={compact}>
        <h2 className={H2_CLASS}>Qué datos guardamos</h2>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3.5">
            <h3 className={H3_CLASS}>Tu cuenta</h3>
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
            <h3 className={H3_CLASS}>Tu práctica</h3>
            <DataItem
              name="Tus sesiones y respuestas"
              why="Qué ejercicios hiciste, si los acertaste, cuánto tardaste, tu experiencia y tu racha. Este historial es el corazón del producto: el repaso espaciado decide qué te conviene repasar y cuándo mirando exactamente esto. Sin él, Intervalo no funciona."
            />
          </div>

          <div className="flex flex-col gap-3.5">
            <h3 className={H3_CLASS}>Tu dispositivo</h3>
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
      </Section>

      {/* Para qué los usamos */}
      <Section id="uso" grid compact={compact}>
        <h2 className={H2_CLASS}>Para qué los usamos</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          Para tres cosas.{" "}
          <span className={STRONG_CLASS}>Que el producto funcione</span>:
          planificar tus repasos, mantener tu progreso y tu racha, armar el
          ranking. <span className={STRONG_CLASS}>Mejorarlo</span>: mirar
          métricas de uso para entender qué anda, qué confunde y qué falta.{" "}
          <span className={STRONG_CLASS}>Avisarte</span>: los recordatorios de
          repaso que hayas activado y algún email si hace mucho que no venís —
          todos con baja en un click.
        </p>
        <p className={P_CLASS}>
          Nada más. No hay publicidad en Intervalo, así que tus datos no se
          usan para perfilarte ni para venderte nada.
        </p>
      </Section>

      {/* Con quién los compartimos */}
      <Section id="terceros" compact={compact}>
        <h2 className={H2_CLASS}>Con quién los compartimos</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          <span className={STRONG_CLASS}>Con nadie, para sus propios fines.</span>{" "}
          No vendemos datos, no los alquilamos, no los cedemos a anunciantes ni
          a nadie que quiera usarlos para lo suyo.
        </p>
        <p className={`mb-8 ${P_CLASS}`}>
          Lo que sí existe, como en casi cualquier servicio, son proveedores de
          infraestructura que procesan datos por cuenta nuestra y solo para que
          Intervalo funcione: Google para el inicio de sesión (vía Clerk),
          PostHog para las métricas de uso, Resend para mandar emails, y
          Railway y Vercel donde corren la base de datos y la aplicación. Cada
          uno con sus propias obligaciones de confidencialidad y seguridad.
        </p>
        <div className="flex flex-col gap-3.5">
          <h3 className={H3_CLASS}>Qué es público</h3>
          <p className={P_CLASS}>
            Tu nombre de usuario, tu universidad y tu experiencia aparecen en
            el ranking, visibles para otros usuarios: es la parte del juego de
            bancar a tu universidad.{" "}
            <span className={STRONG_CLASS}>
              Tu nombre real y tu email no se muestran nunca.
            </span>
          </p>
        </div>
      </Section>

      {/* Tus derechos */}
      <Section id="derechos" grid compact={compact}>
        <h2 className={H2_CLASS}>Tus derechos</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          Tus datos son tuyos. Podés pedirnos{" "}
          <span className={STRONG_CLASS}>
            verlos, corregirlos o borrarlos por completo
          </span>{" "}
          — incluida tu cuenta — escribiendo a{" "}
          <a href="mailto:hola@intervalo.xyz" className={LINK_CLASS}>
            hola@intervalo.xyz
          </a>{" "}
          desde el email con el que te registraste. Te respondemos nosotros, no
          un sistema.
        </p>
        <p className={P_CLASS}>
          Intervalo opera desde Argentina y se rige por la Ley 25.326 de
          Protección de Datos Personales. Eso te garantiza, entre otras cosas,
          el acceso gratuito a tus datos a intervalos no menores a seis meses.
          La Agencia de Acceso a la Información Pública, como órgano de control
          de la ley, atiende denuncias y reclamos por incumplimiento de las
          normas de protección de datos.
        </p>
      </Section>

      {/* Cambios */}
      <Section id="cambios" compact={compact}>
        <h2 className={H2_CLASS}>Si esto cambia</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          Si alguna vez cambiamos qué datos guardamos o para qué, lo vas a leer
          acá antes de que pase, con la fecha actualizada. No vamos a esconder
          cambios importantes en una edición silenciosa.
        </p>
        <p className="max-w-[44rem] text-[0.875rem] leading-[1.8] text-[#768899]">
          Última actualización: agosto de 2026.
        </p>
      </Section>
    </>
  )
}

export function TerminosContent({
  compact = false,
  onCrossLink,
}: {
  compact?: boolean
  onCrossLink?: () => void
}) {
  return (
    <>
      {/* Lo esencial */}
      <Section grid compact={compact}>
        <h2 className={H2_CLASS}>Términos y condiciones</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          Intervalo es gratis y está para ayudarte a estudiar. Estas son las
          reglas para usarlo.{" "}
          <span className={STRONG_CLASS}>
            Al crear tu cuenta, las estás aceptando.
          </span>
        </p>
        <p className={P_CLASS}>
          Todo lo que tenga que ver con tus datos vive en la{" "}
          <CrossLink href="/privacidad" onCrossLink={onCrossLink}>
            política de privacidad
          </CrossLink>
          , que es parte de este mismo trato.
        </p>
        <LegalIndex
          items={[
            { href: "#que-es", label: "Qué es Intervalo, y qué no" },
            { href: "#cuenta", label: "Tu cuenta y el juego limpio" },
            { href: "#contenido", label: "El contenido" },
            { href: "#disponibilidad", label: "Disponibilidad y responsabilidad" },
            { href: "#cambios", label: "Si esto cambia" },
          ]}
        />
      </Section>

      {/* Qué es Intervalo */}
      <Section id="que-es" compact={compact}>
        <h2 className={H2_CLASS}>Qué es Intervalo, y qué no</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          Intervalo es una herramienta de repaso:{" "}
          <span className={STRONG_CLASS}>
            complementa tu cursada, no la reemplaza
          </span>
          . No sustituye las clases, la bibliografía ni la práctica de tu
          facultad, y no garantiza aprobar ningún examen — eso depende de
          muchas cosas que no controlamos. Lo que sí hacemos es ayudarte a no
          perder lo que ya entendiste.
        </p>
        <p className={P_CLASS}>
          El contenido puede tener errores. Nos esforzamos para que no, y cada
          ejercicio tiene un botón para reportarlos.
        </p>
      </Section>

      {/* Tu cuenta y el juego limpio */}
      <Section id="cuenta" grid compact={compact}>
        <h2 className={H2_CLASS}>Tu cuenta y el juego limpio</h2>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3.5">
            <h3 className={H3_CLASS}>Tu cuenta</h3>
            <p className={P_CLASS}>
              Entrás con tu cuenta de Google y es personal: tu progreso, tu
              racha y tu experiencia representan tu práctica, no la de un
              grupo. Podés borrarla cuando quieras escribiéndonos, como explica
              la política de privacidad.
            </p>
          </div>
          <div className="flex flex-col gap-3.5">
            <h3 className={H3_CLASS}>El ranking</h3>
            <p className={P_CLASS}>
              El ranking de universidades funciona por una sola razón: los
              puntos significan práctica real de gente real.{" "}
              <span className={STRONG_CLASS}>
                Inflar experiencia con bots, scripts, cuentas duplicadas o
                cualquier otra forma de trampa arruina el juego para todos
              </span>
              , así que si lo detectamos podemos resetear los puntos
              involucrados o suspender la cuenta. Si ves algo raro en el
              ranking, escribinos.
            </p>
          </div>
        </div>
      </Section>

      {/* El contenido */}
      <Section id="contenido" compact={compact}>
        <h2 className={H2_CLASS}>El contenido</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          Los ejercicios, explicaciones y demás material de Intervalo son
          nuestros.{" "}
          <span className={STRONG_CLASS}>
            Usalos para estudiar todo lo que quieras
          </span>{" "}
          — para eso están. Lo que no está permitido es copiarlos masivamente,
          scrapearlos o usarlos para armar otro producto.
        </p>
        <p className={P_CLASS}>
          Lo que nos mandás por los canales de la app — feedback, reportes de
          ejercicios, respuestas a encuestas — lo podemos usar para mejorar
          Intervalo. Es exactamente para lo que lo mandaste.
        </p>
      </Section>

      {/* Disponibilidad y responsabilidad */}
      <Section id="disponibilidad" grid compact={compact}>
        <h2 className={H2_CLASS}>Disponibilidad y responsabilidad</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          Intervalo es un producto gratuito en desarrollo activo. Hacemos
          nuestro mejor esfuerzo para que ande siempre, pero se ofrece{" "}
          <span className={STRONG_CLASS}>tal cual es</span>: puede tener
          interrupciones, cambiar o — esperemos que no — discontinuarse. Si
          algún día pasa algo grande con el servicio, vamos a intentar avisarte
          con tiempo.
        </p>
        <p className={P_CLASS}>
          Hasta donde la ley argentina lo permite, no respondemos por daños
          derivados de usar Intervalo o de que no esté disponible — desde una
          racha perdida por una caída hasta un examen que no salió como
          esperabas. Es una herramienta de estudio gratuita, no un servicio
          crítico.
        </p>
      </Section>

      {/* Cambios y ley aplicable */}
      <Section id="cambios" compact={compact}>
        <h2 className={H2_CLASS}>Si esto cambia</h2>
        <p className={`mb-8 ${P_CLASS}`}>
          Si alguna vez cambiamos estas reglas, lo vas a leer acá con la fecha
          actualizada, igual que en la política de privacidad. Seguir usando
          Intervalo después de un cambio es aceptarlo; si algo no te cierra,
          podés dejar de usarlo o pedirnos borrar tu cuenta.
        </p>
        <p className={`mb-8 ${P_CLASS}`}>
          Intervalo opera desde Argentina y estos términos se rigen por sus
          leyes. Cualquier duda, escribinos a{" "}
          <a href="mailto:hola@intervalo.xyz" className={LINK_CLASS}>
            hola@intervalo.xyz
          </a>
          .
        </p>
        <p className="max-w-[44rem] text-[0.875rem] leading-[1.8] text-[#768899]">
          Última actualización: agosto de 2026.
        </p>
      </Section>
    </>
  )
}
