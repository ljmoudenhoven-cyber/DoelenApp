import { useState, useEffect, useCallback } from 'react'
import { getSetting, setItem } from '../store/db'
import { useNavigate } from 'react-router-dom'

function formatDatum(datumStr) {
  if (!datumStr) return ''
  const d = new Date(datumStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

export default function Tussendoelen() {
  const navigate = useNavigate()
  const [tussendoelen, setTussendoelen] = useState([])

  const laad = useCallback(async () => {
    const td = await getSetting('tussendoelen')
    setTussendoelen(td || [])
  }, [])

  useEffect(() => { laad() }, [laad])

  async function verwijder(id) {
    if (!confirm('Weet je zeker dat je dit tussendoel wilt verwijderen?')) return
    const bestaand = await getSetting('tussendoelen') || []
    const nieuw = bestaand.filter(t => t.id !== id)
    await setItem('settings', 'tussendoelen', nieuw)
    setTussendoelen(nieuw)
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-green-500 px-5 pt-14 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Tussendoelen 🎯</h1>
          <p className="text-green-100 text-sm mt-1">Mijlpalen op weg naar je einddoel</p>
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
            onClick={() => navigate('/metingen')}
            className="bg-white text-green-600 font-bold text-xl w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            title="Metingen beheren"
          >
            +
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
        <p className="text-gray-500 text-sm">
          Tussendoelen verschijnen als punten op de doellijn in de grafieken. Zo zie je hoe je koers loopt richting je einddoel.
        </p>

        <button
          onClick={() => navigate('/tussendoel-toevoegen')}
          className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl text-sm"
        >
          + Tussendoel toevoegen
        </button>

        {tussendoelen.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-gray-400 text-sm">Nog geen tussendoelen.</p>
            <p className="text-gray-300 text-xs mt-1">Voeg een eerste tussendoel toe om je traject in te stellen.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
            {tussendoelen.map(td => (
              <div key={td.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{formatDatum(td.datum)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[
                      td.gewicht != null && `${td.gewicht} kg`,
                      td.vetPercentage != null && `${td.vetPercentage}%`,
                      td.buikomvang != null && `${td.buikomvang} cm`,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/tussendoel-bewerken/${encodeURIComponent(td.id)}`)}
                    className="text-gray-500 text-xs px-3 py-1.5 rounded-lg border border-gray-200"
                  >
                    Bewerk
                  </button>
                  <button
                    onClick={() => verwijder(td.id)}
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
