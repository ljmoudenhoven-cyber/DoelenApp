import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAll, getSetting } from '../store/db'
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { getPlannen } from '../store/doelplan'
import { Target, Ruler } from '../components/Iconen'

function formatDatum(datumStr) {
  if (!datumStr) return ''
  const d = new Date(datumStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// Bouw één doelpuntenlijst uit alle plannen, waarbij een nieuwer plan
// overneemt vanaf zijn gegenereerdOp-datum. Dat geeft een doellijn met
// een 'knik' op het moment van bijstellen — en historie blijft zichtbaar.
function bouwAllePlanpunten(plannen) {
  if (!plannen?.length) return []
  const sorted = [...plannen].sort((a, b) => a.gegenereerdOp.localeCompare(b.gegenereerdOp))
  const punten = []
  sorted.forEach((plan, idx) => {
    const volgende = sorted[idx + 1]
    const grens = volgende ? volgende.gegenereerdOp : plan.eindDatum
    punten.push({ datum: plan.gegenereerdOp, gewicht: plan.startGewicht })
    ;(plan.tussendoelen || [])
      .filter(td => td.datum <= grens)
      .forEach(td => punten.push({ datum: td.datum, gewicht: td.gewicht }))
    if (!volgende) {
      punten.push({ datum: plan.eindDatum, gewicht: plan.doelGewicht })
    }
  })
  return punten.sort((a, b) => a.datum.localeCompare(b.datum))
}

function interpoleerDoel(datum, doelPunten) {
  if (!doelPunten.length) return null
  let voor = null, na = null
  for (const p of doelPunten) {
    if (p.datum <= datum) voor = p
    if (p.datum >= datum && !na) na = p
  }
  if (voor && na) {
    if (voor.datum === na.datum) return voor.doel
    const t1 = new Date(voor.datum + 'T00:00:00').getTime()
    const t2 = new Date(na.datum + 'T00:00:00').getTime()
    const t = new Date(datum + 'T00:00:00').getTime()
    const ratio = (t - t1) / (t2 - t1)
    return Math.round((voor.doel + (na.doel - voor.doel) * ratio) * 10) / 10
  }
  return voor?.doel ?? na?.doel ?? null
}

function bouwGrafiekData(metingen, doelpunten, dataKey) {
  const doelPuntenMetKey = (doelpunten || [])
    .filter(t => t[dataKey] != null)
    .map(t => ({ datum: t.datum, doel: t[dataKey] }))
    .sort((a, b) => a.datum.localeCompare(b.datum))

  const alleData = {}
  metingen.forEach(m => {
    const doelOpDatum = interpoleerDoel(m.datum, doelPuntenMetKey)
    alleData[m.datum] = {
      ...alleData[m.datum],
      datum: m.datum,
      meting: m[dataKey] ?? null,
      doel: doelOpDatum,
    }
  })
  doelPuntenMetKey.forEach(p => {
    alleData[p.datum] = { ...alleData[p.datum], datum: p.datum, doel: p.doel }
  })

  return Object.values(alleData).sort((a, b) => a.datum.localeCompare(b.datum))
}

function domeinBerekenen(data, keys) {
  const waarden = data.flatMap(d => keys.map(k => d[k]).filter(v => v != null))
  if (waarden.length === 0) return ['auto', 'auto']
  const min = Math.min(...waarden)
  const max = Math.max(...waarden)
  const marge = (max - min) * 0.15 || 2
  return [Math.floor(min - marge), Math.ceil(max + marge)]
}

function GrafiekKaart({ titel, metingen, dataKey, kleur, doelpunten, eenheid }) {
  const data = bouwGrafiekData(metingen, doelpunten, dataKey)
  const heeftData = data.length > 0
  const heeftDoellijn = (doelpunten || []).some(p => p[dataKey] != null)
  const domein = domeinBerekenen(data, ['meting', 'doel'])
  const laatste = [...metingen].reverse().find(m => m[dataKey] != null)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700 text-sm">{titel}</h3>
        {laatste && (
          <span className="text-gray-500 text-xs font-medium">
            {laatste[dataKey]} {eenheid}
          </span>
        )}
      </div>

      {!heeftData ? (
        <div className="h-[120px] flex items-center justify-center">
          <p className="text-gray-300 text-xs">Voeg een meting toe om te beginnen</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={130}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="datum" tick={{ fontSize: 9 }} tickFormatter={formatDatum} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9 }} domain={domein} width={32} tickFormatter={v => v} />
            <Tooltip
              formatter={(v, name) => [`${v} ${eenheid}`, name === 'meting' ? 'Meting' : 'Doel']}
              labelFormatter={formatDatum}
            />
            <Line type="monotone" dataKey="meting" stroke={kleur} strokeWidth={2}
              dot={{ r: 3, fill: kleur }} connectNulls={false} name="meting" />
            <Line type="monotone" dataKey="doel" stroke="var(--accent-500)" strokeWidth={1.5}
              strokeDasharray="6 3" dot={{ r: 3, fill: 'var(--accent-500)' }} connectNulls={true} name="doel" />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="flex gap-3 mt-1">
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="inline-block w-4 h-0.5" style={{ background: kleur }} /> Meting
        </span>
        {heeftDoellijn && (
          <span className="flex items-center gap-1 text-[10px] text-accent-600">
            <span className="inline-block w-4 border-t border-dashed border-accent-500" /> Doeltraject
          </span>
        )}
      </div>
    </div>
  )
}

export default function Fysiek() {
  const [metingen, setMetingen] = useState([])
  const [lengte, setLengte] = useState(null)
  const [plannen, setPlannen] = useState([])

  const navigate = useNavigate()

  const laad = useCallback(async () => {
    const [alle, l, p] = await Promise.all([
      getAll('metingen'),
      getSetting('lengte'),
      getPlannen(),
    ])
    setMetingen(alle.sort((a, b) => a.datum.localeCompare(b.datum)))
    setLengte(l)
    setPlannen(p)
  }, [])

  useEffect(() => { laad() }, [laad])

  const laatste = [...metingen].reverse().find(m => m.gewicht != null)
  const lengteM = lengte ? lengte / 100 : null
  const gewichtNaarBMI = (g) => (!g || !lengteM) ? null : Math.round((g / (lengteM * lengteM)) * 10) / 10

  const planDoelpunten = useMemo(() => bouwAllePlanpunten(plannen), [plannen])
  const bmiDoelpunten = useMemo(
    () => planDoelpunten.map(p => ({ ...p, bmi: gewichtNaarBMI(p.gewicht) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planDoelpunten, lengteM]
  )

  return (
    <div className="flex flex-col pb-6">
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-accent-fg text-2xl font-bold">Fysiek</h1>
          <p className="text-accent-fg-soft text-sm mt-1">Lichaamsmetingen bijhouden</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/mijn-plan')}
            className="bg-white text-accent-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            title="Mijn plan"
            aria-label="Mijn plan"
          >
            <Target size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate('/metingen')}
            className="bg-white text-accent-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            title="Metingen beheren"
            aria-label="Metingen"
          >
            <Ruler size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {laatste ? (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Laatste meting — {formatDatum(laatste.datum)}</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatKaart label="Gewicht" waarde={`${laatste.gewicht} kg`} />
              <StatKaart label="Vetpercentage" waarde={`${laatste.vetPercentage}%`} />
              <StatKaart label="Buikomvang" waarde={`${laatste.buikomvang} cm`} />
              <StatKaart label="BMI" waarde={laatste.bmi} bmiInfo={bmiInfo(laatste.bmi)} />
            </div>
            {lengte && <p className="text-gray-400 text-xs mt-2">Lengte: {lengte} cm</p>}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-gray-500 text-sm">Nog geen metingen.</p>
            <button
              onClick={() => navigate('/metingen')}
              className="mt-3 bg-accent-500 text-accent-fg text-sm font-medium px-4 py-2 rounded-lg"
            >
              + Eerste meting toevoegen
            </button>
          </div>
        )}

        <GrafiekKaart titel="Gewicht" dataKey="gewicht" kleur="#3b82f6"
          metingen={metingen} doelpunten={planDoelpunten} eenheid="kg" />
        <GrafiekKaart titel="Vetpercentage" dataKey="vetPercentage" kleur="#f97316"
          metingen={metingen} doelpunten={[]} eenheid="%" />
        <GrafiekKaart titel="Buikomvang" dataKey="buikomvang" kleur="#8b5cf6"
          metingen={metingen} doelpunten={[]} eenheid="cm" />
        <GrafiekKaart titel="BMI" dataKey="bmi" kleur="#22c55e"
          metingen={metingen} doelpunten={bmiDoelpunten} eenheid="" />
      </div>
    </div>
  )
}

function StatKaart({ label, waarde, bmiInfo }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="font-semibold text-gray-800 text-lg leading-tight">{waarde}</p>
      {bmiInfo && <p className={`text-xs font-medium ${bmiInfo.kleur}`}>{bmiInfo.label}</p>}
    </div>
  )
}

function bmiInfo(bmi) {
  if (!bmi) return null
  if (bmi < 18.5) return { label: 'Ondergewicht', kleur: 'text-orange-500' }
  if (bmi < 25) return { label: 'Normaal gewicht', kleur: 'text-green-600' }
  if (bmi < 30) return { label: 'Licht overgewicht', kleur: 'text-orange-500' }
  return { label: 'Ernstig overgewicht', kleur: 'text-red-500' }
}
