import type { ExpoConfig } from "expo/config"

const config: ExpoConfig = {
  name: "Vadrouille",
  slug: "vadrouille",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "vadrouille",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "dev.aureliengirault.vadrouille",
    supportsTablet: true,
    infoPlist: {
      // Local Supabase serves plain HTTP over the dev machine's LAN IP (see .env.example) —
      // a physical device otherwise blocks it under App Transport Security. Scoped to local
      // network addresses only, not arbitrary HTTP. Revisit before store distribution: the
      // cloud/prod Supabase project is HTTPS, so this exception becomes unnecessary then.
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
      },
    },
  },
  android: {
    package: "dev.aureliengirault.vadrouille",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-status-bar",
    "expo-font",
    [
      "expo-image-picker",
      {
        photosPermission: "Vadrouille a besoin d'accéder à tes photos pour choisir un avatar.",
      },
    ],
  ],
}

export default config
