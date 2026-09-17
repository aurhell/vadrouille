import type { Dog, DogCoOwner, DogSex } from "../../domain/entities/dog"

/** Shape of a row from the `dogs` table (see supabase/migrations/*_dogs.sql). */
export interface DogRow {
  id: string
  name: string
  breed: string | null
  birth_date: string | null
  sex: DogSex | null
  photo_url: string | null
}

export function toDog(row: DogRow, myRole: "owner" | "co-owner", coOwners: DogCoOwner[] = []): Dog {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    birthDate: row.birth_date,
    sex: row.sex,
    photoUrl: row.photo_url,
    myRole,
    coOwners,
  }
}
