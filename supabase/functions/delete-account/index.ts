// Account deletion cascade (RGPD droit à l'oubli — see rgpd-securite.md and
// account.docs.md "Feature: Suppression de compte"). Requires service_role, which the
// client can never hold, hence this Edge Function — see architecture-technique.md's
// "zero API custom" exceptions.
//
// Most of the cascade (friendships, remaining co-ownership links, the caller's own RSVPs on
// other people's walks, organizer_id on their past walks) is handled by ON DELETE
// CASCADE/SET NULL constraints defined directly on profiles.id and its dependents — see the
// supabase/migrations/*.sql files. This function only handles the two things a plain FK
// cascade can't express (deleting rather than unlinking, and time-based branching), plus
// Storage cleanup, which isn't a database concern at all:
//   1. Future walks organized by this user: DELETED outright, not just unlinked (past ones
//      are left for the FK's SET NULL to handle once the profile itself is deleted below).
//   2. Dogs solely owned by this user: DELETED outright (co-owned dogs must survive for the
//      other owner — that's dog_owners, unlinked automatically by cascade below).
//   3. Storage files (avatar, and photos of the dogs deleted in step 2).
// Deleting the auth.users row last triggers every remaining cascade in one transaction-safe
// operation.
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return json({ error: "missing_authorization" }, 401)
  }

  // Identify the caller from their OWN token (anon key + their Authorization header) — never
  // trust a user id passed in the request body, or this becomes "delete anyone's account".
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerData.user) {
    return json({ error: "unauthenticated" }, 401)
  }
  const userId = callerData.user.id

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // 1. Future organized walks: delete outright.
    // TODO(push): once the push-notification Edge Function exists, notify participants here
    // ("Balade annulée — l'organisateur a quitté Vadrouille") before deleting the rows.
    const { error: futureWalksError } = await admin
      .from("walks")
      .delete()
      .eq("organizer_id", userId)
      .gt("start_time", new Date().toISOString())
    if (futureWalksError) throw futureWalksError

    // 2. Dogs solely owned by this user (no other dog_owners row at all, of any status).
    const { data: ownedRows, error: ownedRowsError } = await admin
      .from("dog_owners")
      .select("dog_id")
      .eq("user_id", userId)
      .eq("role", "owner")
    if (ownedRowsError) throw ownedRowsError

    const solelyOwnedDogIds: string[] = []
    for (const { dog_id } of ownedRows ?? []) {
      const { count, error: coOwnerError } = await admin
        .from("dog_owners")
        .select("*", { count: "exact", head: true })
        .eq("dog_id", dog_id)
        .neq("user_id", userId)
      if (coOwnerError) throw coOwnerError
      if (!count) solelyOwnedDogIds.push(dog_id)
    }

    if (solelyOwnedDogIds.length > 0) {
      const { error: deleteDogsError } = await admin.from("dogs").delete().in("id", solelyOwnedDogIds)
      if (deleteDogsError) throw deleteDogsError
    }

    // 3. Storage cleanup (avatar + photos of the dogs just deleted above).
    const { data: avatarFiles } = await admin.storage.from("avatars").list(userId)
    if (avatarFiles?.length) {
      await admin.storage.from("avatars").remove(avatarFiles.map((file) => `${userId}/${file.name}`))
    }
    for (const dogId of solelyOwnedDogIds) {
      const { data: dogPhotoFiles } = await admin.storage.from("dog-photos").list(dogId)
      if (dogPhotoFiles?.length) {
        await admin.storage.from("dog-photos").remove(dogPhotoFiles.map((file) => `${dogId}/${file.name}`))
      }
    }

    // 4. Delete the auth user — cascades profiles, and from there friendships, remaining
    // dog_owners links, walk_participants, and sets organizer_id to NULL on any remaining
    // (past) organized walks. See the migrations for the exact FK behavior of each.
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId)
    if (deleteUserError) throw deleteUserError

    return json({ success: true }, 200)
  } catch (error) {
    console.error("delete-account failed:", error)
    return json({ error: "internal_error" }, 500)
  }
})
