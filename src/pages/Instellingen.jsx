import { useState, useEffect } from 'react'
import { getSetting, setSetting, setItem } from '../store/db'
import { useNavigate } from 'react-router-dom'

export default function Instellingen() {
  const navigate = useNavigate()
  const [lengte, setLengte] = useState('')
  const [doelGewicht, setDoelGewicht] = useState('')
  const [doelVet, setDoelVet] = useState('')
  const [doelBuik, setDoelBuik] = useState('')
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    async function laad() {
      const [l, doelen] = await Promise.all([
        getSetting('lengte'),
        getSetting('fysiekDoelen'),
      ])
      if (l) setLengte(String(l))
      if (doelen) {
        if (doelen.doelGewicht) setDoelGewicht(String(doelen.doelGewicht))
        if (doelen.doelVet) setDoelVet(String(doelen.doelVet))
        if (doelen.doelBuik) setDoelBuik(String(doelen.doelBuik))
      }
    }
    laad()
  }, [])

  async function opslaan() {
    if (!lengte || parseInt(lengte) < 100 || parseInt(lengte) > 250) {
      setFout('Vul een geldige lengte in (100–250 cm).')
      return
    }

    await setSetting('lengte', parseInt(lengte))

    if (doelGewicht || doelVet || doelBuik) {
      await setItem('settings', 'fysiekDoelen', {
        doelGewicht: doelGewicht ? parseFloat(doelGewicht) : null,
        doelVet: doelVet ? parseFloat(doelVet) : null,
        doelBuik: doelBuik ? parseFloat(doelBuik) : null,
      })
    }

    setOpgeslagen(true)
    setTimeout(() => navigate('/'), 1000)
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-green-500 px-5 pt-14 pb-6">
        <h1 className="text-white text-2xl font-bold">Instellingen ⚙️</h1>
        <p className="text-green-100 text-sm mt-1">Eenmalig in te stellen</p>
      </div>

      <div className="px-4 py-5 space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Jouw gegevens</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lichaamslengte (cm) <span className="text-red-400">*</span></label>
            <input
              type="number"
              inputMode="numeric"
              value={lengte}
              onChange={e => { setLengte(e.target.value); setFout('') }}
              placeholder="bijv. 182"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            />
            <p className="text-gray-400 text-xs mt-1">Nodig voor BMI-berekening</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Fysieke doelen</h2>
            <p className="text-gray-400 text-xs mt-1">Optioneel — je kunt dit later ook instellen</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doelgewicht (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={doelGewicht}
              onChange={e => setDoelGewicht(e.target.value)}
              placeholder="bijv. 78"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doelvetpercentage (%)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={doelVet}
              onChange={e => setDoelVet(e.target.value)}
              placeholder="bijv. 15"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doelbuikomvang (cm)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={doelBuik}
              onChange={e => setDoelBuik(e.target.value)}
              placeholder="bijv. 88"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {fout && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{fout}</p>
          </div>
        )}

        {opgeslagen && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-green-700 font-medium">Opgeslagen! ✅ Je wordt doorgestuurd...</p>
          </div>
        )}

        <button
          onClick={opslaan}
          disabled={opgeslagen}
          className="w-full bg-green-500 text-white font-semibold py-4 rounded-xl text-base shadow-sm disabled:opacity-50"
        >
          Opslaan & starten
        </button>
      </div>
    </div>
  )
}
