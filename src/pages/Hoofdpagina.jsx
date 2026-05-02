import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTakenVoorVandaag, getTeLaatTaken, getTakenKomende7Dagen, taakAfvinken, taakOverslaan, verwijderTaak, verwijderSerie } from '../store/taken'
import { getSetting } from '../store/db'
import TaakModal from '../components/TaakModal'
import { Scale, Footprints, Book, BookOpen, Pencil, Check, Cog, Plus, User, Apple, Brain, Repeat, ClipboardCheck } from '../components/Iconen'

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

function dagLabel(datumStr) {
  const taakDatum = new Date(datumStr + 'T00:00:00')
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  const verschil = Math.round((taakDatum - vandaag) / (1000 * 60 * 60 * 24))
  if (verschil === 1) return 'Morgen'
  if (verschil <= 6) return DAGEN[taakDatum.getDay()].charAt(0).toUpperCase() + DAGEN[taakDatum.getDay()].slice(1)
  return `${taakDatum.getDate()}/${taakDatum.getMonth() + 1}`
}

const TAAK_STIJL = {
  meting: { bg: 'bg-blue-50', tekst: 'text-blue-600', Icon: Scale },
  healthcheck: { bg: 'bg-teal-50', tekst: 'text-teal-600', Icon: ClipboardCheck },
  sport: { bg: 'bg-orange-50', tekst: 'text-orange-600', Icon: Footprints },
  'lezen-voortgang': { bg: 'bg-indigo-50', tekst: 'text-indigo-600', Icon: BookOpen },
  'lezen-nieuwboek': { bg: 'bg-indigo-50', tekst: 'text-indigo-600', Icon: Book },
  'lezen-review': { bg: 'bg-purple-50', tekst: 'text-purple-600', Icon: Pencil },
  persoonlijk: { bg: 'bg-zinc-100', tekst: 'text-zinc-600', Icon: User },
  gezondheid: { bg: 'bg-red-50', tekst: 'text-red-600', Icon: Apple },
  mentaal: { bg: 'bg-sky-50', tekst: 'text-sky-600', Icon: Brain },
}

export default function Hoofdpagina() {
  const navigate = useNavigate()
  const [taken, setTaken] = useState([])
  const [teLaat, setTeLaat] = useState([])
  const [komend, setKomend] = useState([])
  const [activeTaak, setActiveTaak] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [naam, setNaam] = useState('')

  const laadTaken = useCallback(async () => {
    const [vandaag, verlopen, komende] = await Promise.all([
      getTakenVoorVandaag(),
      getTeLaatTaken(),
      getTakenKomende7Dagen(),
    ])
    setTaken(vandaag)
    setTeLaat(verlopen)
    setKomend(komende)
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

  async function verwijderBevestigen(scope) {
    if (scope === 'hele-serie' && activeTaak.serieId) {
      await verwijderSerie(activeTaak.serieId)
    } else {
      await verwijderTaak(activeTaak.id)
    }
    setActiveTaak(null)
    setModalType(null)
    laadTaken()
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-accent-fg text-2xl font-bold">
            {groetTekst()}{naam ? `, ${naam}` : ''}
          </h1>
          <p className="text-accent-fg-soft text-sm capitalize mt-1">{datumTekst()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/mijn-checkins')}
            className="bg-white text-accent-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            title="Mijn check-ins"
            aria-label="Mijn check-ins"
          >
            <ClipboardCheck size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate('/instellingen')}
            className="bg-white text-accent-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            title="Instellingen"
            aria-label="Instellingen"
          >
            <Cog size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-6">
        {/* Plan-knop */}
        <button
          onClick={() => navigate('/activiteit-plannen')}
          className="w-full bg-accent-500 text-accent-fg font-semibold py-4 rounded-xl text-base shadow-sm flex items-center justify-center gap-2"
        >
          <Plus size={20} strokeWidth={2.5} />
          Activiteit plannen
        </button>

        {/* Te late taken (alleen als > 0) */}
        {teLaat.length > 0 && (
          <section>
            <h2 className="text-gray-800 font-semibold text-base mb-3">Te laat ({teLaat.length})</h2>
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

        {/* Taken vandaag */}
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-3">Vandaag{taken.length > 0 ? ` (${taken.length})` : ''}</h2>
          {taken.length === 0 ? (
            <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 text-center">
              <p className="text-accent-700 font-medium">Niets voor vandaag</p>
              <p className="text-accent-600 text-sm mt-1">Geen openstaande taken — geniet ervan.</p>
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

        {/* Komende 7 dagen */}
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-3">Komende 7 dagen</h2>
          {komend.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">Geen geplande activiteiten.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {komend.map(taak => (
                <KomendKaart
                  key={taak.id}
                  taak={taak}
                  onOpen={() => openTaak(taak)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Taak modal */}
      {activeTaak && (
        <TaakModal
          taak={activeTaak}
          type={modalType}
          onSluit={() => { setActiveTaak(null); setModalType(null) }}
          onVoltooid={opslaanEnSluiten}
          onOvergeslagen={overslaanBevestigen}
          onVerwijderd={verwijderBevestigen}
        />
      )}
    </div>
  )
}

function TaakKaart({ taak, onOpen, onOverslaan }) {
  const stijl = TAAK_STIJL[taak.type] || { bg: 'bg-gray-100', tekst: 'text-gray-600', Icon: Check }
  const Icon = stijl.Icon

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stijl.bg} ${stijl.tekst}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-gray-800 text-sm leading-tight">{taak.titel}</p>
          {taak.serieId && <Repeat size={12} className="text-gray-400 shrink-0" />}
        </div>
        {taak.beschrijving && <p className="text-gray-500 text-xs mt-0.5 truncate">{taak.beschrijving}</p>}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onOpen}
          className="bg-accent-500 text-accent-fg text-xs font-medium px-3 py-1.5 rounded-lg"
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

function KomendKaart({ taak, onOpen }) {
  const stijl = TAAK_STIJL[taak.type] || { bg: 'bg-gray-100', tekst: 'text-gray-600', Icon: Check }
  const Icon = stijl.Icon

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 px-4 py-3 text-left"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stijl.bg} ${stijl.tekst}`}>
        <Icon size={16} />
      </div>
      <div className="w-20 shrink-0">
        <p className="text-xs font-semibold text-gray-700">{dagLabel(taak.datum)}</p>
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <p className="text-sm text-gray-800 truncate">{taak.titel}</p>
        {taak.serieId && <Repeat size={12} className="text-gray-400 shrink-0" />}
      </div>
    </button>
  )
}
