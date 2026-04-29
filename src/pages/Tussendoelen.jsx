import { useState, useEffect, useCallback } from 'react'
import { getSetting, setItem } from '../store/db'
import { useNavigate } from 'react-router-dom'
import BottomModal from '../components/BottomModal'

function formatDatum(datumStr) {
  if (!datumStr) return ''
  const d = new Date(datumStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function TussendoelModal({ bestaand, onOpslaan, onSluit }) {
  const vandaag = new Date().toISOString().split('T')[0]
  const [datum, setDatum] = useState(bestaand?.datum || '')
  const [gewicht, setGewicht] = useState(bestaand?.gewicht != null ? String(bestaand.gewicht) : '')
  const [vet, setVet] = useState(bestaand?.vetPercentage != null ? String(bestaand.vetPercentage) : '')
  const [buik, setBuik] = useState(bestaand?.buikomvang != null ? String(bestaand.buikomvang) : '')
  const [fout, setFout] = useState('')

  function opslaan() {
    if (!datum) { setFout('Kies een datum.'); return }
    if (!gewicht && !vet && !buik) { setFout('Vul minstens één waarde in.'); return }
    onOpslaan({
      id: bestaand?.id || `tussendoel-${datum}-${Date.now()}`,
      datum,
      gewicht: gewicht ? parseFloat(gewicht) : null,
      vetPercentage: vet ? parseFloat(vet) : null,
      buikomvang: buik ? parseFloat(buik) : null,
    })
  }

  return (
    <BottomModal titel={bestaand ? 'Tussendoel bewerken' : 'Tussendoel toevoegen'} onSluit={onSluit}>
      <div className="space-y-4">
        <p className="text-gray-500 text-xs">Stel een tussendoel in voor een specifieke datum. Je hoeft niet alle velden in te vullen.</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
          <input
            type="date"
            value={datum}
            min={vandaag}
            onChange={e => setDatum(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doelgewicht (kg)</label>
          <input type="number" inputMode="decimal" step="0.1" value={gewicht}
            onChange={e => setGewicht(e.target.value)} placeholder="bijv. 80"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doelvetpercentage (%)</label>
          <input type="number" inputMode="decimal" step="0.1" value={vet}
            onChange={e => setVet(e.target.value)} placeholder="bijv. 16"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doelbuikomvang (cm)</label>
          <input type="number" inputMode="decimal" step="0.5" value={buik}
            onChange={e => setBuik(e.target.value)} placeholder="bijv. 89"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
        </div>

        {fout && <p className="text-red-500 text-xs">{fout}</p>}

        <button onClick={opslaan} className="w-full bg-green-500 text-white font-medium py-3 rounded-xl">
          Opslaan
        </button>
      </div>
    </BottomModal>
  )
}

export default function Tussendoelen() {
  const navigate = useNavigate()
  const [tussendoelen, setTussendoelen] = useState([])
  const [toonModal, setToonModal] = useState(false)
  const [bewerk, setBewerk] = useState(null)

  const laad = useCallback(async () => {
    const td = await getSetting('tussendoelen')
    setTussendoelen(td || [])
  }, [])

  useEffect(() => { laad() }, [laad])

  async function slaaTussendoelOp(td) {
    const bestaand = await getSetting('tussendoelen') || []
    const index = bestaand.findIndex(t => t.id === td.id)
    const nieuw = index >= 0
      ? bestaand.map((t, i) => i === index ? td : t)
      : [...bestaand, td]
    const gesorteerd = nieuw.sort((a, b) => a.datum.localeCompare(b.datum))
    await setItem('settings', 'tussendoelen', gesorteerd)
    setTussendoelen(gesorteerd)
    setToonModal(false)
    setBewerk(null)
  }

  async function verwijder(id) {
    const bestaand = await getSetting('tussendoelen') || []
    const nieuw = bestaand.filter(t => t.id !== id)
    await setItem('settings', 'tussendoelen', nieuw)
    setTussendoelen(nieuw)
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-green-500 px-5 pt-14 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Tussendoelen 🎯</h1>
          <p className="text-green-100 text-sm mt-1">Mijlpalen op weg naar je einddoel</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/fysiek')}
            className="bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full"
          >
            Sluiten
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        <p className="text-gray-500 text-sm">
          Tussendoelen verschijnen als punten op de doellijn in de grafieken. Zo zie je hoe je koers loopt richting je einddoel.
        </p>

        <button
          onClick={() => { setBewerk(null); setToonModal(true) }}
          className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl text-sm"
        >
          + Tussendoel toevoegen
        </button>

        {tussendoelen.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-gray-400 text-sm">Nog geen tussendoelen.</p>
            <p className="text-gray-300 text-xs mt-1">Voeg een eerste tussendoel toe om je traject in te stellen.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
            {tussendoelen.map(td => (
              <div key={td.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{formatDatum(td.datum)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[
                      td.gewicht != null && `${td.gewicht} kg`,
                      td.vetPercentage != null && `${td.vetPercentage}%`,
                      td.buikomvang != null && `${td.buikomvang} cm`,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setBewerk(td); setToonModal(true) }}
                    className="text-gray-500 text-xs px-3 py-1.5 rounded-lg border border-gray-200"
                  >
                    Bewerk
                  </button>
                  <button
                    onClick={() => verwijder(td.id)}
                    className="text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toonModal && (
        <TussendoelModal
          bestaand={bewerk}
          onOpslaan={slaaTussendoelOp}
          onSluit={() => { setToonModal(false); setBewerk(null) }}
        />
      )}
    </div>
  )
}
