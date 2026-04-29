import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, removeItem } from '../store/db'

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
      <div className="bg-green-500 px-5 pt-14 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Metingen 📏</h1>
          <p className="text-green-100 text-sm mt-1">Alle bijgehouden metingen</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/instellingen')}
            className="bg-white text-green-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            title="Basisgegevens aanpassen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={() => navigate('/tussendoelen')}
            className="bg-white text-green-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            title="Tussendoelen beheren"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </button>
          <button
            onClick={() => navigate('/fysiek')}
            className="bg-white text-green-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            title="Terug naar Fysiek"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        <button
          onClick={() => navigate('/meting-toevoegen')}
          className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl text-sm"
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
                    {m.beginstand && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">begin</span>}
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
                    className="text-red-400 text-xs px-3 py-1.5 rounded-lg border border-red-100"
                  >
                    ✕
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
