/**
 * The dithered-wave surface shared by the landing hero and the browse headers.
 *
 * Same ramp as CallToAction, so every full-width panel on the site is visibly
 * the same material. It lives outside the component files so those surfaces
 * share one definition and can't drift apart.
 *
 * The scrim is the one difference from CallToAction's own `bg-black/15`. That
 * panel carries a single 48px headline, which survives the ramp's cream crests;
 * the hero and the browse headers carry 14-18px copy, badges and placeholder
 * text, so they need the crests pulled down far enough for white to clear AA.
 */
export const HERO_WAVES = ['#2B4447', '#3A5457', '#D9D2C6', '#F6F0EA']

export const HERO_WAVES_SCRIM = 'bg-black/45'

// What a viewer sees when WebGL2 is unavailable — the ramp's base tone, flat.
export const HERO_WAVES_FALLBACK = 'bg-[#2B4447]'
