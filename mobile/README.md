# Derivadas (app nativa)

La app de Expo del minijuego de derivadas: el mismo flujo del teléfono que la
web, con la lógica compartida en `packages/dx-core`. Proyecto de EAS
`@intervalo-ed/intervalo-app`; bundle y package `xyz.intervalo.derivadas`.
Todavía no está publicada en las tiendas.

## Correrla en local

1. `bun install` en la raíz del repo (workspace de bun).
2. `cp .env.example .env` y completar. `EXPO_PUBLIC_API_URL` apunta al backend
   local (`http://localhost:8000` en el simulador de iOS, `http://10.0.2.2:8000`
   en el emulador de Android). **Nunca la API de producción para probar.**
3. `bunx expo run:ios` (o `bun run ios`): arma el dev build y levanta Metro.

El dev build trae `expo-dev-client`, así que abre el launcher y no el juego.
Para conectarlo a Metro sin tocar la pantalla:

```bash
xcrun simctl openurl <udid> "derivadas://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
```

Para que juegue solo (solo en desarrollo, ver `lib/juego/UseAutoplay.ts`),
levantar Metro con `EXPO_PUBLIC_AUTOPLAY=1`.

## Íconos y splash

Salen de la marca "dx" de la web (`web/src/app/derivadas/marca-dx.tsx`). Si
cambia el dibujo, desde la raíz:

```bash
bun mobile/scripts/generar-iconos.tsx
```

Escribe en `mobile/assets/images/`. El fondo (`#131324`, `TEMA.background`)
está repetido a mano en `app.config.ts`.

## Perfiles de EAS (`eas.json`)

| Perfil | Para qué | Environment |
|---|---|---|
| `development` | Dev build con el launcher, para aparatos registrados (distribución interna). | `development` |
| `development-simulator` | Lo mismo, pero para el simulador de iOS. | `development` |
| `preview` | Build interna del juego sin Metro, para probar en teléfonos (APK en Android). | `preview` |
| `production` | La build de las tiendas; el número de build lo incrementa EAS. | `production` |

Las versiones las lleva EAS (`appVersionSource: "remote"`): `buildNumber` y
`versionCode` no están en el config. `version` (1.0.0) sí, a mano.

## Variables de entorno en EAS

En EAS las `EXPO_PUBLIC_*` no salen del `.env`: cada perfil elige su
environment y las toma de ahí.

| Variable | production | preview | development |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` (el backend de producción en Railway) | sí | falta | falta |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_…`) | sí | falta | falta |
| `EXPO_PUBLIC_POSTHOG_KEY` | sí | falta | falta |
| `GOOGLE_SERVICES_JSON` (tipo archivo, para FCM) | falta | falta | falta |

Sin `GOOGLE_SERVICES_JSON` la build de Android sale igual, pero sin avisos.
`EXPO_PUBLIC_POSTHOG_HOST` y `EXPO_PUBLIC_WEB_URL` tienen valor por defecto.

## Publicar

```bash
eas build --profile production --platform ios      # o android, o all
eas submit --profile production --platform ios     # o android
```

El submit de Android va al track `internal` de Play. El de iOS todavía no tiene
config en `eas.json` (pregunta los datos de App Store Connect la primera vez).

## Pendiente (lo hace el dueño de las cuentas)

- [ ] Cuenta de Apple Developer y la app en App Store Connect con el bundle
      `xyz.intervalo.derivadas`.
- [ ] La primera build de iOS (`eas build -p ios`), que genera el certificado
      y la key de APNs.
- [ ] Firebase: subir `google-services.json` como variable de tipo archivo
      `GOOGLE_SERVICES_JSON` en EAS, y la key de la service account de FCM V1
      en Credentials.
- [ ] La app en Play Console y una service account para `eas submit`.
- [ ] `eas device:create` para registrar los iPhones de prueba.
- [ ] Las variables del environment `preview` (y `development` si hace falta).
- [ ] En la instancia de **producción** de Clerk: habilitar la Native API y
      agregar `derivadas://sso-callback` a la allowlist de redirects (solo se
      hizo en la de desarrollo).
- [ ] Las fichas de las tiendas: capturas de teléfono, política de
      privacidad, privacy labels (App Store) y data safety (Play).
