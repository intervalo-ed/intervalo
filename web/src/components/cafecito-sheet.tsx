"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { CafecitoPanel } from "@/app/derivadas/cafecito-panel"

// La diapo del café de Intervalo clásico. NO es una copia de la del minijuego:
// monta exactamente la misma pieza (derivadas/cafecito-panel.tsx), que ya está
// parametrizada para las dos formas en que la usa el juego —el teléfono a
// pantalla completa y el escritorio en la columna— y acepta que no le manden
// ninguna de las dos.
//
// Se hace así y no con un copy nuevo por un motivo que ya costó una donación
// real: el panel es lo ÚNICO que anota la intención antes de salir a Cafecito
// (`useCafecitoIntent`), y esa intención es toda la atribución que hay. El
// botón de la configuración era un enlace directo, así que quien donaba desde
// acá llegaba al servidor sin nada que lo identificara y su donación se la
// repartían las intenciones abiertas de otras personas. Un segundo camino a
// Cafecito que no pase por esta pieza vuelve a abrir ese agujero.
//
// Va sobre el Dialog de base-ui, igual que InstallSheet: foco atrapado, Escape,
// bloqueo de scroll y portal ya resueltos.
export function CafecitoSheet({
  open,
  onOpenChange,
  university,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // La de esta persona según su enrollment (`/leaderboard/summary`). `null`
  // mientras viaja la respuesta o si no tiene: el panel ya sabe dibujar las dos
  // caras, y la de "sin universidad" acá va sin `onPickUniversity` porque en
  // clásico la universidad se elige en el onboarding, no en un botón.
  university: string | null
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-background duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-4 data-closed:animate-out data-closed:fade-out-0">
          {/* El título es para lectores de pantalla: en pantalla el encabezado
              es la taza y el "¿Café?" del propio panel. */}
          <DialogPrimitive.Title className="sr-only">
            Invitar un cafecito
          </DialogPrimitive.Title>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center overflow-y-auto px-5 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            {/* El div de adentro NO es flex, y eso es lo que hace que la card
                mida lo que ocupa: la raíz del panel trae `flex-1` para llenar la
                columna del juego, y como hijo directo de un contenedor flex acá
                se estiraba a la pantalla entera — una card con borde de punta a
                punta. Sin display flex en el padre, `flex-1` no aplica y el
                borde vuelve a envolver el contenido. */}
            <div>
              {/* `trigger="pedido"`: lo abrió la persona. Eso le saca la cuenta
                regresiva de diez segundos —que existe para que un pedido que
                interrumpe se alcance a leer, y acá no interrumpió nadie— y deja
                la salida rotulada «Volver» en vez de «Ahora no».

                Sin `fullBleed`: ese modo trae el bloque de universidades
                cercanas, que se arma con el ranking por universidad DEL JUEGO
                (`useGameUniversityLeaderboard`). Adentro de Intervalo clásico
                sería una tabla de otro marcador metida en el medio de la
                pantalla. Sin la bandera queda la card de siempre.

                Sin `keyboard`: los atajos del panel (Enter para salir,
                shift+Enter para invitar) son del teclado del juego. Acá el
                Escape del Dialog ya cierra. */}
              <CafecitoPanel
                trigger="pedido"
                placement="clasico_config"
                university={university}
                onContinue={() => onOpenChange(false)}
              />
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
