#!/usr/bin/env node
// Dev-only shortcut: boots two distinct iOS simulators, makes sure Metro is running, opens
// the Expo Go project on both, and creates two fixture accounts ready to test friend-invite
// flows between two people at once. See README.md §"Ouvrir deux simulateurs en parallèle".
//
// Usage:
//   pnpm dev:dual                                  fixture users alice@vadrouille.test / bob@vadrouille.test
//   pnpm dev:dual alice@x.test bob@x.test           custom emails
//   pnpm dev:dual --reset                           delete both fixture users first (fresh onboarding)
//   pnpm dev:dual --with-dogs                       skip onboarding (profile pre-created), make the two
//                                                    accounts friends, and give each one a dog — ready to
//                                                    test co-ownership invites between the two devices
//
// Override which simulators to use (must be two *different* device types — the same model
// can't be booted twice) if the defaults below aren't installed on your machine:
//   SIM_DEVICE_1="iPhone 16" SIM_DEVICE_2="iPhone 16 Pro" pnpm dev:dual

import { execFileSync, spawn } from "node:child_process"
import { createConnection } from "node:net"
import { openSync } from "node:fs"

const args = process.argv.slice(2)
const reset = args.includes("--reset")
const withDogs = args.includes("--with-dogs")
const emails = args.filter((arg) => !arg.startsWith("--"))
const emailA = emails[0] ?? "alice@vadrouille.test"
const emailB = emails[1] ?? "bob@vadrouille.test"

const METRO_PORT = 8081

function sh(cmd, cmdArgs, options = {}) {
  return execFileSync(cmd, cmdArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options })
}

// simctl's URL-routing service can be briefly unresponsive right after a `simctl boot` /
// `open -a Simulator`, failing openurl with a spurious timeout — a couple of retries clears it.
async function retry(fn, { attempts = 3, delayMs = 2000 } = {}) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return fn()
    } catch (error) {
      if (i === attempts) throw error
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" })
    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })
    socket.once("error", () => resolve(false))
  })
}

async function waitUntil(check, { timeoutMs, intervalMs = 1000, label }) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await check()) return true
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`Timed out waiting for ${label}`)
}

// 1. Pick two simulators --------------------------------------------------

function availableIphones() {
  const list = JSON.parse(sh("xcrun", ["simctl", "list", "devices", "available", "-j"]))
  return Object.values(list.devices)
    .flat()
    .filter((d) => d.name.startsWith("iPhone"))
    .map((d) => d.name)
    .filter((name, i, arr) => arr.indexOf(name) === i)
}

const iphones = availableIphones()
const device1 = process.env.SIM_DEVICE_1 ?? iphones[0]
const device2 = process.env.SIM_DEVICE_2 ?? iphones.find((name) => name !== device1)

if (!device1 || !device2) {
  console.error(
    `Need two different iPhone simulator models installed, found: ${iphones.join(", ") || "none"}.\n` +
      "Install more via Xcode > Settings > Platforms, or set SIM_DEVICE_1/SIM_DEVICE_2 explicitly.",
  )
  process.exit(1)
}

console.log(`Devices: "${device1}" + "${device2}"`)

// 2. Boot both (ignore "already booted") ----------------------------------

function boot(deviceName) {
  try {
    sh("xcrun", ["simctl", "boot", deviceName])
  } catch (error) {
    if (!String(error.stderr ?? error.message).includes("current state: Booted")) {
      console.error(String(error.stderr ?? error.message))
      throw error
    }
  }
}

boot(device1)
boot(device2)
sh("open", ["-a", "Simulator"])

function bootedUdid(deviceName) {
  const list = JSON.parse(sh("xcrun", ["simctl", "list", "devices", "-j"]))
  for (const runtimeDevices of Object.values(list.devices)) {
    const match = runtimeDevices.find((d) => d.name === deviceName && d.state === "Booted")
    if (match) return match.udid
  }
  return null
}

await waitUntil(() => !!bootedUdid(device1) && !!bootedUdid(device2), { timeoutMs: 30_000, label: "both simulators to boot" })
const udid1 = bootedUdid(device1)
const udid2 = bootedUdid(device2)
console.log(`Booted: ${device1} (${udid1}), ${device2} (${udid2})`)

// 3. Make sure Metro is running --------------------------------------------

if (await portOpen(METRO_PORT)) {
  console.log("Metro already running on :8081.")
} else {
  console.log("Starting Metro in the background (pnpm dev)...")
  const logFd = openSync("metro.dev-dual.log", "a")
  const child = spawn("pnpm", ["dev"], { detached: true, stdio: ["ignore", logFd, logFd] })
  child.unref()
  await waitUntil(() => portOpen(METRO_PORT), { timeoutMs: 60_000, label: "Metro to start" })
  console.log("Metro is up — logs at ./metro.dev-dual.log (stop it with: lsof -ti:8081 | xargs kill)")
}

// 4. Open the project on both simulators (simulator reaches the Mac via 127.0.0.1 directly,
// no LAN IP needed — that's only required for a physical device, see README §Setup) --------

await new Promise((r) => setTimeout(r, 2000)) // let CoreSimulator's URL routing settle after boot

// A simulator that's never been used with `expo start` before doesn't have Expo Go installed
// yet — Expo's CLI normally auto-downloads it on first "i" press. Cloning the .app bundle from
// whichever device already has it is instant and avoids a network round trip here.
function hasExpoGo(udid) {
  // Right after a boot, `listapps` can transiently return an incomplete list — retry a couple
  // of times before concluding Expo Go really isn't there.
  for (let i = 0; i < 3; i++) {
    if (sh("xcrun", ["simctl", "listapps", udid]).includes('"host.exp.Exponent"')) return true
  }
  return false
}

function expoGoBundlePath(udid) {
  const text = sh("xcrun", ["simctl", "listapps", udid])
  const start = text.indexOf('"host.exp.Exponent" =')
  if (start === -1) return null
  // unquoted Path (not url-encoded, unlike Bundle) within Expo Go's app record.
  const path = text.slice(start, start + 2000).match(/\n\s+Path = "(.*?)";/)
  return path?.[1] ?? null
}

async function ensureExpoGo(udid, otherUdid) {
  if (hasExpoGo(udid)) return
  const sourcePath = hasExpoGo(otherUdid) ? expoGoBundlePath(otherUdid) : null
  if (!sourcePath) {
    console.warn(
      `Expo Go isn't installed on ${udid} and no other booted device has it to clone from — ` +
        `run "pnpm dev" and press "i" once with this device focused in Simulator to install it, then re-run this script.`,
    )
    return
  }
  console.log(`Installing Expo Go on ${udid} (cloned from ${otherUdid})...`)
  sh("xcrun", ["simctl", "install", udid, sourcePath])
  console.log(`  → first launch on a device: iOS shows a one-time "Open in Expo Go?" prompt, tap Open once (never again after).`)
}

await ensureExpoGo(udid1, udid2)
await ensureExpoGo(udid2, udid1)

await retry(() => sh("xcrun", ["simctl", "openurl", udid1, `exp://127.0.0.1:${METRO_PORT}`]))
await retry(() => sh("xcrun", ["simctl", "openurl", udid2, `exp://127.0.0.1:${METRO_PORT}`]))
console.log("Opened Expo Go on both devices.")

// 5. Fixture accounts -------------------------------------------------------

const { createClient } = await import("@supabase/supabase-js")
const status = JSON.parse(sh("pnpm", ["exec", "supabase", "status", "-o", "json"]))
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

async function findUserByEmail(targetEmail) {
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) throw error
  return data.users.find((u) => u.email === targetEmail) ?? null
}

async function ensureFixture(email) {
  let user = await findUserByEmail(email)
  if (reset && user) {
    // dogs.created_by is ON DELETE SET NULL (deliberately, so a real account deletion
    // doesn't take a co-owned dog down with it — see supabase/migrations/*_dogs.sql) — which
    // means deleting the user alone would leave any dev-seeded dogs behind as ownerless
    // zombies instead of actually resetting. Delete them first, while we still know whose
    // they were.
    await admin.from("dogs").delete().eq("created_by", user.id)
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
    user = null
  }
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
    if (error) throw error
    user = data.user
  }

  // --with-dogs skips onboarding entirely (profile pre-created) so the paste-and-go flow
  // lands straight on a populated app, ready to test co-ownership between the two devices.
  if (withDogs) {
    const { data: existingProfile } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle()
    if (!existingProfile) {
      const username = email.split("@")[0].replace(/[^A-Za-z0-9_.]/g, "_").slice(0, 20)
      const { error: profileError } = await admin.from("profiles").insert({ id: user.id, username })
      if (profileError) throw profileError
    }
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email })
  if (linkError) throw linkError
  return { id: user.id, link: new URL(linkData.properties.action_link).toString() }
}

const fixtureA = await ensureFixture(emailA)
const fixtureB = await ensureFixture(emailB)
const linkA = fixtureA.link
const linkB = fixtureB.link

if (withDogs) {
  // Friends first — a co-ownership invite requires it (see dog.docs.md "Inviter un co-owner
  // qui n'est pas mon ami"). ON CONFLICT DO NOTHING: harmless if --reset wasn't passed and
  // they're already friends from a previous run.
  await admin
    .from("friendships")
    .upsert(
      [
        { user_id: fixtureA.id, friend_id: fixtureB.id, status: "accepted" },
        { user_id: fixtureB.id, friend_id: fixtureA.id, status: "accepted" },
      ],
      { onConflict: "user_id,friend_id" },
    )

  async function ensureDog(ownerId, name) {
    const { data: existing } = await admin.from("dogs").select("id").eq("created_by", ownerId).eq("name", name).maybeSingle()
    if (existing) return
    await admin.from("dogs").insert({ created_by: ownerId, name, breed: "Labrador" })
  }

  await ensureDog(fixtureA.id, "Rex")
  await ensureDog(fixtureB.id, "Milo")
  console.log("Seeded: alice/bob are friends, each has a dog (Rex, Milo) — ready to test a co-ownership invite.")
}

console.log(`\nPaste into the DEV box on "${device1}" (${emailA}):\n${linkA}`)
console.log(`\nPaste into the DEV box on "${device2}" (${emailB}):\n${linkB}`)
