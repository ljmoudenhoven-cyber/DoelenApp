import { useState, useEffect } from 'react'
import { getAll, getSetting } from '../store/db'
import { Star, ChevronDown, ChevronUp } from '../components/Iconen'

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function maandNaam(maandKey) {
  if (!maandKey) return ''
  const [jaar, maand] = maandKey.split('-')
  return `${MAANDEN[parseInt(maand) - 1]} ${jaar}`
}

function resteRendeDagen() {
  const nu = new Date()
  const eindeMaand = new Date(nu.getFullYear(), nu.getMonth() + 1, 0)
  return eindeMaand.getDate() - nu.getDate()
}

export default function Lezen() {
  const [huidigBoek, setHuidigBoek] = useState(null)
  const [boeken, setBoeken] = useState([])

  useEffect(() => {
    async function laad() {
      const [boek, alle] = await Promise.all([
        getSetting('huidigBoek'),
        getAll('lezen'),
      ])
      setHuidigBoek(boek)
      // Alleen afgeronde boeken in bibliotheek
      const afgerond = alle.filter(b => b.afgerond && b.titel).sort((a, b) => b.maand?.localeCompare(a.maand || '') || 0)
      setBoeken(afgerond)
    }
    laad()
  }, [])

  const procent = huidigBoek && huidigBoek.totaalPaginas
    ? Math.min(100, Math.round((huidigBoek.huidigePagina / huidigBoek.totaalPaginas) * 100))
    : 0

  return (
    <div className="flex flex-col">
      <div className="bg-green-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6">
        <h1 className="text-white text-2xl font-bold">Lezen</h1>
        <p className="text-green-100 text-sm mt-1">Elke maand een boek</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Huidig boek */}
        {huidigBoek ? (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Nu aan het lezen</p>
                <h2 className="font-semibold text-gray-800 text-base mt-0.5">{huidigBoek.titel}</h2>
              </div>
              <div className="text-right ml-3">
                <p className="text-2xl font-bold text-green-600">{procent}%</p>
                <p className="text-gray-400 text-xs">gelezen</p>
              </div>
            </div>

            {/* Voortgangsbalk */}
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${procent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Pagina {huidigBoek.huidigePagina} / {huidigBoek.totaalPaginas}</span>
              <span>{resteRendeDagen()} dagen resterend</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-500 text-sm">Geen actief boek.</p>
            <p className="text-gray-400 text-xs mt-1">Voeg een boek toe via de taak op de 1e van de maand.</p>
          </div>
        )}

        {/* Bibliotheek */}
        <div>
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Bibliotheek</h2>
          {boeken.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm">Nog geen gelezen boeken.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {boeken.map(boek => (
                <BoekKaart key={boek.id} boek={boek} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BoekKaart({ boek }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="text-left">
          <p className="font-medium text-gray-800 text-sm">{boek.titel}</p>
          <p className="text-gray-400 text-xs">{maandNaam(boek.maand)}</p>
        </div>
        <div className="flex items-center gap-2">
          {boek.review?.beoordeling > 0 && (
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: boek.review.beoordeling }).map((_, i) => (
                <Star key={i} size={14} filled />
              ))}
            </div>
          )}
          <span className="text-gray-400">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {open && boek.review && (
        <div className="px-4 pb-4 border-t border-gray-100 space-y-2">
          <p className="text-gray-600 text-sm mt-3">{boek.review.mening}</p>
          {boek.review.geleerd && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-700 text-xs font-medium mb-1">Wat heb ik geleerd:</p>
              <p className="text-green-700 text-sm">{boek.review.geleerd}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
