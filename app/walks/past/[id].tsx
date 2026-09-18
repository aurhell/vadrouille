import { useLocalSearchParams } from "expo-router"

import { PastWalkDetailScreen } from "@/walk/presentation/screens/PastWalkDetailScreen"

export default function PastWalkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PastWalkDetailScreen walkId={id} />
}
