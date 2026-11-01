// La portada del juego: el logo, la puerta y «¡Vamos!». El par nativo de
// `PuertaMinima` de la web (intro-panel.tsx), con los mismos textos de dx-core
// (textos-reglas.ts) y el digest de `/bienvenida`: `primera`, `vuelve` y `sigue`,
// y el texto de siempre como respaldo si el digest falla, tarda o viene vacío.

import { useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useAuth } from "@clerk/expo"
import { useQuery } from "@tanstack/react-query"
import { unwrap } from "@intervalo/dx-core/api/client"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { gameKeys } from "@intervalo/dx-core/juego/game-keys"
import { useBienvenida } from "@intervalo/dx-core/juego/UseBienvenida"
import {
  BIENVENIDA_MINIMA,
  INSTRUCCION_MINIMA,
  QUE_ES,
  SEGUIMOS,
} from "@intervalo/dx-core/juego/textos-reglas"
import { useGameToken } from "@/lib/juego/UseGamePlayer"
import { BotonCta } from "./boton-cta"
import { GameLogo } from "./game-logo"
import { TextoConHuecos } from "./texto-con-huecos"

// El techo de la espera al digest, no la espera normal (ver ESPERA_MAX_MS en
// intro-panel.tsx). Vencido, sale el respaldo; si el digest llega después, lo
// reemplaza igual.
const ESPERA_MAX_MS = 2_500
const NBSP = " "

function useVencio(ms: number): boolean {
  const [vencio, setVencio] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVencio(true), ms)
    return () => clearTimeout(t)
  }, [ms])
  return vencio
}

// El perfil ya cargado, sin pedirlo (useCachedPlayer de la web): lo trae
// `useGamePlayer` del flow, y acá solo se mira para el @ del saludo.
function useJugadorEnCache() {
  const api = useGameApi()
  const { data } = useQuery({
    queryKey: gameKeys.me,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/me")),
    enabled: false,
  })
  return data ?? null
}

function Puerta() {
  const player = useJugadorEnCache()
  const token = useGameToken()
  const { isSignedIn } = useAuth()

  // El pedido espera a que haya jugador: sin token ni sesión el endpoint
  // contesta 401 y, sin reintentos, `primera` no se vería nunca.
  const hayJugador = token !== null || isSignedIn === true
  const { data, isError } = useBienvenida(hayJugador)
  const vencio = useVencio(ESPERA_MAX_MS)

  // Mientras espera, el respaldo ocupa su lugar sin verse: cuando vence el
  // plazo aparece donde ya estaba, y si el pedido falló sale ya.
  const esperando = data === undefined && !vencio && !isError
  if (esperando || !data || data.novedades.length === 0) {
    return (
      <View style={[styles.texto, esperando && styles.invisible]}>
        <Text style={[styles.parrafo, styles.fuerte]}>{BIENVENIDA_MINIMA}</Text>
        <Text style={styles.parrafo}>{QUE_ES}</Text>
        <Text style={[styles.parrafo, styles.fuerte]}>{INSTRUCCION_MINIMA}</Text>
      </View>
    )
  }

  const saludo = (
    <Text style={[styles.parrafo, styles.fuerte]}>
      <TextoConHuecos
        texto={data.saludo}
        actorAlias={player?.alias ? `@${player.alias}` : null}
        actorLevel={player?.level ?? null}
      />
    </Text>
  )

  if (data.modo === "sigue") {
    const n = data.novedades[0]
    return (
      <View style={[styles.texto, styles.textoSigue]}>
        {saludo}
        <Text style={styles.parrafo}>
          <TextoConHuecos texto={n.texto} /> {n.emoji}
          {"\n"}
          {SEGUIMOS}
        </Text>
      </View>
    )
  }

  const primera = data.modo === "primera"
  return (
    <View style={styles.texto}>
      {saludo}
      {primera && <Text style={styles.parrafo}>{QUE_ES}</Text>}
      {/* La caja ES la lista: borde sin fondo, del ancho del renglón más largo y
          con 16 px de más por lado tomados del margen de la pantalla. */}
      <View style={styles.caja}>
        {data.novedades.map((n) => (
          <Text key={n.clave} style={styles.novedad}>
            <TextoConHuecos
              texto={n.texto}
              actorAlias={n.actor_alias}
              actorLevel={n.actor_level}
              universities={n.universities}
              conTags
              tamano={14}
            />
            {NBSP}
            {n.emoji}
          </Text>
        ))}
      </View>
      {(primera || data.modo === "vuelve") && (
        <Text style={[styles.parrafo, styles.fuerte]}>{primera ? INSTRUCCION_MINIMA : SEGUIMOS}</Text>
      )}
    </View>
  )
}

export function IntroSlide({
  onStart,
  startDisabled,
}: {
  onStart: () => void
  startDisabled: boolean
}) {
  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        {/* 1.9125rem, el del teléfono en la web. */}
        <GameLogo fontSize={30.6} />
        <Puerta />
      </View>
      <BotonCta texto="¡Vamos!" onPress={onStart} disabled={startDisabled} />
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  texto: { marginTop: 40, maxWidth: 320, gap: 20 },
  textoSigue: { gap: 24 },
  invisible: { opacity: 0 },
  parrafo: { textAlign: "center", fontSize: 16, lineHeight: 26, color: "rgba(246,248,252,0.85)" },
  fuerte: { fontWeight: "600", color: TEMA.foreground },
  caja: {
    alignSelf: "center",
    marginHorizontal: -16,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(56,56,90,0.6)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  novedad: { textAlign: "left", fontSize: 14, lineHeight: 20, color: "rgba(246,248,252,0.85)" },
})
