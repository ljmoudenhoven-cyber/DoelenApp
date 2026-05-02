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

function progressBijTijd(t, T) {
  if (T < 28) return t / T
  const fase1Eind = 14
  const fase2Eind = T * 0.75
  if (t <= fase1Eind) return (t / fase1Eind) * 0.20
  if (t <= fase2Eind) return 0.20 + ((t - fase1Eind) / (fase2Eind - fase1Eind)) * 0.60
  return 0.80 + ((t - fase2Eind) / (T - fase2Eind)) * 0.20
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
    const progress = progressBijTijd(t, T)
    const td = {
      id: `tussendoel-auto-${datum}`,
      datum,
      automatisch: true,
    }
    if (huidig.gewicht != null && doel.gewicht != null) {
      td.gewicht = rondAf(huidig.gewicht - (huidig.gewicht - doel.gewicht) * progress, 'gewicht')
    }
    if (huidig.vetPercentage != null && doel.vetPercentage != null) {
      td.vetPercentage = rondAf(huidig.vetPercentage - (huidig.vetPercentage - doel.vetPercentage) * progress, 'vetPercentage')
    }
    if (huidig.buikomvang != null && doel.buikomvang != null) {
      td.buikomvang = rondAf(huidig.buikomvang - (huidig.buikomvang - doel.buikomvang) * progress, 'buikomvang')
    }
    return td
  })
}

export async function getHuidigeStand() {
  const metingen = await getAll('metingen')
  if (metingen.length === 0) return null
  return metingen.sort((a, b) => b.datum.localeCompare(a.datum))[0]
}

export async function vervangAutomatischeTussendoelen(nieuweAutomatisch) {
  const bestaand = await getSetting('tussendoelen') || []
  const handmatige = bestaand.filter(t => !t.automatisch)
  const samen = [...handmatige, ...nieuweAutomatisch].sort((a, b) => a.datum.localeCompare(b.datum))
  await setItem('settings', 'tussendoelen', samen)
  return samen
}
