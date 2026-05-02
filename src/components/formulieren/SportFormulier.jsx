import { useState } from 'react'
import { setItem, getAll } from '../../store/db'
import { taakAfvinken } from '../../store/taken'

export default function SportFormulier({ taak, onVoltooid }) {
  const [afstand, setAfstand] = useState('')
  const [minuten, setMinuten] = useState('')
  const [seconden, setSeconden] = useState('')
  const [hartslag, setHartslag] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  async function opslaan() {
    if (!afstand || !minuten) {
      setFout('Vul minimaal afstand en tijd in.')
      return
    }
    setBezig(true)

    const totaleSec = (parseInt(minuten) * 60) + (parseInt(seconden) || 0)
    const km = parseFloat(afstand)
    const tempo = km > 0 ? totaleSec / 60 / km : null // min/km

    const activiteit = {
      id: `sport-activiteit-${taak.datum}`,
      datum: taak.datum,
      afstand: km,
      tijdSec: totaleSec,
      tempo,
      hartslag: hartslag ? parseInt(hartslag) : null,
      ingevoerdOp: new Date().toISOString(),
    }

    await setItem('sport', activiteit.id, activiteit)

    // Update records
    await updateRecords(activiteit)
    await taakAfvinken(taak.id)
    onVoltooid()
  }

  async function updateRecords(activiteit) {
    const alleActiviteiten = await getAll('sport')
    const records = {}

    // Langste afstand
    const langste = alleActiviteiten.reduce((max, a) => a.afstand > max ? a.afstand : max, 0)
    records.langsteAfstand = langste

    // Langste duurloop (tijd)
    const langsteTijd = alleActiviteiten.reduce((max, a) => a.tijdSec > max ? a.tijdSec : max, 0)
    records.langsteDuurloop = langsteTijd

    // Snelste 1km (tempo < 20 min/km = realistische run)
    const heeftMinstens1km = alleActiviteiten.filter(a => a.afstand >= 1 && a.tempo && a.tempo < 20)
    if (heeftMinstens1km.length > 0) {
      records.snelste1km = Math.min(...heeftMinstens1km.map(a => a.tempo))
    }

    // Snelste 5km (activiteiten van minstens 5km)
    const heeftMinstens5km = alleActiviteiten.filter(a => a.afstand >= 5 && a.tempo && a.tempo < 20)
    if (heeftMinstens5km.length > 0) {
      records.snelste5km = Math.min(...heeftMinstens5km.map(a => a.tempo * a.afstand / 5))
    }

    await setItem('settings', 'sportRecords', records)
  }

  function tijdTekst() {
    const m = parseInt(minuten) || 0
    const s = parseInt(seconden) || 0
    const totaal = m * 60 + s
    if (!afstand || !totaal) return null
    const km = parseFloat(afstand)
    const tempoSec = totaal / km
    const tempoMin = Math.floor(tempoSec / 60)
    const tempoSecRest = Math.round(tempoSec % 60)
    return `Tempo: ${tempoMin}:${String(tempoSecRest).padStart(2, '0')} min/km`
  }

  return (
    <div className="space-y-4">
      <div className="bg-accent-50 rounded-xl p-3">
        <p className="text-accent-700 text-sm font-medium">{taak.beschrijving}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gelopen afstand (km)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={afstand}
          onChange={e => setAfstand(e.target.value)}
          placeholder="bijv. 5.2"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tijd</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              inputMode="numeric"
              value={minuten}
              onChange={e => setMinuten(e.target.value)}
              placeholder="min"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 text-center"
            />
            <p className="text-xs text-gray-400 text-center mt-1">minuten</p>
          </div>
          <div className="flex items-center text-gray-400 text-xl pb-5">:</div>
          <div className="flex-1">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="59"
              value={seconden}
              onChange={e => setSeconden(e.target.value)}
              placeholder="sec"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 text-center"
            />
            <p className="text-xs text-gray-400 text-center mt-1">seconden</p>
          </div>
        </div>
        {tijdTekst() && (
          <p className="text-accent-600 text-xs mt-1">{tijdTekst()}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gemiddelde hartslag (bpm) <span className="text-gray-400 font-normal">— optioneel</span></label>
        <input
          type="number"
          inputMode="numeric"
          value={hartslag}
          onChange={e => setHartslag(e.target.value)}
          placeholder="bijv. 155"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
        />
      </div>

      {fout && <p className="text-red-500 text-xs">{fout}</p>}

      <button
        onClick={opslaan}
        disabled={bezig}
        className="w-full bg-accent-500 text-accent-fg font-medium py-3 rounded-xl disabled:opacity-50"
      >
        {bezig ? 'Opslaan...' : 'Training opslaan'}
      </button>
    </div>
  )
}
