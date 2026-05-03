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
  const dag = vandaag.getDay()
  const dagInMaand = vandaag.getDate()
  if (config.frequentie === 'wekelijks') {
    return Array.isArray(config.dagen) && config.dagen.includes(dag)
  }
  if (config.frequentie === 'maandelijks') {
    return dagInMaand === config.dagInMaand
  }
  return false
}

export async function genereerMetingTaakVoorVandaag(vandaag = new Date()) {
  const config = await getItem('settings', 'metingenPlanning')
  if (!config?.actief) return
  if (!moetVandaagMeten(config, vandaag)) return
  const datumKey = formatDateKey(vandaag)
  await maakTaak({
    id: `meting-${datumKey}`,
    type: 'meting',
    datum: datumKey,
    titel: 'Lichaamsmetingen invullen',
    beschrijving: 'Vul je gewicht, vetpercentage en buikomvang in',
  })
}

export async function herstartMetingTaakVoorVandaag() {
  const config = await getItem('settings', 'metingenPlanning')
  const vandaag = new Date()
  const datumKey = formatDateKey(vandaag)
  const id = `meting-${datumKey}`

  if (!config?.actief) {
    const bestaand = await getItem('taken', id)
    if (bestaand?.status === 'open') await removeItem('taken', id)
    return
  }

  if (!moetVandaagMeten(config, vandaag)) return

  await setItem('taken', id, {
    id,
    type: 'meting',
    datum: datumKey,
    titel: 'Lichaamsmetingen invullen',
    beschrijving: 'Vul je gewicht, vetpercentage en buikomvang in',
    status: 'open',
    aangemaaktOp: new Date().toISOString(),
  })
}
