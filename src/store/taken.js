import { getAll, setItem, getItem } from './db'

export function formatDateKey(date) {
  return date.toISOString().split('T')[0]
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

export async function genereerWekelijkseTaken() {
  const vandaag = new Date()
  const dag = vandaag.getDay()

  // Maandag = 1
  if (dag === 1) {
    await maakTaak({
      id: `meting-${formatDateKey(vandaag)}`,
      type: 'meting',
      datum: formatDateKey(vandaag),
      titel: 'Lichaamsmetingen invullen',
      beschrijving: 'Vul je gewicht, vetpercentage en buikomvang in',
    })
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
