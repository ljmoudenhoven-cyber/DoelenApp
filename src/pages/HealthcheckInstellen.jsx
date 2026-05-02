import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHealthcheckConfig, saveHealthcheckConfig, THEMAS } from '../store/healthcheck'
import { genereerWekelijkseTaken } from '../store/taken'
import { ClipboardCheck } from '../components/Iconen'

const FREQUENTIES = [
  { id: 'dagelijks', label: 'Dagelijks' },
  { id: 'wekelijks', label: 'Wekelijks' },
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

export default function HealthcheckInstellen() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [opgeslagen, setOpgeslagen] = useState(false)

  useEffect(() => {
    getHealthcheckConfig().then(setConfig)
  }, [])

  if (!config) return null

  function toggleDag(d) {
    const nieuw = new Set(config.dagen)
    if (nieuw.has(d)) nieuw.delete(d); else nieuw.add(d)
    setConfig({ ...config, dagen: [...nieuw].sort() })
  }

  function toggleThema(id) {
    setConfig({ ...config, themas: { ...config.themas, [id]: !config.themas[id] } })
  }

  async function opslaan() {
    await saveHealthcheckConfig(config)
    if (config.actief) await genereerWekelijkseTaken()
    setOpgeslagen(true)
    setTimeout(() => navigate('/'), 600)
  }

  const ietsAan = Object.values(config.themas).some(Boolean)

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-accent-fg text-2xl font-bold flex items-center gap-2">
            Dagelijkse check-in
            <ClipboardCheck size={22} strokeWidth={2.5} />
          </h1>
          <p className="text-accent-fg-soft text-sm mt-1">Bewust nadenken over je dag</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-accent-overlay text-accent-fg text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Check-in inschakelen</p>
              <p className="text-xs text-gray-500 mt-0.5">Verschijnt als activiteit op de hoofdpagina</p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, actief: !config.actief })}
              role="switch"
              aria-checked={config.actief}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.actief ? 'bg-accent-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.actief ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {config.actief && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Frequentie</label>
                <div className="grid grid-cols-2 gap-2">
                  {FREQUENTIES.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setConfig({ ...config, frequentie: f.id })}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        config.frequentie === f.id
                          ? 'bg-accent-500 text-accent-fg border-accent-500'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {config.frequentie === 'wekelijks' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Op welke dagen</label>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAGEN.map(w => {
                      const aan = config.dagen.includes(w.dag)
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
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-800">Vraag-thema's</p>
                <p className="text-xs text-gray-500 mt-0.5">Welke onderwerpen wil je bijhouden?</p>
              </div>
              <div className="divide-y divide-gray-100">
                {THEMAS.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm text-gray-800">{t.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.uitleg}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleThema(t.id)}
                      role="switch"
                      aria-checked={config.themas[t.id]}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.themas[t.id] ? 'bg-accent-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.themas[t.id] ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>
              {!ietsAan && (
                <p className="text-xs text-orange-500 mt-3">Zet minimaal één thema aan, anders heeft de check-in geen vragen.</p>
              )}
            </div>
          </>
        )}

        <button
          onClick={opslaan}
          disabled={config.actief && !ietsAan}
          className="w-full bg-accent-500 text-accent-fg font-semibold py-3 rounded-xl text-sm disabled:opacity-50"
        >
          {opgeslagen ? 'Opgeslagen' : 'Opslaan'}
        </button>
      </div>
    </div>
  )
}
