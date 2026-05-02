export const PALETTEN = [
  { id: 'groen', label: 'Groen', voorbeeld: '#22c55e' },
  { id: 'blauw', label: 'Blauw', voorbeeld: '#3b82f6' },
  { id: 'paars', label: 'Paars', voorbeeld: '#a855f7' },
  { id: 'oranje', label: 'Oranje', voorbeeld: '#f97316' },
  { id: 'rose', label: 'Rose', voorbeeld: '#f43f5e' },
  { id: 'teal', label: 'Teal', voorbeeld: '#14b8a6' },
]

const PALET_HEX = Object.fromEntries(PALETTEN.map(p => [p.id, p.voorbeeld]))
const TINT_KEYS = ['50', '100', '200', '500', '600', '700']

function hexNaarHsl(hex) {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16) / 255
  const g = parseInt(m.slice(2, 4), 16) / 255
  const b = parseInt(m.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
      case g: h = ((b - r) / d + 2); break
      case b: h = ((r - g) / d + 4); break
    }
    h /= 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslNaarHex(h, s, l) {
  s /= 100
  l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// WCAG relatieve luminance — boven 0.55 = te licht voor witte tekst
function isLichteKleur(hex) {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16) / 255
  const g = parseInt(m.slice(2, 4), 16) / 255
  const b = parseInt(m.slice(4, 6), 16) / 255
  const lin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L > 0.55
}

export function tintsVanHex(hex) {
  const { h, s } = hexNaarHsl(hex)
  return {
    50:  hslNaarHex(h, Math.min(s, 80), 96),
    100: hslNaarHex(h, Math.min(s, 85), 91),
    200: hslNaarHex(h, Math.min(s, 90), 82),
    500: hex,
    600: hslNaarHex(h, s, 42),
    700: hslNaarHex(h, s, 32),
  }
}

function updateThemeColorMeta(hex) {
  const m = document.querySelector('meta[name=theme-color]')
  if (m) m.setAttribute('content', hex)
}

export function pasThemaToe(thema, customHex) {
  const root = document.documentElement
  let accent500
  if (thema === 'aangepast' && customHex) {
    const t = tintsVanHex(customHex)
    root.setAttribute('data-thema', 'aangepast')
    TINT_KEYS.forEach(k => root.style.setProperty(`--accent-${k}`, t[k]))
    if (isLichteKleur(customHex)) {
      root.style.setProperty('--accent-fg', '#1f2937')
      root.style.setProperty('--accent-fg-soft', t[700])
    } else {
      root.style.setProperty('--accent-fg', '#ffffff')
      root.style.setProperty('--accent-fg-soft', t[100])
    }
    accent500 = customHex
  } else {
    const id = thema || 'groen'
    root.setAttribute('data-thema', id)
    TINT_KEYS.forEach(k => root.style.removeProperty(`--accent-${k}`))
    root.style.removeProperty('--accent-fg')
    root.style.removeProperty('--accent-fg-soft')
    accent500 = PALET_HEX[id] || PALET_HEX.groen
  }
  updateThemeColorMeta(accent500)
}
