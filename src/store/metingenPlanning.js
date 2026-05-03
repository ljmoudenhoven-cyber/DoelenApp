import { getSetting, setItem, removeItem, getItem } from './db'
import { formatDateKey, maakTaak } from './taken'

export const STANDAARD_PLANNING = {
  actief: false,
  frequentie: 'wekelijks',
  dagen: [3], // woensdag — neutraler dan maandag (geen weekend-effect)
  dagInMaand: 1,
}

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

const HORIZON_DAGEN = 60

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

// Bij opslaan van planning: synchroniseer alle meting-taken in een
// horizon van 60 dagen vooruit.
// - Actief: matchende dagen krijgen een open taak (vandaag wordt geforceerd
//   teruggezet, toekomstige worden alleen aangemaakt als ze nog niet bestaan)
// - Niet actief: alle open meting-taken in de horizon worden verwijderd
export async function herstartMetingTaakVoorVandaag() {
  const config = await getItem('settings', 'metingenPlanning')
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)

  for (let i = 0; i <= HORIZON_DAGEN; i++) {
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
      // Was eerder gepland (open) en is nu uitgevallen: schoonmaken
      if (bestaand?.status === 'open') await removeItem('taken', id)
      continue
    }

    if (i === 0) {
      // Vandaag: forceer reset naar open
      await setItem('taken', id, nieuweTaak(k))
    } else if (!bestaand) {
      await setItem('taken', id, nieuweTaak(k))
    }
  }
}
