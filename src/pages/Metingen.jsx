import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, removeItem } from '../store/db'
import { X, Check } from '../components/Iconen'
import {
  getMetingenPlanning,
  saveMetingenPlanning,
  herstartMetingTaakVoorVandaag,
} from '../store/metingenPlanning'

const FREQUENTIES = [
  { id: 'wekelijks', label: 'Wekelijks' },
  { id: 'maandelijks', label: 'Maandelijks' },
]

const WEEKDAGEN = [
  { dag: 1, label: 'Ma' },
  { dag: 2, label: 'Di' },
  { dag: 3, label: 'Wo' },
  { dag: 4, label: 'Do' },
  { dag: 5, label: 'Vr' },
  { dag: 6, label: 'Za' },
  { dag: 0, label: 'Zo' },
]

function formatDatum(datumStr) {
  if (!datumStr) return ''
  const d = new Date(datumStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

export default function Metingen() {
  const navigate = useNavigate()
  const [metingen, setMetingen] = useState([])
  const [planning, setPlanning] = useState(null)
  const [opgeslagen, setOpgeslagen] = useState(false)

  const laad = useCallback(async () => {
    const [alle, p] = await Promise.all([
      getAll('metingen'),
      getMetingenPlanning(),
    ])
    setMetingen(alle.sort((a, b) => b.datum.localeCompare(a.datum)))
    setPlanning(p)
  }, [])

  useEffect(() => { laad() }, [laad])

  async function verwijder(id) {
    if (!confirm('Weet je zeker dat je deze meting wilt verwijderen?')) return
    await removeItem('metingen', id)
    laad()
  }

  function toggleDag(d) {
    const nieuw = new Set(planning.dagen)
    if (nieuw.has(d)) nieuw.delete(d); else nieuw.add(d)
    setPlanning({ ...planning, dagen: [...nieuw].sort() })
  }

  async function bewaarPlanning() {
    await saveMetingenPlanning(planning)
    await herstartMetingTaakVoorVandaag()
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 1500)
  }

  if (!planning) return null

  const minstensEenDag = planning.frequentie !== 'wekelijks' || planning.dagen.length > 0

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-accent-fg text-2xl font-bold flex items-center gap-2">
            Metingen
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/>
              <path d="m14.5 12.5 2-2"/>
              <path d="m11.5 9.5 2-2"/>
              <path d="m8.5 6.5 2-2"/>
              <path d="m17.5 15.5 2-2"/>
            </svg>
          </h1>
          <p className="text-accent-fg-soft text-sm mt-1">Metingen bijhouden en plannen</p>
        </div>
        <button
          onClick={() => navigate('/fysiek')}
          className="bg-accent-overlay text-accent-fg text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Sectie 1: Nieuwe meting */}
        <button
          onClick={() => navigate('/meting-toevoegen')}
          className="w-full bg-accent-500 text-accent-fg font-semibold py-3 rounded-xl text-sm"
        >
          + Nieuwe meting
        </button>

        {/* Sectie 2: Planning */}
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-3">Planning</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Automatisch inplannen</p>
                <p className="text-xs text-gray-500 mt-0.5">Verschijnt als activiteit op de hoofdpagina</p>
              </div>
              <button
                type="button"
                onClick={() => setPlanning({ ...planning, actief: !planning.actief })}
                role="switch"
                aria-checked={planning.actief}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${planning.actief ? 'bg-accent-500' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${planning.actief ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {planning.actief && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Frequentie</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FREQUENTIES.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setPlanning({ ...planning, frequentie: f.id })}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                          planning.frequentie === f.id
                            ? 'bg-accent-500 text-accent-fg border-accent-500'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {planning.frequentie === 'wekelijks' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Op welke dagen</label>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKDAGEN.map(w => {
                        const aan = planning.dagen.includes(w.dag)
                        return (
                          <button
                            key={w.dag}
                            type="button"
                            onClick={() => toggleDag(w.dag)}
                            className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                              aan
                                ? 'bg-accent-500 text-accent-fg border-accent-500'
                                : 'bg-white text-gray-500 border-gray-200'
                            }`}
                          >
                            {w.label}
                          </button>
                        )
                      })}
                    </div>
                    {planning.dagen.length > 1 && (
                      <p className="text-[11px] text-gray-400 mt-2">
                        Meer dagen = meer datapunten, maar ook meer ruis door dagelijkse schommelingen.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Welke dag van de maand</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={planning.dagInMaand}
                      onChange={e => setPlanning({
                        ...planning,
                        dagInMaand: Math.max(1, Math.min(31, parseInt(e.target.value) || 1))
                      })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-500"
                    />
                    {planning.dagInMaand > 28 && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        In maanden zonder dag {planning.dagInMaand} valt de meting op de laatste dag van die maand.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <button
              onClick={bewaarPlanning}
              disabled={!minstensEenDag}
              className="w-full bg-accent-500 text-accent-fg font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={16} strokeWidth={2.5} />
              {opgeslagen ? 'Opgeslagen' : 'Planning opslaan'}
            </button>
          </div>
        </section>

        {/* Sectie 3: Historie */}
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-3">Historie</h2>
          {metingen.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
              <p className="text-gray-400 text-sm">Nog geen metingen.</p>
              <p className="text-gray-300 text-xs mt-1">Voeg een eerste meting toe om te beginnen.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
              {metingen.map(m => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatDatum(m.datum)}
                      {m.beginstand && <span className="ml-2 text-[10px] bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full">begin</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[
                        m.gewicht != null && `${m.gewicht} kg`,
                        m.vetPercentage != null && `${m.vetPercentage}%`,
                        m.buikomvang != null && `${m.buikomvang} cm`,
                        m.bmi != null && `BMI ${m.bmi}`,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/meting-bewerken/${encodeURIComponent(m.id)}`)}
                      className="text-gray-500 text-xs px-3 py-1.5 rounded-lg border border-gray-200"
                    >
                      Bewerk
                    </button>
                    <button
                      onClick={() => verwijder(m.id)}
                      aria-label="Verwijder meting"
                      className="text-red-400 p-1.5 rounded-lg border border-red-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
