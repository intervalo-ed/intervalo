import type { ConfigContext, ExpoConfig } from "expo/config"

// La New Architecture y el edge-to-edge de Android ya no se configuran: desde
// SDK 55 son lo único que hay, y el esquema de SDK 58 no tiene ni
// `newArchEnabled` ni `edgeToEdgeEnabled`.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Derivadas",
  slug: "derivadas",
  scheme: "derivadas",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "xyz.intervalo.derivadas",
    supportsTablet: true,
  },
  android: {
    package: "xyz.intervalo.derivadas",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
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
        backgroundColor: "#208AEF",
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
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
})
