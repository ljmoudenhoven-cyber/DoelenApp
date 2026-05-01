import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, removeItem } from '../store/db'
import { X } from '../components/Iconen'

function formatDatum(datumStr) {
  if (!datumStr) return ''
  const d = new Date(datumStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

export default function Metingen() {
  const navigate = useNavigate()
  const [metingen, setMetingen] = useState([])

  const laad = useCallback(async () => {
    const alle = await getAll('metingen')
    setMetingen(alle.sort((a, b) => b.datum.localeCompare(a.datum)))
  }, [])

  useEffect(() => { laad() }, [laad])

  async function verwijder(id) {
    if (!confirm('Weet je zeker dat je deze meting wilt verwijderen?')) return
    await removeItem('metingen', id)
    laad()
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            Metingen
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/>
              <path d="m14.5 12.5 2-2"/>
              <path d="m11.5 9.5 2-2"/>
              <path d="m8.5 6.5 2-2"/>
              <path d="m17.5 15.5 2-2"/>
            </svg>
          </h1>
          <p className="text-accent-100 text-sm mt-1">Alle bijgehouden metingen</p>
        </div>
        <button
          onClick={() => navigate('/fysiek')}
          className="bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5 space-y-4">
        <button
          onClick={() => navigate('/meting-toevoegen')}
          className="w-full bg-accent-500 text-white font-semibold py-3 rounded-xl text-sm"
        >
          + Meting toevoegen
        </button>

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
      </div>
    </div>
  )
}
