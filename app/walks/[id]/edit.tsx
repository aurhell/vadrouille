import { useLocalSearchParams } from "expo-router"

import { WalkEditScreen } from "@/walk/presentation/screens/WalkEditScreen"

export default function WalkEdit() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <WalkEditScreen walkId={id} />
}
