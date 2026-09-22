// One-off asset generator, not part of the build — run manually after the logo SVGs change
// (assets/logo/svg/*.svg). Rasterizes the app icon set from source SVGs into assets/*.png.
// See assets/logo/README.md for the source of truth on sizes/usage.
import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { Resvg } from "@resvg/resvg-js"

const root = dirname(fileURLToPath(import.meta.url))
const logoDir = join(root, "..", "assets", "logo", "svg")
const assetsDir = join(root, "..", "assets")

function render(svgPath, { width, background } = {}) {
  const svg = readFileSync(svgPath, "utf-8")
  const resvg = new Resvg(svg, {
    fitTo: width ? { mode: "width", value: width } : undefined,
    background,
  })
  return resvg.render().asPng()
}

// iOS store/app icon — 1024x1024, fully opaque. resvg always emits RGBA (transparent areas
// filled with `background`, but the alpha channel/PNG colour type 6 stays present either way)
// — App Store Connect rejects an icon that carries an alpha channel at all, even an all-opaque
// one, so flatten it away with ImageMagick as a separate step rather than trusting resvg's
// `background` option to do it.
const iconPath = join(assetsDir, "icon.png")
writeFileSync(iconPath, render(join(logoDir, "vadrouille-appicon-1024.svg"), { width: 1024 }))
execFileSync("magick", [iconPath, "-background", "#FF6B4A", "-alpha", "remove", "-alpha", "off", iconPath])

// Android adaptive icon: foreground (transparent, OS composites it over the background layer)
// and a flat coral background layer, both 432x432 per the source SVGs.
writeFileSync(join(assetsDir, "android-icon-foreground.png"), render(join(logoDir, "vadrouille-adaptive-foreground.svg"), { width: 432 }))
writeFileSync(join(assetsDir, "android-icon-background.png"), render(join(logoDir, "vadrouille-adaptive-background.svg"), { width: 432 }))

// Android 13+ themed (monochrome) icon: the OS applies its own tint, so this must be a single
// colour silhouette on a transparent background. Not derived from the foreground artwork
// (that one fakes the paw cutout with same-colour circles painted on top, which collapses into
// a blank pin once every fill is forced to the same white) — built instead from
// vadrouille-mark-cutout.svg, whose paw is a real fill-rule="evenodd" hole, recoloured to
// white and placed inside the same translate/scale frame the adaptive foreground uses, so it
// sits inside Android's safe zone instead of bleeding to the canvas edge.
const cutoutD = readFileSync(join(logoDir, "vadrouille-mark-cutout.svg"), "utf-8").match(/<path[^>]*\sd="([^"]+)"/)[1]
const monochromeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 432 432">
  <g transform="translate(126,126) scale(3.75)">
    <path fill="#FFFFFF" fill-rule="evenodd" clip-rule="evenodd" d="${cutoutD}"></path>
  </g>
</svg>`
const monochromePng = new Resvg(monochromeSvg, { fitTo: { mode: "width", value: 432 } }).render().asPng()
writeFileSync(join(assetsDir, "android-icon-monochrome.png"), monochromePng)

// Favicon — small, so the mark alone (not the lockup) per README's "Tailles" table; the
// -ink variant reads clearly at tiny sizes and doesn't depend on the coral/cream pairing.
writeFileSync(join(assetsDir, "favicon.png"), render(join(logoDir, "vadrouille-mark-ink.svg"), { width: 48 }))

console.log("Wrote icon.png, android-icon-foreground.png, android-icon-background.png, android-icon-monochrome.png, favicon.png")
