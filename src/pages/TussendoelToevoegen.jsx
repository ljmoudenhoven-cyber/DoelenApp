import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSetting, setItem } from '../store/db'

export default function TussendoelToevoegen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isBewerken = Boolean(id)
  const vandaag = new Date().toISOString().split('T')[0]

  const [datum, setDatum] = useState('')
  const [gewicht, setGewicht] = useState('')
  const [vet, setVet] = useState('')
  const [buik, setBuik] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)
  const [geladen, setGeladen] = useState(!isBewerken)
  const [nietGevonden, setNietGevonden] = useState(false)

  useEffect(() => {
    async function laad() {
      if (!isBewerken) return
      const lijst = await getSetting('tussendoelen') || []
      const td = lijst.find(t => t.id === decodeURIComponent(id))
      if (!td) { setNietGevonden(true); setGeladen(true); return }
      setDatum(td.datum || '')
      setGewicht(td.gewicht != null ? String(td.gewicht) : '')
      setVet(td.vetPercentage != null ? String(td.vetPercentage) : '')
      setBuik(td.buikomvang != null ? String(td.buikomvang) : '')
      setGeladen(true)
    }
    laad()
  }, [id, isBewerken])

  async function opslaan() {
    if (!datum) { setFout('Kies een datum.'); return }
    if (!gewicht && !vet && !buik) { setFout('Vul minstens één waarde in.'); return }
    setBezig(true)

    const td = {
      id: isBewerken ? decodeURIComponent(id) : `tussendoel-${datum}-${Date.now()}`,
      datum,
      gewicht: gewicht ? parseFloat(gewicht) : null,
      vetPercentage: vet ? parseFloat(vet) : null,
      buikomvang: buik ? parseFloat(buik) : null,
    }

    const bestaand = await getSetting('tussendoelen') || []
    const index = bestaand.findIndex(t => t.id === td.id)
    const nieuw = index >= 0
      ? bestaand.map((t, i) => i === index ? td : t)
      : [...bestaand, td]
    const gesorteerd = nieuw.sort((a, b) => a.datum.localeCompare(b.datum))
    await setItem('settings', 'tussendoelen', gesorteerd)
    navigate('/tussendoelen')
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-green-500 px-5 pt-14 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">
            {isBewerken ? 'Tussendoel bewerken ✏️' : 'Tussendoel toevoegen 🎯'}
          </h1>
          <p className="text-green-100 text-sm mt-1">
            {isBewerken ? 'Pas datum of waarden aan' : 'Stel een mijlpaal in op een specifieke datum'}
          </p>
        </div>
        <button
          onClick={() => navigate('/tussendoelen')}
          className="bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          {!geladen ? (
            <p className="text-gray-400 text-sm text-center py-6">Laden...</p>
          ) : nietGevonden ? (
            <p className="text-gray-400 text-sm text-center py-6">Tussendoel niet gevonden.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-500 text-xs">
                Je hoeft niet alle velden in te vullen — alleen de waarden die je een tussendoel wilt geven.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={datum}
                  min={isBewerken ? undefined : vandaag}
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

              <button
                onClick={opslaan}
                disabled={bezig}
                className="w-full bg-green-500 text-white font-medium py-3 rounded-xl disabled:opacity-50"
              >
                {bezig ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
