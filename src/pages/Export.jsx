import { useState } from 'react'
import { getAll } from '../store/db'

function arrayNaarCSV(data, kolommen) {
  if (data.length === 0) return kolommen.join(',') + '\n'
  const rijen = data.map(r =>
    kolommen.map(k => {
      const waarde = r[k] ?? ''
      const str = String(waarde)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  )
  return [kolommen.join(','), ...rijen].join('\n')
}

function downloadCSV(inhoud, bestandsnaam) {
  const blob = new Blob(['\uFEFF' + inhoud], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = bestandsnaam
  link.click()
  URL.revokeObjectURL(url)
}

export default function Export() {
  const [bezig, setBezig] = useState(false)
  const [klaar, setKlaar] = useState(false)

  async function exporteerAlles() {
    setBezig(true)
    setKlaar(false)

    const [metingen, sport, lezen, taken] = await Promise.all([
      getAll('metingen'),
      getAll('sport'),
      getAll('lezen'),
      getAll('taken'),
    ])

    const datum = new Date().toISOString().split('T')[0]

    // Lichaamsmetingen
    const metingenCSV = arrayNaarCSV(
      metingen.sort((a, b) => a.datum.localeCompare(b.datum)),
      ['datum', 'gewicht', 'vetPercentage', 'buikomvang', 'bmi']
    )
    downloadCSV(metingenCSV, `levensapp-metingen-${datum}.csv`)

    // Sportactiviteiten
    const sportData = sport.sort((a, b) => a.datum.localeCompare(b.datum)).map(a => ({
      datum: a.datum,
      afstand_km: a.afstand,
      tijd_sec: a.tijdSec,
      tijd_mmss: a.tijdSec ? `${Math.floor(a.tijdSec / 60)}:${String(a.tijdSec % 60).padStart(2, '0')}` : '',
      tempo_min_per_km: a.tempo ? Math.round(a.tempo * 100) / 100 : '',
      hartslag_bpm: a.hartslag || '',
    }))
    downloadCSV(
      arrayNaarCSV(sportData, ['datum', 'afstand_km', 'tijd_mmss', 'tempo_min_per_km', 'hartslag_bpm']),
      `levensapp-sport-${datum}.csv`
    )

    // Lezen
    const lezenData = lezen.filter(b => b.titel).map(b => ({
      maand: b.maand,
      titel: b.titel,
      totaal_paginas: b.totaalPaginas,
      afgerond: b.afgerond || '',
      beoordeling: b.review?.beoordeling || '',
      mening: b.review?.mening || '',
      geleerd: b.review?.geleerd || '',
    }))
    downloadCSV(
      arrayNaarCSV(lezenData, ['maand', 'titel', 'totaal_paginas', 'afgerond', 'beoordeling', 'mening', 'geleerd']),
      `levensapp-lezen-${datum}.csv`
    )

    // Overgeslagen taken
    const overslagen = taken.filter(t => t.status === 'overgeslagen').map(t => ({
      datum: t.datum,
      taak: t.titel,
      reden: t.reden || '',
      overgeslagen_op: t.overslagenOp ? t.overslagenOp.split('T')[0] : '',
    }))
    if (overslagen.length > 0) {
      downloadCSV(
        arrayNaarCSV(overslagen, ['datum', 'taak', 'reden', 'overgeslagen_op']),
        `levensapp-overgeslagen-${datum}.csv`
      )
    }

    setBezig(false)
    setKlaar(true)
  }

  return (
    <div className="flex flex-col">
      <div className="bg-green-500 px-5 pt-14 pb-6">
        <h1 className="text-white text-2xl font-bold">Export 📤</h1>
        <p className="text-green-100 text-sm mt-1">Download je data als CSV</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-2">Wat wordt geëxporteerd?</h2>
          <ul className="space-y-1.5">
            {[
              '⚖️ Lichaamsmetingen (gewicht, vet%, buik, BMI)',
              '🏃 Sportactiviteiten (afstand, tijd, tempo, hartslag)',
              '📚 Leesdata (boeken, reviews, geleerde lessen)',
              '⏭️ Overgeslagen taken (met reden)',
            ].map(item => (
              <li key={item} className="text-gray-600 text-sm">{item}</li>
            ))}
          </ul>
          <p className="text-gray-400 text-xs mt-3">Er worden meerdere CSV-bestanden aangemaakt (één per categorie).</p>
        </div>

        {klaar && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-medium">Export voltooid! ✅</p>
            <p className="text-green-600 text-sm mt-1">De bestanden zijn gedownload naar je telefoon.</p>
          </div>
        )}

        <button
          onClick={exporteerAlles}
          disabled={bezig}
          className="w-full bg-green-500 text-white font-semibold py-4 rounded-xl text-base disabled:opacity-50 shadow-sm"
        >
          {bezig ? 'Exporteren...' : '📥 Exporteer alle data'}
        </button>

        <p className="text-gray-400 text-xs text-center">
          Tip: deel de CSV-bestanden met Claude voor persoonlijke analyses van je voortgang.
        </p>
      </div>
    </div>
  )
}
