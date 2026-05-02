import { useState } from 'react'
import { getSetting, setItem } from '../../store/db'
import { taakAfvinken, formatDateKey } from '../../store/taken'

function berekenBMI(gewicht, lengte) {
  if (!gewicht || !lengte) return null
  const l = lengte / 100
  return Math.round((gewicht / (l * l)) * 10) / 10
}

// Werkt voor: taak (taak prop), nieuw handmatig (manueel=true), of bewerken (bestaand prop)
export default function MetingFormulier({ taak = null, manueel = false, bestaand = null, onVoltooid }) {
  const vandaag = formatDateKey(new Date())
  const [datum, setDatum] = useState(bestaand?.datum || taak?.datum || vandaag)
  const [gewicht, setGewicht] = useState(bestaand?.gewicht != null ? String(bestaand.gewicht) : '')
  const [vetPercentage, setVetPercentage] = useState(bestaand?.vetPercentage != null ? String(bestaand.vetPercentage) : '')
  const [buikomvang, setBuikomvang] = useState(bestaand?.buikomvang != null ? String(bestaand.buikomvang) : '')
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

    const id = bestaand?.id || `meting-${datum}-${manueel ? Date.now() : 'taak'}`
    const meting = {
      id,
      datum,
      gewicht: parseFloat(gewicht),
      vetPercentage: parseFloat(vetPercentage),
      buikomvang: parseFloat(buikomvang),
      bmi,
      manueel: bestaand?.manueel ?? manueel,
      ingevoerdOp: bestaand?.ingevoerdOp || new Date().toISOString(),
      bewerktOp: bestaand ? new Date().toISOString() : undefined,
    }

    await setItem('metingen', id, meting)
    if (taak) await taakAfvinken(taak.id)
    onVoltooid()
  }

  const toonDatum = manueel || bestaand

  return (
    <div className="space-y-4">
      {toonDatum && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
          <input
            type="date"
            value={datum}
            max={vandaag}
            onChange={e => setDatum(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gewicht (kg)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={gewicht}
          onChange={e => setGewicht(e.target.value)}
          placeholder="bijv. 82.5"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
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
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
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
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
        />
      </div>

      {fout && <p className="text-red-500 text-xs">{fout}</p>}

      <button
        onClick={opslaan}
        disabled={bezig}
        className="w-full bg-accent-500 text-accent-fg font-medium py-3 rounded-xl disabled:opacity-50"
      >
        {bezig ? 'Opslaan...' : 'Opslaan'}
      </button>
    </div>
  )
}
