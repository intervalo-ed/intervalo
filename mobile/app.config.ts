import type { ConfigContext, ExpoConfig } from "expo/config"

// Sin tipos de Node en la app: el config corre en Node, pero tsc lo lee con los de RN.
const { existsSync } = require("fs") as { existsSync: (ruta: string) => boolean }

// El fondo del juego (TEMA.background en dx-core). Se repite a mano porque el
// app config lo evalúa Node sin el bundler y dx-core es TypeScript sin compilar.
const FONDO = "#131324"

// La New Architecture y el edge-to-edge de Android ya no se configuran: desde
// SDK 55 son lo único que hay, y el esquema de SDK 58 no tiene ni
// `newArchEnabled` ni `edgeToEdgeEnabled`.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Derivadas",
  slug: "intervalo-app",
  owner: "intervalo-ed",
  scheme: "derivadas",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  // El juego tiene un solo tema, oscuro.
  userInterfaceStyle: "dark",
  // La vista raíz (expo-system-ui): sin esto, entre el splash y el primer
  // render asoma el blanco por defecto.
  backgroundColor: FONDO,
  // buildNumber y versionCode los lleva EAS (`appVersionSource: "remote"`).
  ios: {
    bundleIdentifier: "xyz.intervalo.derivadas",
    // Solo el flujo de teléfono: con iPad, la App Store pide capturas de iPad.
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "xyz.intervalo.derivadas",
    // Para FCM. En EAS es una variable de tipo archivo (gitignoreado acá). Sin
    // ninguno de los dos el prebuild de Android no corta: sale sin avisos.
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ??
      (existsSync("./google-services.json") ? "./google-services.json" : undefined),
    adaptiveIcon: {
      backgroundColor: FONDO,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: FONDO,
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
      },
    ],
    "expo-secure-store",
    // Sin «Sign in with Apple» por ahora: el plugin agrega el entitlement por
    // defecto y eso exige la capability en el App ID antes de que haya botón.
    ["@clerk/expo", { appleSignIn: false }],
    "expo-web-browser",
    "expo-localization",
    // Solo avisos visibles: nada de pushes silenciosos que despierten la app.
    ["expo-notifications", { enableBackgroundRemoteNotifications: false }],
  ],
  experiments: {
    reactCompiler: true,
  },
  // El proyecto de EAS (expo.dev/accounts/intervalo-ed/projects/intervalo-app): de acá
  // sale el projectId que pide el token de los avisos.
  extra: {
    ...config.extra,
    eas: { projectId: "f063f410-143e-4499-a010-f8233d3d4fd1" },
  },
})
