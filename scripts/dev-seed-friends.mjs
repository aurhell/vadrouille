#!/usr/bin/env node
// Dev-only shortcut: seeds a fixture user's friend graph — accepted friends, received pending
// requests, sent pending requests — directly in the database, so opening the "Amis" screen
// immediately shows every UI state without having to redeem codes / accept / decline by hand.
// Prints a ready-to-paste magic link for the seeded "me" account, same as dev-login.mjs.
//
// Usage:
//   pnpm dev:seed-friends                              dev@vadrouille.test, 2 accepted / 2 received / 2 sent
//   pnpm dev:seed-friends me@x.test                     custom "me" email
//   pnpm dev:seed-friends --reset                       delete the "me" fixture first (fresh account, empties its graph too)
//   pnpm dev:seed-friends --accepted=3 --received=1 --sent=0   control each bucket's size (0 skips it)
//
// Counterpart fixtures are named so you can tell them apart on screen at a glance:
//   friend_*     -> accepted friends
//   incoming_*   -> sent *you* a request, still pending ("Invitations reçues")
//   outgoing_*   -> *you* sent them a request, still pending ("Invitations envoyées")

import { execSync } from "node:child_process"

import { createClient } from "@supabase/supabase-js"

const args = process.argv.slice(2)
const reset = args.includes("--reset")
const email = args.find((arg) => !arg.startsWith("--")) ?? "dev@vadrouille.test"

function intArg(name, fallback) {
  const match = args.find((arg) => arg.startsWith(`--${name}=`))
  return match ? Number(match.split("=")[1]) : fallback
}

const counts = {
  accepted: intArg("accepted", 2),
  received: intArg("received", 2),
  sent: intArg("sent", 2),
}

const status = JSON.parse(execSync("pnpm exec supabase status -o json", { encoding: "utf8" }))
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

async function findUserByEmail(targetEmail) {
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) throw error
  return data.users.find((u) => u.email === targetEmail) ?? null
}

async function ensureFixture(targetEmail, username) {
  let user = await findUserByEmail(targetEmail)
  if (user) {
    // Clean slate for this run — also cascades any friendships rows it was part of.
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
  }
  const { data: created, error } = await admin.auth.admin.createUser({ email: targetEmail, email_confirm: true })
  if (error) throw error
  user = created.user
  const { error: profileError } = await admin.from("profiles").insert({ id: user.id, username })
  if (profileError) throw profileError
  return user
}

// "me" is only fully reset (deleting its own row cascades its friendships) when --reset is
// passed — otherwise reuse the existing account so an already-pasted session survives.
let me = await findUserByEmail(email)
if (reset && me) {
  const { error } = await admin.auth.admin.deleteUser(me.id)
  if (error) throw error
  me = null
}

if (!me) {
  const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  me = created.user
  console.log(`Created "me" fixture ${email} (${me.id}).`)
} else {
  // Clear out any friendships from a previous run so counts don't compound.
  await admin.from("friendships").delete().or(`user_id.eq.${me.id},friend_id.eq.${me.id}`)
  console.log(`Reusing "me" fixture ${email} (${me.id}) — cleared its existing friendships.`)
}

// Safety net: "me" might exist as an auth user with no profile yet (e.g. created via plain
// dev:login but onboarding was never finished) — friendships rows need one to reference.
const { data: existingProfile } = await admin.from("profiles").select("id").eq("id", me.id).maybeSingle()
if (!existingProfile) {
  const meUsername = email.split("@")[0].replace(/[^A-Za-z0-9_.]/g, "_").slice(0, 20)
  const { error: profileError } = await admin.from("profiles").insert({ id: me.id, username: meUsername })
  if (profileError) throw profileError
}

let seedIndex = 0
async function seedCounterpart(prefix) {
  seedIndex += 1
  const username = `${prefix}_${seedIndex}`
  const counterpartEmail = `${username}@vadrouille.test`
  return ensureFixture(counterpartEmail, username)
}

for (let i = 0; i < counts.accepted; i++) {
  const other = await seedCounterpart("friend")
  await admin.from("friendships").insert([
    { user_id: me.id, friend_id: other.id, status: "accepted" },
    { user_id: other.id, friend_id: me.id, status: "accepted" },
  ])
}

for (let i = 0; i < counts.received; i++) {
  const other = await seedCounterpart("incoming")
  await admin.from("friendships").insert({ user_id: other.id, friend_id: me.id, status: "pending" })
}

for (let i = 0; i < counts.sent; i++) {
  const other = await seedCounterpart("outgoing")
  await admin.from("friendships").insert({ user_id: me.id, friend_id: other.id, status: "pending" })
}

console.log(
  `Seeded: ${counts.accepted} accepted friend(s), ${counts.received} received request(s), ${counts.sent} sent request(s).`,
)

const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email })
if (linkError) throw linkError

console.log("\nPaste this into the login screen's DEV box:\n")
console.log(new URL(linkData.properties.action_link).toString())
