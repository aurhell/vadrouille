import { useLocalSearchParams } from "expo-router"

import { DogFormScreen } from "@/dog/presentation/screens/DogFormScreen"

export default function EditDog() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DogFormScreen dogId={id} />
}
