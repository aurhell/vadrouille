/**
 * Coordinates every open native inline picker (DateField's iOS spinner today) app-wide, so
 * opening one closes any other, and any touch anywhere else in the app closes it too — without
 * every screen having to lift state and wire `open`/`onOpenChange` between sibling fields, or
 * every unrelated component (a chip, a list row) having to know pickers exist at all.
 */

type Listener = () => void

export type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

let openId: string | null = null
// The open picker's on-screen bounds, reported by DateField itself once mounted (see its
// onLayout) — lets the root layout's "close on any outside touch" handler tell a touch that
// starts on the picker (e.g. dragging the spinner) apart from one that starts elsewhere,
// without either side needing to know about the other's implementation.
let openBounds: Bounds | null = null
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function requestOpen(id: string) {
  if (openId === id) return
  openId = id
  openBounds = null
  notify()
}

export function closeAll() {
  if (openId === null) return
  openId = null
  openBounds = null
  notify()
}

export function isOpen(id: string): boolean {
  return openId === id
}

export function setOpenBounds(bounds: Bounds | null) {
  openBounds = bounds
}

export function isInsideOpenBounds(x: number, y: number): boolean {
  if (!openBounds) return false
  return x >= openBounds.x && x <= openBounds.x + openBounds.width && y >= openBounds.y && y <= openBounds.y + openBounds.height
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
