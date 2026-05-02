import { useEffect, useState } from 'react'
import { getItem, setItem, getAll } from '../../store/db'
import { taakAfvinken } from '../../store/taken'
import { getHealthcheckConfig } from '../../store/healthcheck'
import { Check } from '../Iconen'

const MAALTIJDEN = [
  { id: 'ontbijt', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'diner', label: 'Diner' },
  { id: 'tussendoor', label: 'Tussendoor' },
]

const MAALTIJD_OPTIES = [
  { id: 'niets', label: 'Niets' },
  { id: 'gezond', label: 'Gezond' },
  { id: 'normaal', label: 'Normaal' },
  { id: 'ongezond', label: 'Ongezond' },
]

const GEVOEL_KLEUREN = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-500']

function SchaalDots({ waarde, onWijzig, max = 5, kleurenVerloop = false }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1
        const aan = waarde >= n
        const kleur = aan
          ? (kleurenVerloop ? GEVOEL_KLEUREN[i] : 'bg-accent-500')
          : 'bg-gray-200'
        return (
          <button
            key={n}
            type="button"
            onClick={() => onWijzig(waarde === n ? 0 : n)}
            aria-label={`${n} van ${max}`}
            className={`flex-1 h-8 rounded-lg transition-colors ${kleur}`}
          />
        )
      })}
    </div>
  )
}

function JaNeeKnoppen({ waarde, onWijzig }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { id: false, label: 'Nee' },
        { id: true, label: 'Ja' },
      ].map(o => (
        <button
          key={String(o.id)}
          type="button"
          onClick={() => onWijzig(o.id)}
          className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            waarde === o.id
              ? 'bg-accent-500 text-accent-fg border-accent-500'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SectieKop({ titel, hint }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-800">{titel}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  )
}

export default function HealthcheckFormulier({ taak, onVoltooid }) {
  const [config, setConfig] = useState(null)
  const [antwoorden, setAntwoorden] = useState({
    gevoel: 0,
    slaap: 0,
    water: 4,
    sport: null,
    meditatie: null,
    medicijnen: null,
    hoofdpijn: 0,
    maaltijden: { ontbijt: null, lunch: null, diner: null, tussendoor: null },
  })
  const [bezig, setBezig] = useState(false)
  const [autoSport, setAutoSport] = useState(false)
  const [autoMed, setAutoMed] = useState(false)

  useEffect(() => {
    async function laad() {
      const cfg = await getHealthcheckConfig()
      setConfig(cfg)

      const bestaand = await getItem('healthcheck', `check-${taak.datum}`)
      if (bestaand?.antwoorden) {
        setAntwoorden(prev => ({ ...prev, ...bestaand.antwoorden }))
        return
      }

      const alleTaken = await getAll('taken')
      const vandaagTaken = alleTaken.filter(t => t.datum === taak.datum && t.status === 'voltooid')
      const sportGedaan = vandaagTaken.some(t => t.type === 'sport')
      const medGedaan = vandaagTaken.some(t =>
        t.handmatig && /medit/i.test(t.titel || '')
      )
      setAutoSport(sportGedaan)
      setAutoMed(medGedaan)
      setAntwoorden(prev => ({
        ...prev,
        sport: sportGedaan ? true : prev.sport,
        meditatie: medGedaan ? true : prev.meditatie,
      }))
    }
    laad()
  }, [taak.datum])

  if (!config) return <p className="text-gray-400 text-sm">Laden...</p>

  const themas = config.themas

  function setMaaltijd(slot, waarde) {
    setAntwoorden(a => ({
      ...a,
      maaltijden: { ...a.maaltijden, [slot]: a.maaltijden[slot] === waarde ? null : waarde },
    }))
  }

  async function opslaan() {
    setBezig(true)
    await setItem('healthcheck', `check-${taak.datum}`, {
      id: `check-${taak.datum}`,
      datum: taak.datum,
      antwoorden,
      ingevoerdOp: new Date().toISOString(),
    })
    await taakAfvinken(taak.id)
    onVoltooid()
  }

  return (
    <div className="space-y-5">
      {themas.gevoel && (
        <div className="space-y-2">
          <SectieKop titel="Hoe voelde je je vandaag?" hint="Slecht — uitstekend" />
          <SchaalDots
            waarde={antwoorden.gevoel}
            onWijzig={v => setAntwoorden(a => ({ ...a, gevoel: v }))}
            kleurenVerloop
          />
        </div>
      )}

      {themas.slaap && (
        <div className="space-y-2">
          <SectieKop titel="Hoe heb je geslapen?" hint="Slecht — uitstekend" />
          <SchaalDots
            waarde={antwoorden.slaap}
            onWijzig={v => setAntwoorden(a => ({ ...a, slaap: v }))}
          />
        </div>
      )}

      {themas.maaltijden && (
        <div className="space-y-2">
          <SectieKop titel="Maaltijden" />
          <div className="space-y-2">
            {MAALTIJDEN.map(m => (
              <div key={m.id} className="space-y-1">
                <p className="text-xs text-gray-500">{m.label}</p>
                <div className="grid grid-cols-4 gap-1">
                  {MAALTIJD_OPTIES.map(o => {
                    const aan = antwoorden.maaltijden[m.id] === o.id
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setMaaltijd(m.id, o.id)}
                        className={`py-2 rounded-lg text-[11px] font-medium border transition-colors ${
                          aan
                            ? 'bg-accent-500 text-accent-fg border-accent-500'
                            : 'bg-white text-gray-500 border-gray-200'
                        }`}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {themas.water && (
        <div className="space-y-2">
          <SectieKop titel="Glazen water" hint="Inschatting van vandaag" />
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-2 py-2">
            <button
              type="button"
              onClick={() => setAntwoorden(a => ({ ...a, water: Math.max(0, a.water - 1) }))}
              className="w-10 h-10 rounded-lg bg-white text-gray-600 text-xl font-bold border border-gray-200"
            >
              −
            </button>
            <span className="text-2xl font-semibold text-gray-800">{antwoorden.water}</span>
            <button
              type="button"
              onClick={() => setAntwoorden(a => ({ ...a, water: Math.min(20, a.water + 1) }))}
              className="w-10 h-10 rounded-lg bg-white text-gray-600 text-xl font-bold border border-gray-200"
            >
              +
            </button>
          </div>
        </div>
      )}

      {themas.sport && (
        <div className="space-y-2">
          <SectieKop
            titel="Heb je gesport?"
            hint={autoSport ? 'Automatisch ingevuld op basis van je sport-activiteit' : null}
          />
          <JaNeeKnoppen
            waarde={antwoorden.sport}
            onWijzig={v => setAntwoorden(a => ({ ...a, sport: v }))}
          />
        </div>
      )}

      {themas.meditatie && (
        <div className="space-y-2">
          <SectieKop
            titel="Heb je gemediteerd?"
            hint={autoMed ? 'Automatisch ingevuld op basis van je activiteiten' : null}
          />
          <JaNeeKnoppen
            waarde={antwoorden.meditatie}
            onWijzig={v => setAntwoorden(a => ({ ...a, meditatie: v }))}
          />
        </div>
      )}

      {themas.medicijnen && (
        <div className="space-y-2">
          <SectieKop titel="Medicijnen gebruikt?" />
          <JaNeeKnoppen
            waarde={antwoorden.medicijnen}
            onWijzig={v => setAntwoorden(a => ({ ...a, medicijnen: v }))}
          />
        </div>
      )}

      {themas.hoofdpijn && (
        <div className="space-y-2">
          <SectieKop titel="Hoofdpijn / migraine" hint="0 = geen, 5 = erg" />
          <div className="grid grid-cols-6 gap-1">
            {[0, 1, 2, 3, 4, 5].map(n => {
              const aan = antwoorden.hoofdpijn === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAntwoorden(a => ({ ...a, hoofdpijn: n }))}
                  className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    aan
                      ? 'bg-accent-500 text-accent-fg border-accent-500'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={opslaan}
        disabled={bezig}
        className="w-full bg-accent-500 text-accent-fg font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Check size={18} strokeWidth={2.5} />
        {bezig ? 'Opslaan...' : 'Check-in opslaan'}
      </button>
    </div>
  )
}
