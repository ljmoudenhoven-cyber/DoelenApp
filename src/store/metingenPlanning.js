import { getSetting, setItem, removeItem, getItem } from './db'
import { formatDateKey, maakTaak } from './taken'

export const STANDAARD_PLANNING = {
  actief: false,
  frequentie: 'wekelijks',
  dagen: [3], // woensdag — neutraler dan maandag (geen weekend-effect)
  dagInMaand: 1,
  geenEinddatum: false,
  einddatum: '',
}

const MAX_DAGEN_VOORUIT = 366 // veiligheidscap bij 'geen einddatum'

export async function getMetingenPlanning() {
  const p = await getSetting('metingenPlanning')
  return { ...STANDAARD_PLANNING, ...(p || {}) }
}

export async function saveMetingenPlanning(planning) {
  await setItem('settings', 'metingenPlanning', planning)
}

function moetVandaagMeten(config, vandaag) {
  if (config.frequentie === 'wekelijks') {
    return Array.isArray(config.dagen) && config.dagen.includes(vandaag.getDay())
  }
  if (config.frequentie === 'maandelijks') {
    const laatsteDag = new Date(vandaag.getFullYear(), vandaag.getMonth() + 1, 0).getDate()
    const effectieveDag = Math.min(config.dagInMaand, laatsteDag)
    return vandaag.getDate() === effectieveDag
  }
  return false
}

function nieuweTaak(datumKey) {
  return {
    id: `meting-${datumKey}`,
    type: 'meting',
    datum: datumKey,
    titel: 'Lichaamsmetingen invullen',
    beschrijving: 'Vul je gewicht en vetpercentage in',
    status: 'open',
    aangemaaktOp: new Date().toISOString(),
  }
}

function bepaalHorizonDagen(config) {
  if (!config?.einddatum || config.geenEinddatum) return MAX_DAGEN_VOORUIT
  const eind = new Date(config.einddatum + 'T00:00:00')
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  const dagen = Math.round((eind - vandaag) / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.min(MAX_DAGEN_VOORUIT, dagen))
}

// Bij opslaan van planning: synchroniseer meting-taken tot aan de
// gekozen einddatum (of 1 jaar vooruit als 'geen einddatum').
// - Actief: matchende dagen krijgen een open taak (vandaag forceer reset)
// - Niet actief: alle open meting-taken tot 1 jaar vooruit worden weggehaald
export async function herstartMetingTaakVoorVandaag() {
  const config = await getItem('settings', 'metingenPlanning')
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)

  // Bij niet-actief: ruim altijd ALLE open meting-taken in een ruime horizon op
  const horizon = config?.actief ? bepaalHorizonDagen(config) : MAX_DAGEN_VOORUIT

  for (let i = 0; i <= horizon; i++) {
    const d = new Date(vandaag)
    d.setDate(d.getDate() + i)
    const k = formatDateKey(d)
    const id = `meting-${k}`
    const bestaand = await getItem('taken', id)

    if (!config?.actief) {
      if (bestaand?.status === 'open') await removeItem('taken', id)
      continue
    }

    if (!moetVandaagMeten(config, d)) {
      if (bestaand?.status === 'open') await removeItem('taken', id)
      continue
    }

    if (i === 0) {
      await setItem('taken', id, nieuweTaak(k))
    } else if (!bestaand) {
      await setItem('taken', id, nieuweTaak(k))
    }
  }
}
