import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { maakHandmatigeTaak, maakHerhalendeTaak, formatDateKey } from '../store/taken'
import { User, Apple, Brain, Repeat } from '../components/Iconen'

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

const FREQUENTIES = [
  { id: 'dagelijks', label: 'Dagelijks' },
  { id: 'wekelijks', label: 'Wekelijks' },
  { id: 'maandelijks', label: 'Maandelijks' },
]

// JS getDay(): 0=zon, 1=maa ... 6=zat. Volgorde Ma-Zo voor weergave.
const WEEKDAGEN = [
  { dag: 1, label: 'Ma' },
  { dag: 2, label: 'Di' },
  { dag: 3, label: 'Wo' },
  { dag: 4, label: 'Do' },
  { dag: 5, label: 'Vr' },
  { dag: 6, label: 'Za' },
  { dag: 0, label: 'Zo' },
]

function plusMaanden(datumStr, n) {
  const d = new Date(datumStr + 'T00:00:00')
  d.setMonth(d.getMonth() + n)
  return formatDateKey(d)
}

export default function ActiviteitPlannen() {
  const navigate = useNavigate()
  const vandaag = formatDateKey(new Date())

  const [type, setType] = useState('persoonlijk')
  const [titel, setTitel] = useState('')
  const [datum, setDatum] = useState(vandaag)
  const [beschrijving, setBeschrijving] = useState('')

  const [herhaalAan, setHerhaalAan] = useState(false)
  const [frequentie, setFrequentie] = useState('wekelijks')
  const [dagen, setDagen] = useState(() => new Set([new Date(vandaag + 'T00:00:00').getDay()]))
  const [geenEinddatum, setGeenEinddatum] = useState(false)
  const [eindDatum, setEindDatum] = useState(plusMaanden(vandaag, 3))

  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  const dagInMaand = useMemo(() => {
    if (!datum) return null
    return new Date(datum + 'T00:00:00').getDate()
  }, [datum])

  function toggleDag(d) {
    const nieuw = new Set(dagen)
    if (nieuw.has(d)) nieuw.delete(d); else nieuw.add(d)
    setDagen(nieuw)
  }

  function wijzigDatum(nieuweDatum) {
    setDatum(nieuweDatum)
    if (nieuweDatum && herhaalAan && frequentie === 'wekelijks' && dagen.size === 0) {
      setDagen(new Set([new Date(nieuweDatum + 'T00:00:00').getDay()]))
    }
  }

  async function opslaan() {
    if (!titel.trim()) { setFout('Geef de activiteit een titel.'); return }
    if (!datum) { setFout('Kies een datum.'); return }
    if (herhaalAan) {
      if (frequentie === 'wekelijks' && dagen.size === 0) {
        setFout('Kies minimaal één dag voor wekelijkse herhaling.')
        return
      }
      if (!geenEinddatum && !eindDatum) {
        setFout('Kies een einddatum of zet "Geen einddatum" aan.')
        return
      }
      if (!geenEinddatum && eindDatum < datum) {
        setFout('De einddatum moet na de startdatum liggen.')
        return
      }
    }
    setBezig(true)
    try {
      if (herhaalAan) {
        const tot = geenEinddatum ? plusMaanden(datum, 12) : eindDatum
        const herhaling = frequentie === 'wekelijks'
          ? { type: 'wekelijks', dagen: [...dagen], tot }
          : { type: frequentie, tot }
        await maakHerhalendeTaak({
          type,
          titel: titel.trim(),
          datum,
          beschrijving: beschrijving.trim(),
          herhaling,
        })
      } else {
        await maakHandmatigeTaak({
          type,
          titel: titel.trim(),
          datum,
          beschrijving: beschrijving.trim(),
        })
      }
      navigate('/')
    } catch (err) {
      setFout(err.message || 'Er ging iets mis.')
      setBezig(false)
    }
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {herhaalAan ? 'Startdatum' : 'Datum'}
            </label>
            <input
              type="date"
              value={datum}
              onChange={e => wijzigDatum(e.target.value)}
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

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Herhalen</span>
              </div>
              <button
                type="button"
                onClick={() => setHerhaalAan(!herhaalAan)}
                role="switch"
                aria-checked={herhaalAan}
                className={`relative w-11 h-6 rounded-full transition-colors ${herhaalAan ? 'bg-accent-500' : 'bg-gray-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${herhaalAan ? 'translate-x-5' : ''}`}
                />
              </button>
            </div>

            {herhaalAan && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Frequentie</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FREQUENTIES.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFrequentie(f.id)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                          frequentie === f.id
                            ? 'bg-accent-500 text-accent-fg border-accent-500'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {frequentie === 'wekelijks' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Op welke dagen</label>
                    <div className="grid grid-cols-7 gap-1">
                      {WEEKDAGEN.map(w => {
                        const aan = dagen.has(w.dag)
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

                {frequentie === 'maandelijks' && dagInMaand && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    Elke maand op dag {dagInMaand}. Maanden waarin deze dag niet bestaat (bv. 31 februari) krijgen de laatste dag van de maand.
                  </p>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-500">Tot</label>
                    <label className="flex items-center gap-2 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={geenEinddatum}
                        onChange={e => setGeenEinddatum(e.target.checked)}
                        className="rounded"
                      />
                      Geen einddatum
                    </label>
                  </div>
                  <input
                    type="date"
                    value={eindDatum}
                    min={datum || vandaag}
                    onChange={e => setEindDatum(e.target.value)}
                    disabled={geenEinddatum}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {geenEinddatum && (
                    <p className="text-[11px] text-gray-400 mt-1">Wordt automatisch beperkt tot 1 jaar vooruit.</p>
                  )}
                </div>
              </div>
            )}
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
