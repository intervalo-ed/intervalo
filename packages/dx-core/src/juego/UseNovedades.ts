import { useState } from "react"

type ConId = { id: number }

/** El último id de una lista, o null si está vacía. */
export function ultimoIdDe(items: readonly ConId[]): number | null {
  return items.length > 0 ? Math.max(...items.map((x) => x.id)) : null
}

/** Cuántos quedan sin ver por encima de la marca. Sin marca todavía, ninguno. */
export function contarSinVer({ items, visto }: { items: readonly ConId[]; visto: number | null }): number {
  return visto === null ? 0 : items.filter((x) => x.id > visto).length
}

/** Lo que cuenta como novedad y lo que el chat tiene sin leer.
 *
 * Cada marca arranca en null y se fija con la primera lista que llega: lo que
 * pasó antes de sentarse a jugar no es novedad para nadie. Estado y no un ref,
 * ajustado durante el render: es el patrón que React documenta para acomodar
 * estado cuando cambian los datos de afuera.
 *
 * Dos marcas separadas: las novedades y los mensajes se miran en pantallas
 * distintas, así que haber leído unas no es haber leído los otros. */
export function useNovedades({
  data,
}: {
  data: { events: readonly ConId[]; messages: readonly ConId[] } | undefined
}) {
  const [visto, setVisto] = useState<number | null>(null)
  const [vistoChat, setVistoChat] = useState<number | null>(null)
  const eventos = data?.events ?? []
  const mensajes = data?.messages ?? []
  const ultimoId = ultimoIdDe(eventos)
  const ultimoMensajeId = ultimoIdDe(mensajes)
  if (visto === null && ultimoId !== null) setVisto(ultimoId)
  if (vistoChat === null && ultimoMensajeId !== null) setVistoChat(ultimoMensajeId)

  return {
    sinVer: contarSinVer({ items: eventos, visto }),
    sinVerChat: contarSinVer({ items: mensajes, visto: vistoChat }),
    ultimoId,
    ultimoMensajeId,
    /** Novedades leídas: la próxima vez solo frenan las que pasen de acá. */
    marcarVisto: () => {
      if (ultimoId !== null) setVisto(ultimoId)
    },
    /** Mensajes leídos: apaga el punto del botón del chat. */
    marcarVistoChat: () => {
      if (ultimoMensajeId !== null) setVistoChat(ultimoMensajeId)
    },
  }
}
