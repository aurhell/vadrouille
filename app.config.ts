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
  plugins: ["expo-router", "expo-status-bar", "expo-font"],
}

export default config
