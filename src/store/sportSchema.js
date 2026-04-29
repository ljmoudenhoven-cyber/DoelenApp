// Genereer progressief hardloopschema van vandaag tot 12 aug 2026
// Startpunt: gevorderd beginner (~4km), doel: 10km in <55min op 12-08-2026

export function genereerSportSchema() {
  const doel = new Date('2026-08-12')
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const schema = []
  const huidigeDate = new Date(start)

  // Zoek eerste maandag
  while (huidigeDate.getDay() !== 1) {
    huidigeDate.setDate(huidigeDate.getDate() + 1)
  }

  let week = 0
  const startAfstand = 4.0 // km

  while (huidigeDate <= doel) {
    const dag = huidigeDate.getDay()

    if (dag === 1 || dag === 5) {
      // Progressie: elke 2 weken ~10% meer, max 11km, 14 weken tot doel
      const totaalWeken = Math.ceil((doel - start) / (7 * 24 * 60 * 60 * 1000))
      const weekNummer = Math.floor(week / 2)

      let afstand
      if (weekNummer < totaalWeken * 0.3) {
        // Eerste 30%: opbouw van 4 naar 6km
        afstand = startAfstand + (weekNummer / (totaalWeken * 0.3)) * 2
      } else if (weekNummer < totaalWeken * 0.6) {
        // Midden 30%: 6 naar 8.5km
        afstand = 6 + ((weekNummer - totaalWeken * 0.3) / (totaalWeken * 0.3)) * 2.5
      } else if (weekNummer < totaalWeken * 0.85) {
        // Volgende 25%: 8.5 naar 10km
        afstand = 8.5 + ((weekNummer - totaalWeken * 0.6) / (totaalWeken * 0.25)) * 1.5
      } else {
        // Laatste 15%: consolideren op 10km+
        afstand = 10
      }

      // Afwisseling: vrijdag iets korter (herstelrun)
      if (dag === 5) afstand = Math.max(3, afstand * 0.75)

      afstand = Math.round(afstand * 10) / 10

      // Doeltijd berekenen op basis van gewenste eindtempo (5:30/km)
      const doelTempo = 5.5 // min/km
      const doelTijd = Math.round(afstand * doelTempo)

      schema.push({
        datum: huidigeDate.toISOString().split('T')[0],
        week: weekNummer + 1,
        dag: dag === 1 ? 'Maandag' : 'Vrijdag',
        doelAfstand: afstand,
        doelTijd,
      })

      if (dag === 5) week++
    }

    huidigeDate.setDate(huidigeDate.getDate() + 1)
  }

  return schema
}
