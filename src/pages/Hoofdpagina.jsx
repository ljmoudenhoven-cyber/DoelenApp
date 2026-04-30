import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTakenVoorVandaag, getTeLaatTaken, taakAfvinken, taakOverslaan } from '../store/taken'
import { getSetting } from '../store/db'
import TaakModal from '../components/TaakModal'

const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

function datumTekst() {
  const nu = new Date()
  return `${DAGEN[nu.getDay()]} ${nu.getDate()} ${MAANDEN[nu.getMonth()]} ${nu.getFullYear()}`
}

function groetTekst() {
  const uur = new Date().getHours()
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

export default function Hoofdpagina() {
  const navigate = useNavigate()
  const [taken, setTaken] = useState([])
  const [teLaat, setTeLaat] = useState([])
  const [activeTaak, setActiveTaak] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [naam, setNaam] = useState('')

  const laadTaken = useCallback(async () => {
    const [vandaag, verlopen] = await Promise.all([getTakenVoorVandaag(), getTeLaatTaken()])
    setTaken(vandaag)
    setTeLaat(verlopen)
  }, [])

  useEffect(() => {
    laadTaken()
    getSetting('naam').then(n => { if (n) setNaam(n) })
  }, [laadTaken])

  async function afvinken(taakId) {
    await taakAfvinken(taakId)
    laadTaken()
  }

  function openTaak(taak) {
    setActiveTaak(taak)
    setModalType('invullen')
  }

  function openOverslaan(taak) {
    setActiveTaak(taak)
    setModalType('overslaan')
  }

  async function opslaanEnSluiten() {
    setActiveTaak(null)
    setModalType(null)
    await laadTaken()
  }

  async function overslaanBevestigen(reden) {
    await taakOverslaan(activeTaak.id, reden)
    setActiveTaak(null)
    setModalType(null)
    laadTaken()
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-green-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <p className="text-green-100 text-sm capitalize">{datumTekst()}</p>
          <h1 className="text-white text-2xl font-bold mt-1">
            {groetTekst()}{naam ? `, ${naam}` : ''}
          </h1>
        </div>
        <button
          onClick={() => navigate('/instellingen')}
          className="bg-white text-green-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
          title="Instellingen"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 px-4 py-5 space-y-6">
        {/* Taken vandaag */}
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-3">Taken van vandaag</h2>
          {taken.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-medium">Alle taken gedaan! 🎉</p>
              <p className="text-green-600 text-sm mt-1">Geen openstaande taken voor vandaag.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {taken.map(taak => (
                <TaakKaart
                  key={taak.id}
                  taak={taak}
                  onOpen={() => openTaak(taak)}
                  onOverslaan={() => openOverslaan(taak)}
                  onAfvinken={() => afvinken(taak.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Te late taken */}
        {teLaat.length > 0 && (
          <section>
            <h2 className="text-gray-800 font-semibold text-base mb-3">Te laat</h2>
            <div className="space-y-2">
              {teLaat.map(taak => (
                <TeLaatKaart
                  key={taak.id}
                  taak={taak}
                  onOpen={() => openTaak(taak)}
                  onOverslaan={() => openOverslaan(taak)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Taak modal */}
      {activeTaak && (
        <TaakModal
          taak={activeTaak}
          type={modalType}
          onSluit={() => { setActiveTaak(null); setModalType(null) }}
          onVoltooid={opslaanEnSluiten}
          onOvergeslagen={overslaanBevestigen}
        />
      )}
    </div>
  )
}

function TaakKaart({ taak, onOpen, onOverslaan, onAfvinken }) {
  const icoon = {
    meting: '⚖️',
    sport: '🏃',
    'lezen-voortgang': '📖',
    'lezen-nieuwboek': '📚',
    'lezen-review': '✍️',
  }[taak.type] || '✅'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <span className="text-2xl">{icoon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm leading-tight">{taak.titel}</p>
        <p className="text-gray-500 text-xs mt-0.5 truncate">{taak.beschrijving}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onOpen}
          className="bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
        >
          Invullen
        </button>
        <button
          onClick={onOverslaan}
          className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1.5 rounded-lg"
        >
          Skip
        </button>
      </div>
    </div>
  )
}

function TeLaatKaart({ taak, onOpen, onOverslaan }) {
  const kleur = taak.dagenTeLaat > 7
    ? 'border-red-300 bg-red-50'
    : 'border-orange-300 bg-orange-50'
  const tekstKleur = taak.dagenTeLaat > 7 ? 'text-red-700' : 'text-orange-700'
  const badgeKleur = taak.dagenTeLaat > 7 ? 'bg-red-500' : 'bg-orange-400'

  return (
    <div className={`border rounded-xl p-4 flex items-center gap-3 ${kleur}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-medium text-sm ${tekstKleur}`}>{taak.titel}</p>
          <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeKleur}`}>
            {taak.dagenTeLaat}d
          </span>
        </div>
        <p className={`text-xs mt-0.5 ${tekstKleur} opacity-75`}>
          {taak.dagenTeLaat === 1 ? '1 dag te laat' : `${taak.dagenTeLaat} dagen te laat`}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={onOpen} className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200">
          Invullen
        </button>
        <button onClick={onOverslaan} className="bg-white text-gray-500 text-xs px-2 py-1.5 rounded-lg border border-gray-200">
          Skip
        </button>
      </div>
    </div>
  )
}
