#!/usr/bin/env node
// Dev-only shortcut: skips the real magic-link email round trip entirely. Creates (or
// reuses) a fixture auth user via the Supabase admin API and prints a ready-to-paste link
// for the "DEV — coller le lien magique" box on the login screen (see
// src/account/presentation/screens/dev-paste-magic-link.tsx). Never touches the app bundle —
// this runs on your machine only, using the local project's service_role key.
//
// Usage:
//   pnpm dev:login                    fixture user dev@vadrouille.test
//   pnpm dev:login --reset            delete the fixture user first (fresh onboarding)
//   pnpm dev:login someone@else.test  a different fixture email (own onboarding each time)

import { execSync } from "node:child_process"

import { createClient } from "@supabase/supabase-js"

const args = process.argv.slice(2)
const reset = args.includes("--reset")
const email = args.find((arg) => !arg.startsWith("--")) ?? "dev@vadrouille.test"

const status = JSON.parse(execSync("pnpm exec supabase status -o json", { encoding: "utf8" }))
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

async function findUserByEmail(targetEmail) {
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) throw error
  return data.users.find((u) => u.email === targetEmail) ?? null
}

let user = await findUserByEmail(email)

if (reset && user) {
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) throw error
  console.log(`Deleted fixture user ${email} (${user.id}) — cascades its profile too.`)
  user = null
}

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  user = data.user
  console.log(`Created fixture user ${email} (${user.id}) — no profile yet, will land on onboarding.`)
} else {
  console.log(`Reusing fixture user ${email} (${user.id}).`)
}

const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email })
if (linkError) throw linkError

const verifyUrl = new URL(linkData.properties.action_link)
// Local Mailpit's SMTP mock rewrites the host in the *emailed* link (site_url handling,
// see supabase/config.toml), but generateLink() returns the raw server URL directly, which
// already points at API_URL and pastes straight into the dev box as-is.

console.log("\nPaste this into the login screen's DEV box:\n")
console.log(verifyUrl.toString())
