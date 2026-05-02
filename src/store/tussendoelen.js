import { getSetting, setItem, getAll } from './db'
import { formatDateKey } from './taken'

export const MAX_RATES_PER_WEEK = {
  gewicht: 1.0,
  vetPercentage: 0.25,
  buikomvang: 0.25,
}

export const LABELS = {
  gewicht: { naam: 'Gewicht', eenheid: 'kg', kort: 'kg' },
  vetPercentage: { naam: 'Vetpercentage', eenheid: '%', kort: '%' },
  buikomvang: { naam: 'Buikomvang', eenheid: 'cm', kort: 'cm' },
}

function dagenTussen(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

// Initiële daling (week 1-2) is grotendeels glycogeen + water en is
// vrijwel constant onafhankelijk van het totaaldoel — daarom een
// absolute cap, niet een percentage van het totaal.
const INITIAL_DROP_LIMITS = {
  gewicht: { min: 0.5, max: 2.0, pct: 0.05 },
  vetPercentage: { min: 0.2, max: 1.0, pct: 0.10 },
  buikomvang: { min: 0.5, max: 2.0, pct: 0.10 },
}

function berekenInitialDrop(totaalChange, type) {
  const c = INITIAL_DROP_LIMITS[type] || INITIAL_DROP_LIMITS.gewicht
  return Math.min(c.max, Math.max(c.min, totaalChange * c.pct))
}

// Driefase-progressie:
// - Fase 1 (dag 0-14): initiële daling (water + glycogeen), absoluut begrensd
// - Fase 2 (dag 14 tot 75% van resterende tijd): 85% van resterende verlies
// - Fase 3 (laatste 25% van resterende tijd): 15% van resterende verlies (taper)
function progressBijTijd({ t, T, totaalChange, type }) {
  if (T < 28 || totaalChange < 1) return t / T
  const initialDrop = berekenInitialDrop(totaalChange, type)
  const initialPct = initialDrop / totaalChange
  if (t <= 14) return initialPct * (t / 14)

  const restPct = 1 - initialPct
  const fase2Pct = restPct * 0.85
  const fase3Pct = restPct * 0.15
  const fase2Dagen = (T - 14) * 0.75
  const fase2Eind = 14 + fase2Dagen
  const fase3Dagen = T - fase2Eind

  if (t <= fase2Eind) return initialPct + fase2Pct * ((t - 14) / fase2Dagen)
  return initialPct + fase2Pct + fase3Pct * ((t - fase2Eind) / fase3Dagen)
}

function rondAf(waarde, type) {
  if (type === 'buikomvang') return Math.round(waarde * 2) / 2
  return Math.round(waarde * 10) / 10
}

export function valideerDoelTempo(huidig, doel, dagen, type) {
  if (huidig == null || doel == null) return { ok: true, vanToepassing: false }
  const verschil = Math.abs(huidig - doel)
  if (verschil === 0) return { ok: true, vanToepassing: false }
  const weken = dagen / 7
  const ratePerWeek = verschil / weken
  const max = MAX_RATES_PER_WEEK[type]
  if (ratePerWeek > max) {
    const minWeken = Math.ceil(verschil / max)
    const minDatum = new Date()
    minDatum.setDate(minDatum.getDate() + minWeken * 7)
    return {
      ok: false,
      vanToepassing: true,
      huidigTempo: Math.round(ratePerWeek * 100) / 100,
      maxTempo: max,
      minWeken,
      suggestieDatum: formatDateKey(minDatum),
    }
  }
  return { ok: true, vanToepassing: true, huidigTempo: Math.round(ratePerWeek * 100) / 100 }
}

export function berekenTussendoelen({ startDatum, eindDatum, huidig, doel }) {
  const start = new Date(startDatum + 'T00:00:00')
  const eind = new Date(eindDatum + 'T00:00:00')
  const T = dagenTussen(start, eind)
  if (T <= 14) return []

  const datums = []
  for (let dag = 14; dag < T; dag += 14) {
    const d = new Date(start)
    d.setDate(d.getDate() + dag)
    datums.push({ datum: formatDateKey(d), t: dag })
  }

  return datums.map(({ datum, t }) => {
    const td = {
      id: `tussendoel-auto-${datum}`,
      datum,
    }
    if (huidig.gewicht != null && doel.gewicht != null) {
      const totaal = Math.abs(huidig.gewicht - doel.gewicht)
      const p = progressBijTijd({ t, T, totaalChange: totaal, type: 'gewicht' })
      td.gewicht = rondAf(huidig.gewicht - (huidig.gewicht - doel.gewicht) * p, 'gewicht')
    }
    if (huidig.vetPercentage != null && doel.vetPercentage != null) {
      const totaal = Math.abs(huidig.vetPercentage - doel.vetPercentage)
      const p = progressBijTijd({ t, T, totaalChange: totaal, type: 'vetPercentage' })
      td.vetPercentage = rondAf(huidig.vetPercentage - (huidig.vetPercentage - doel.vetPercentage) * p, 'vetPercentage')
    }
    if (huidig.buikomvang != null && doel.buikomvang != null) {
      const totaal = Math.abs(huidig.buikomvang - doel.buikomvang)
      const p = progressBijTijd({ t, T, totaalChange: totaal, type: 'buikomvang' })
      td.buikomvang = rondAf(huidig.buikomvang - (huidig.buikomvang - doel.buikomvang) * p, 'buikomvang')
    }
    return td
  })
}

export async function getHuidigeStand() {
  const metingen = await getAll('metingen')
  if (metingen.length === 0) return null
  return metingen.sort((a, b) => b.datum.localeCompare(a.datum))[0]
}

export async function vervangAlleTussendoelen(nieuwe) {
  const gesorteerd = [...nieuwe].sort((a, b) => a.datum.localeCompare(b.datum))
  await setItem('settings', 'tussendoelen', gesorteerd)
  return gesorteerd
}
