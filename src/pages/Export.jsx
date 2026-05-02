import { useState } from 'react'
import { getAll } from '../store/db'
import { formatDateKey } from '../store/taken'
import { Scale, Footprints, Book, SkipForward, Download, Check } from '../components/Iconen'

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

    const datum = formatDateKey(new Date())

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
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6">
        <h1 className="text-accent-fg text-2xl font-bold">Export</h1>
        <p className="text-accent-fg-soft text-sm mt-1">Download je data als CSV</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Wat wordt geëxporteerd?</h2>
          <ul className="space-y-2.5">
            {[
              { Icon: Scale, kleur: 'bg-blue-50 text-blue-600', tekst: 'Lichaamsmetingen (gewicht, vet%, buik, BMI)' },
              { Icon: Footprints, kleur: 'bg-orange-50 text-orange-600', tekst: 'Sportactiviteiten (afstand, tijd, tempo, hartslag)' },
              { Icon: Book, kleur: 'bg-indigo-50 text-indigo-600', tekst: 'Leesdata (boeken, reviews, geleerde lessen)' },
              { Icon: SkipForward, kleur: 'bg-gray-100 text-gray-500', tekst: 'Overgeslagen taken (met reden)' },
            ].map(({ Icon, kleur, tekst }) => (
              <li key={tekst} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${kleur}`}>
                  <Icon size={16} />
                </span>
                <span className="text-gray-600 text-sm">{tekst}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-400 text-xs mt-3">Er worden meerdere CSV-bestanden aangemaakt (één per categorie).</p>
        </div>

        {klaar && (
          <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center shrink-0">
              <Check size={18} />
            </span>
            <div>
              <p className="text-accent-700 font-medium">Export voltooid</p>
              <p className="text-accent-600 text-sm">De bestanden zijn gedownload naar je telefoon.</p>
            </div>
          </div>
        )}

        <button
          onClick={exporteerAlles}
          disabled={bezig}
          className="w-full bg-accent-500 text-accent-fg font-semibold py-4 rounded-xl text-base disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
        >
          {bezig ? (
            'Exporteren...'
          ) : (
            <>
              <Download size={18} strokeWidth={2.25} />
              Exporteer alle data
            </>
          )}
        </button>

        <p className="text-gray-400 text-xs text-center">
          Tip: deel de CSV-bestanden met Claude voor persoonlijke analyses van je voortgang.
        </p>
      </div>
    </div>
  )
}
