import { useLocalSearchParams } from "expo-router"

import { WalkDetailScreen } from "@/walk/presentation/screens/WalkDetailScreen"

export default function WalkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <WalkDetailScreen walkId={id} />
}
