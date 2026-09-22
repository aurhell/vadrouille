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
    // FCM credentials for push — google-services.json is gitignored (one per dev/environment,
    // never committed, see .gitignore), so EAS Build (which only uploads git-tracked files)
    // can't see a hardcoded relative path. GOOGLE_SERVICES_JSON is an EAS file-type env var
    // (`eas env:create ... --type file`) that resolves to the real file's path at build time;
    // falls back to the local path for `expo start`/local builds, where the file is just on
    // disk. See https://docs.expo.dev/push-notifications/fcm-credentials/.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    adaptiveIcon: {
      // Fallback only — backgroundImage below is what actually renders — but kept in sync
      // with it (coral, see assets/logo/README.md) rather than left at its old placeholder.
      backgroundColor: "#FF6B4A",
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
    "@react-native-community/datetimepicker",
    [
      "expo-image-picker",
      {
        photosPermission: "Vadrouille a besoin d'accéder à tes photos pour choisir un avatar.",
      },
    ],
    [
      "expo-notifications",
      {
        // Coral, matching the brand mark — see assets/logo/README.md.
        color: "#FF6B4A",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "c9a46154-c633-4c4d-98cb-d34435e13455",
    },
  },
}

export default config
