import { getSetting, setItem } from './db'

export const THEMAS = [
  { id: 'gevoel', label: 'Algemeen gevoel', uitleg: 'Hoe voelde je je vandaag in het algemeen?' },
  { id: 'slaap', label: 'Slaap', uitleg: 'Hoe heb je de afgelopen nacht geslapen?' },
  { id: 'maaltijden', label: 'Maaltijden', uitleg: 'Wat at je per maaltijd?' },
  { id: 'water', label: 'Water', uitleg: 'Hoeveel glazen water heb je gedronken?' },
  { id: 'sport', label: 'Sport', uitleg: 'Heb je gesport vandaag?' },
  { id: 'meditatie', label: 'Meditatie', uitleg: 'Heb je een moment van meditatie gehad?' },
  { id: 'medicijnen', label: 'Medicijnen', uitleg: 'Heb je medicijnen gebruikt?' },
  { id: 'hoofdpijn', label: 'Hoofdpijn', uitleg: 'Last gehad van hoofdpijn of migraine?' },
]

export const STANDAARD_CONFIG = {
  actief: false,
  frequentie: 'dagelijks',
  dagen: [0, 1, 2, 3, 4, 5, 6],
  themas: {
    gevoel: true,
    slaap: true,
    maaltijden: true,
    water: true,
    sport: false,
    meditatie: false,
    medicijnen: false,
    hoofdpijn: false,
  },
}

export async function getHealthcheckConfig() {
  const c = await getSetting('healthcheckConfig')
  if (!c) return STANDAARD_CONFIG
  return {
    ...STANDAARD_CONFIG,
    ...c,
    themas: { ...STANDAARD_CONFIG.themas, ...(c.themas || {}) },
  }
}

export async function saveHealthcheckConfig(config) {
  await setItem('settings', 'healthcheckConfig', config)
}
