import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { maakHandmatigeTaak } from '../store/taken'
import { User, Apple, Brain } from '../components/Iconen'

const TYPES = [
  { id: 'persoonlijk', label: 'Persoonlijk', Icon: User, kleur: 'zinc' },
  { id: 'gezondheid', label: 'Gezondheid', Icon: Apple, kleur: 'red' },
  { id: 'mentaal', label: 'Mentaal', Icon: Brain, kleur: 'sky' },
]

const ACTIEF_KLEUREN = {
  zinc: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  red: 'bg-red-50 text-red-700 border-red-300',
  sky: 'bg-sky-50 text-sky-700 border-sky-300',
}

export default function ActiviteitPlannen() {
  const navigate = useNavigate()
  const vandaag = new Date().toISOString().split('T')[0]

  const [type, setType] = useState('persoonlijk')
  const [titel, setTitel] = useState('')
  const [datum, setDatum] = useState(vandaag)
  const [beschrijving, setBeschrijving] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  async function opslaan() {
    if (!titel.trim()) { setFout('Geef de activiteit een titel.'); return }
    if (!datum) { setFout('Kies een datum.'); return }
    setBezig(true)
    await maakHandmatigeTaak({
      type,
      titel: titel.trim(),
      datum,
      beschrijving: beschrijving.trim(),
    })
    navigate('/')
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-accent-fg text-2xl font-bold">Activiteit plannen</h1>
          <p className="text-accent-fg-soft text-sm mt-1">Voeg een eigen activiteit toe</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-accent-overlay text-accent-fg text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => {
                const Icon = t.Icon
                const actief = type === t.id
                const klasse = actief
                  ? ACTIEF_KLEUREN[t.kleur]
                  : 'bg-white text-gray-500 border-gray-200'
                return (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`border rounded-xl py-3 px-2 flex flex-col items-center gap-1 transition-colors ${klasse}`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              type="text"
              value={titel}
              onChange={e => { setTitel(e.target.value); setFout('') }}
              placeholder="bijv. Mediteren 10 minuten"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input
              type="date"
              value={datum}
              onChange={e => setDatum(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschrijving <span className="text-gray-400 font-normal">— optioneel</span>
            </label>
            <textarea
              value={beschrijving}
              onChange={e => setBeschrijving(e.target.value)}
              placeholder="Korte toelichting of notitie"
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-accent-500"
            />
          </div>

          {fout && <p className="text-red-500 text-xs">{fout}</p>}

          <button
            onClick={opslaan}
            disabled={bezig}
            className="w-full bg-accent-500 text-accent-fg font-semibold py-3 rounded-xl text-sm disabled:opacity-50"
          >
            {bezig ? 'Opslaan...' : 'Activiteit plannen'}
          </button>
        </div>
      </div>
    </div>
  )
}
