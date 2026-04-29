import { useState } from 'react'
import MetingFormulier from './formulieren/MetingFormulier'
import SportFormulier from './formulieren/SportFormulier'
import LezenVoortgangFormulier from './formulieren/LezenVoortgangFormulier'
import LezenNieuwBoekFormulier from './formulieren/LezenNieuwBoekFormulier'
import LezenReviewFormulier from './formulieren/LezenReviewFormulier'

export default function TaakModal({ taak, type, onSluit, onVoltooid, onOvergeslagen }) {
  const [reden, setReden] = useState('')
  const [fout, setFout] = useState('')

  function bevestigenOverslaan() {
    if (!reden.trim()) {
      setFout('Vul een reden in om deze taak over te slaan.')
      return
    }
    onOvergeslagen(reden.trim())
  }

  const formulier = {
    meting: <MetingFormulier taak={taak} onVoltooid={onVoltooid} />,
    sport: <SportFormulier taak={taak} onVoltooid={onVoltooid} />,
    'lezen-voortgang': <LezenVoortgangFormulier taak={taak} onVoltooid={onVoltooid} />,
    'lezen-nieuwboek': <LezenNieuwBoekFormulier taak={taak} onVoltooid={onVoltooid} />,
    'lezen-review': <LezenReviewFormulier taak={taak} onVoltooid={onVoltooid} />,
  }[taak.type]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl w-full max-w-[430px] overflow-y-auto" style={{ maxHeight: '85dvh' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">{taak.titel}</h2>
          <button onClick={onSluit} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="px-5 py-4 pb-10">
          {type === 'overslaan' ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">Waarom sla je deze taak over?</p>
              <textarea
                value={reden}
                onChange={e => { setReden(e.target.value); setFout('') }}
                placeholder="Geef een reden..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-green-500"
                rows={3}
              />
              {fout && <p className="text-red-500 text-xs">{fout}</p>}
              <button
                onClick={bevestigenOverslaan}
                className="w-full bg-orange-400 text-white font-medium py-3 rounded-xl"
              >
                Taak overslaan
              </button>
            </div>
          ) : (
            formulier || (
              <p className="text-gray-500 text-sm">Geen formulier beschikbaar voor dit taaktype.</p>
            )
          )}
        </div>
      </div>
    </div>
  )
}
