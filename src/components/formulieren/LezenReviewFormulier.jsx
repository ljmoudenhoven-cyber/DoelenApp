import { useState, useEffect } from 'react'
import { getSetting, setItem, getItem } from '../../store/db'
import { taakAfvinken } from '../../store/taken'
import { Star } from '../Iconen'

export default function LezenReviewFormulier({ taak, onVoltooid }) {
  const [boek, setBoek] = useState(null)
  const [mening, setMening] = useState('')
  const [geleerd, setGeleerd] = useState('')
  const [beoordeling, setBeoordeling] = useState(0)
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    getSetting('huidigBoek').then(b => { if (b) setBoek(b) })
  }, [])

  async function opslaan() {
    if (!mening.trim()) { setFout('Vul je mening in.'); return }
    setBezig(true)

    if (boek) {
      const bijgewerkt = {
        ...boek,
        review: { mening: mening.trim(), geleerd: geleerd.trim(), beoordeling, datum: taak.datum },
        afgerond: taak.datum,
      }
      await setItem('lezen', boek.id, bijgewerkt)
      await setItem('settings', 'vorigeBoek', bijgewerkt)
      await setItem('settings', 'huidigBoek', null)
    }

    await taakAfvinken(taak.id)
    onVoltooid()
  }

  return (
    <div className="space-y-4">
      {boek && (
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-purple-800 font-medium text-sm">{boek.titel}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Beoordeling</label>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(ster => (
            <button
              key={ster}
              onClick={() => setBeoordeling(ster)}
              aria-label={`${ster} ${ster === 1 ? 'ster' : 'sterren'}`}
              className={ster <= beoordeling ? 'text-amber-400' : 'text-gray-200'}
            >
              <Star size={32} filled={ster <= beoordeling} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Wat vond je ervan?</label>
        <textarea
          value={mening}
          onChange={e => setMening(e.target.value)}
          placeholder="Schrijf je mening over het boek..."
          className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-green-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Wat heb je geleerd? <span className="text-gray-400 font-normal">— optioneel</span></label>
        <textarea
          value={geleerd}
          onChange={e => setGeleerd(e.target.value)}
          placeholder="Wat neem je mee uit dit boek?"
          className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-green-500"
          rows={3}
        />
      </div>

      {fout && <p className="text-red-500 text-xs">{fout}</p>}

      <button
        onClick={opslaan}
        disabled={bezig}
        className="w-full bg-green-500 text-white font-medium py-3 rounded-xl disabled:opacity-50"
      >
        {bezig ? 'Opslaan...' : 'Review opslaan'}
      </button>
    </div>
  )
}
