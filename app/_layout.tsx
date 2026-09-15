import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import { useColorScheme } from "react-native"
import { TamaguiProvider } from "tamagui"

import { config } from "@/shared/ui"

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [fontsLoaded] = useFonts({
    "Baloo2-SemiBold": require("../assets/fonts/Baloo2-SemiBold.ttf"),
    "Baloo2-Bold": require("../assets/fonts/Baloo2-Bold.ttf"),
    "Baloo2-ExtraBold": require("../assets/fonts/Baloo2-ExtraBold.ttf"),
    "Nunito-Regular": require("../assets/fonts/Nunito-Regular.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito-SemiBold.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito-ExtraBold.ttf"),
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme === "dark" ? "dark" : "light"}>
      <Stack />
    </TamaguiProvider>
  )
}
