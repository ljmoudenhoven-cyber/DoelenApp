import { useState } from 'react'
import BottomModal from './BottomModal'
import MetingFormulier from './formulieren/MetingFormulier'
import SportFormulier from './formulieren/SportFormulier'
import LezenVoortgangFormulier from './formulieren/LezenVoortgangFormulier'
import LezenNieuwBoekFormulier from './formulieren/LezenNieuwBoekFormulier'
import LezenReviewFormulier from './formulieren/LezenReviewFormulier'
import { taakAfvinken } from '../store/taken'
import { Check } from './Iconen'

const HANDMATIGE_TYPES = ['persoonlijk', 'gezondheid', 'mentaal']

function HandmatigFormulier({ taak, onVoltooid }) {
  const [bezig, setBezig] = useState(false)

  async function voltooi() {
    setBezig(true)
    await taakAfvinken(taak.id)
    onVoltooid()
  }

  return (
    <div className="space-y-4">
      {taak.beschrijving && (
        <p className="text-gray-600 text-sm whitespace-pre-line">{taak.beschrijving}</p>
      )}
      <button
        onClick={voltooi}
        disabled={bezig}
        className="w-full bg-green-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Check size={18} strokeWidth={2.5} />
        {bezig ? 'Opslaan...' : 'Markeer als voltooid'}
      </button>
    </div>
  )
}

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

  const formulier = HANDMATIGE_TYPES.includes(taak.type)
    ? <HandmatigFormulier taak={taak} onVoltooid={onVoltooid} />
    : {
        meting: <MetingFormulier taak={taak} onVoltooid={onVoltooid} />,
        sport: <SportFormulier taak={taak} onVoltooid={onVoltooid} />,
        'lezen-voortgang': <LezenVoortgangFormulier taak={taak} onVoltooid={onVoltooid} />,
        'lezen-nieuwboek': <LezenNieuwBoekFormulier taak={taak} onVoltooid={onVoltooid} />,
        'lezen-review': <LezenReviewFormulier taak={taak} onVoltooid={onVoltooid} />,
      }[taak.type]

  return (
    <BottomModal titel={taak.titel} onSluit={onSluit}>
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
    </BottomModal>
  )
}
