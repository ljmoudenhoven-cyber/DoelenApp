import { useState } from 'react'
import { getSetting } from '../../store/db'
import { setItem } from '../../store/db'
import { taakAfvinken } from '../../store/taken'

function berekenBMI(gewicht, lengte) {
  if (!gewicht || !lengte) return null
  const l = lengte / 100
  return Math.round((gewicht / (l * l)) * 10) / 10
}

export default function MetingFormulier({ taak, onVoltooid }) {
  const [gewicht, setGewicht] = useState('')
  const [vetPercentage, setVetPercentage] = useState('')
  const [buikomvang, setBuikomvang] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  async function opslaan() {
    if (!gewicht || !vetPercentage || !buikomvang) {
      setFout('Vul alle velden in.')
      return
    }
    setBezig(true)
    const lengte = await getSetting('lengte')
    const bmi = berekenBMI(parseFloat(gewicht), parseFloat(lengte))

    const meting = {
      id: taak.datum,
      datum: taak.datum,
      gewicht: parseFloat(gewicht),
      vetPercentage: parseFloat(vetPercentage),
      buikomvang: parseFloat(buikomvang),
      bmi,
      ingevoerdOp: new Date().toISOString(),
    }

    await setItem('metingen', meting.id, meting)
    await taakAfvinken(taak.id)
    onVoltooid()
  }

  const bmiVooruitkijken = gewicht ? null : null

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">{taak.beschrijving}</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gewicht (kg)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={gewicht}
          onChange={e => setGewicht(e.target.value)}
          placeholder="bijv. 82.5"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vetpercentage (%)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={vetPercentage}
          onChange={e => setVetPercentage(e.target.value)}
          placeholder="bijv. 18.5"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Buikomvang (cm)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          value={buikomvang}
          onChange={e => setBuikomvang(e.target.value)}
          placeholder="bijv. 92"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
        />
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
  )
}
