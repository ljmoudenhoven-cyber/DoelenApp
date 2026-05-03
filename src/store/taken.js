import { getAll, setItem, getItem, removeItem } from './db'

const MAX_OCCURRENCES = 366

export function formatDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dagVerschil(datumStr) {
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  const taakDatum = new Date(datumStr)
  taakDatum.setHours(0, 0, 0, 0)
  return Math.floor((vandaag - taakDatum) / (1000 * 60 * 60 * 24))
}

export async function getTakenVoorVandaag() {
  const vandaag = formatDateKey(new Date())
  const alleTaken = await getAll('taken')
  return alleTaken.filter(t => t.datum === vandaag && t.status === 'open')
}

export async function getTeLaatTaken() {
  const vandaag = formatDateKey(new Date())
  const alleTaken = await getAll('taken')
  return alleTaken
    .filter(t => t.datum < vandaag && t.status === 'open')
    .map(t => ({ ...t, dagenTeLaat: dagVerschil(t.datum) }))
    .sort((a, b) => a.datum.localeCompare(b.datum))
}

export async function getTakenKomende7Dagen() {
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  const vandaagKey = formatDateKey(vandaag)
  const grens = new Date(vandaag)
  grens.setDate(grens.getDate() + 7)
  const grensKey = formatDateKey(grens)

  const alleTaken = await getAll('taken')
  return alleTaken
    .filter(t => t.status === 'open' && t.datum > vandaagKey && t.datum <= grensKey)
    .sort((a, b) => a.datum.localeCompare(b.datum))
}

export async function maakHandmatigeTaak({ type, titel, datum, beschrijving }) {
  const id = `${type}-${Date.now()}`
  await setItem('taken', id, {
    id,
    type,
    titel,
    datum,
    beschrijving: beschrijving || '',
    handmatig: true,
    status: 'open',
    aangemaaktOp: new Date().toISOString(),
  })
}

function berekenHerhalingsdata(startDatum, herhaling) {
  const start = new Date(startDatum + 'T00:00:00')
  const eind = new Date(herhaling.tot + 'T00:00:00')
  const datums = []

  if (herhaling.type === 'dagelijks') {
    const cursor = new Date(start)
    while (cursor <= eind && datums.length < MAX_OCCURRENCES) {
      datums.push(formatDateKey(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
  } else if (herhaling.type === 'wekelijks') {
    const dagen = new Set(herhaling.dagen || [])
    if (dagen.size === 0) dagen.add(start.getDay())
    const cursor = new Date(start)
    while (cursor <= eind && datums.length < MAX_OCCURRENCES) {
      if (dagen.has(cursor.getDay())) datums.push(formatDateKey(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
  } else if (herhaling.type === 'maandelijks') {
    const dagInMaand = start.getDate()
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cursor <= eind && datums.length < MAX_OCCURRENCES) {
      const laatsteDag = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
      const echteDag = Math.min(dagInMaand, laatsteDag)
      const occ = new Date(cursor.getFullYear(), cursor.getMonth(), echteDag)
      if (occ >= start && occ <= eind) datums.push(formatDateKey(occ))
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }

  return datums
}

export async function maakHerhalendeTaak({ type, titel, datum, beschrijving, herhaling }) {
  const datums = berekenHerhalingsdata(datum, herhaling)
  if (datums.length === 0) return
  const serieId = `serie-${Date.now()}`
  const aangemaaktOp = new Date().toISOString()
  const basis = Date.now()
  await Promise.all(datums.map((d, i) =>
    setItem('taken', `${type}-${basis}-${i}`, {
      id: `${type}-${basis}-${i}`,
      type,
      titel,
      datum: d,
      beschrijving: beschrijving || '',
      handmatig: true,
      serieId,
      herhaling,
      status: 'open',
      aangemaaktOp,
    })
  ))
}

export async function verwijderTaak(taakId) {
  await removeItem('taken', taakId)
}

export async function verwijderSerie(serieId) {
  const alle = await getAll('taken')
  const inSerie = alle.filter(t => t.serieId === serieId)
  await Promise.all(inSerie.map(t => removeItem('taken', t.id)))
}

export async function taakAfvinken(taakId) {
  const taak = await getItem('taken', taakId)
  if (taak) {
    await setItem('taken', taakId, { ...taak, status: 'voltooid', voltooidOp: new Date().toISOString() })
  }
}

export async function taakOverslaan(taakId, reden) {
  const taak = await getItem('taken', taakId)
  if (taak) {
    await setItem('taken', taakId, { ...taak, status: 'overgeslagen', reden, overslagenOp: new Date().toISOString() })
  }
}

export async function maakTaak(taak) {
  const id = taak.id || `${taak.type}-${taak.datum}`
  const bestaand = await getItem('taken', id)
  if (!bestaand) {
    await setItem('taken', id, { ...taak, id, status: 'open', aangemaaktOp: new Date().toISOString() })
  }
}

async function genereerHealthcheckTaak(vandaag) {
  const config = await getItem('settings', 'healthcheckConfig')
  if (!config?.actief) return
  const dag = vandaag.getDay()
  const moetVandaag = config.frequentie === 'dagelijks' ||
    (config.frequentie === 'wekelijks' && Array.isArray(config.dagen) && config.dagen.includes(dag))
  if (!moetVandaag) return
  const datumKey = formatDateKey(vandaag)
  await maakTaak({
    id: `healthcheck-${datumKey}`,
    type: 'healthcheck',
    datum: datumKey,
    titel: 'Dagelijkse check-in',
    beschrijving: 'Hoe was je dag?',
  })
}

export async function herstartHealthcheckVoorVandaag() {
  const config = await getItem('settings', 'healthcheckConfig')
  if (!config) return
  const vandaag = new Date()
  const datumKey = formatDateKey(vandaag)
  const id = `healthcheck-${datumKey}`

  if (!config.actief) {
    const bestaand = await getItem('taken', id)
    if (bestaand?.status === 'open') await removeItem('taken', id)
    return
  }

  const dag = vandaag.getDay()
  const moetVandaag = config.frequentie === 'dagelijks' ||
    (config.frequentie === 'wekelijks' && Array.isArray(config.dagen) && config.dagen.includes(dag))
  if (!moetVandaag) return

  await setItem('taken', id, {
    id,
    type: 'healthcheck',
    datum: datumKey,
    titel: 'Dagelijkse check-in',
    beschrijving: 'Hoe was je dag?',
    status: 'open',
    aangemaaktOp: new Date().toISOString(),
  })
}

export async function genereerWekelijkseTaken() {
  const vandaag = new Date()
  const dag = vandaag.getDay()

  await genereerHealthcheckTaak(vandaag)

  // Lichaamsmetingen op basis van metingenPlanning
  const metingPlanning = await getItem('settings', 'metingenPlanning')
  if (metingPlanning?.actief) {
    let moetMeten = false
    if (metingPlanning.frequentie === 'wekelijks') {
      moetMeten = Array.isArray(metingPlanning.dagen) && metingPlanning.dagen.includes(dag)
    } else if (metingPlanning.frequentie === 'maandelijks') {
      const laatsteDag = new Date(vandaag.getFullYear(), vandaag.getMonth() + 1, 0).getDate()
      const effectieveDag = Math.min(metingPlanning.dagInMaand, laatsteDag)
      moetMeten = vandaag.getDate() === effectieveDag
    }
    if (moetMeten) {
      await maakTaak({
        id: `meting-${formatDateKey(vandaag)}`,
        type: 'meting',
        datum: formatDateKey(vandaag),
        titel: 'Lichaamsmetingen invullen',
        beschrijving: 'Vul je gewicht, vetpercentage en buikomvang in',
      })
    }
  }

  // Sport: maandag of vrijdag
  if (dag === 1 || dag === 5) {
    const schema = await getItem('settings', 'sportSchema')
    if (schema) {
      const datumKey = formatDateKey(vandaag)
      const training = schema.find(s => s.datum === datumKey)
      if (training) {
        await maakTaak({
          id: `sport-${datumKey}`,
          type: 'sport',
          datum: datumKey,
          titel: `Hardlopen — ${training.doelAfstand}km`,
          beschrijving: `Doel: ${training.doelAfstand}km in ~${training.doelTijd} min`,
          doelAfstand: training.doelAfstand,
          doelTijd: training.doelTijd,
        })
      }
    }
  }

  // Lezen: wekelijks op zondag
  if (dag === 0) {
    const huidigBoek = await getItem('settings', 'huidigBoek')
    if (huidigBoek) {
      await maakTaak({
        id: `lezen-voortgang-${formatDateKey(vandaag)}`,
        type: 'lezen-voortgang',
        datum: formatDateKey(vandaag),
        titel: 'Leesvoortgang invullen',
        beschrijving: `Hoever ben je met "${huidigBoek.titel}"?`,
      })
    }
  }

  // Eerste van de maand: nieuw boek
  if (vandaag.getDate() === 1) {
    await maakTaak({
      id: `lezen-nieuwboek-${vandaag.getFullYear()}-${vandaag.getMonth() + 1}`,
      type: 'lezen-nieuwboek',
      datum: formatDateKey(vandaag),
      titel: 'Nieuw boek toevoegen',
      beschrijving: 'Het is een nieuwe maand — voeg het boek toe dat je gaat lezen',
    })
  }

  // Laatste dag van de maand: boekreview
  const morgen = new Date(vandaag)
  morgen.setDate(morgen.getDate() + 1)
  if (morgen.getDate() === 1) {
    const huidigBoek = await getItem('settings', 'huidigBoek')
    if (huidigBoek) {
      await maakTaak({
        id: `lezen-review-${vandaag.getFullYear()}-${vandaag.getMonth() + 1}`,
        type: 'lezen-review',
        datum: formatDateKey(vandaag),
        titel: 'Boekreview invullen',
        beschrijving: `Wat vond je van "${huidigBoek.titel}"?`,
      })
    }
  }
}
