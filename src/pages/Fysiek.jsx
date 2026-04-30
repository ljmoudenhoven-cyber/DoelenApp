import { useState, useEffect, useCallback } from 'react'
import { getAll, getSetting } from '../store/db'
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

function formatDatum(datumStr) {
  if (!datumStr) return ''
  const d = new Date(datumStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// Lineair interpoleren: doelwaarde op willekeurige datum, op basis van omliggende doelpunten
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

// Bouw gecombineerde grafiekdata: metingen (solid) + doeltraject (dashed)
function bouwGrafiekData(metingen, tussendoelen, einddoel, einddoelDatum, dataKey) {
  const doelPunten = []

  // Startpunt doeltraject = eerste meting (als die er is)
  if (metingen.length > 0 && metingen[0][dataKey] != null) {
    doelPunten.push({ datum: metingen[0].datum, doel: metingen[0][dataKey] })
  }

  // Tussendoelen
  ;(tussendoelen || [])
    .filter(t => t[dataKey] != null)
    .forEach(t => doelPunten.push({ datum: t.datum, doel: t[dataKey] }))

  // Einddoel
  if (einddoel != null && einddoelDatum) {
    doelPunten.push({ datum: einddoelDatum, doel: einddoel })
  }

  doelPunten.sort((a, b) => a.datum.localeCompare(b.datum))

  // Alle unieke datums samenvoegen
  const alleData = {}
  metingen.forEach(m => {
    const doelOpDatum = interpoleerDoel(m.datum, doelPunten)
    alleData[m.datum] = {
      ...alleData[m.datum],
      datum: m.datum,
      meting: m[dataKey] ?? null,
      doel: doelOpDatum,
    }
  })
  doelPunten.forEach(p => {
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

function GrafiekKaart({ titel, metingen, dataKey, kleur, tussendoelen, einddoel, einddoelDatum, eenheid }) {
  const data = bouwGrafiekData(metingen, tussendoelen, einddoel, einddoelDatum, dataKey)
  const heeftData = data.length > 0
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
            <XAxis
              dataKey="datum"
              tick={{ fontSize: 9 }}
              tickFormatter={formatDatum}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9 }}
              domain={domein}
              width={32}
              tickFormatter={v => v}
            />
            <Tooltip
              formatter={(v, name) => [
                `${v} ${eenheid}`,
                name === 'meting' ? 'Meting' : 'Doel'
              ]}
              labelFormatter={formatDatum}
            />
            <Line
              type="monotone"
              dataKey="meting"
              stroke={kleur}
              strokeWidth={2}
              dot={{ r: 3, fill: kleur }}
              connectNulls={false}
              name="meting"
            />
            <Line
              type="monotone"
              dataKey="doel"
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={{ r: 3, fill: '#22c55e' }}
              connectNulls={true}
              name="doel"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="flex gap-3 mt-1">
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="inline-block w-4 h-0.5" style={{ background: kleur }} /> Meting
        </span>
        {einddoel && (
          <span className="flex items-center gap-1 text-[10px] text-green-500">
            <span className="inline-block w-4 border-t border-dashed border-green-500" /> Doeltraject
          </span>
        )}
      </div>
    </div>
  )
}

export default function Fysiek() {
  const [metingen, setMetingen] = useState([])
  const [doelen, setDoelen] = useState(null)
  const [lengte, setLengte] = useState(null)
  const [tussendoelen, setTussendoelen] = useState([])

  const navigate = useNavigate()

  const laad = useCallback(async () => {
    const [alle, d, l, td] = await Promise.all([
      getAll('metingen'),
      getSetting('fysiekDoelen'),
      getSetting('lengte'),
      getSetting('tussendoelen'),
    ])
    setMetingen(alle.sort((a, b) => a.datum.localeCompare(b.datum)))
    setDoelen(d)
    setLengte(l)
    setTussendoelen(td || [])
  }, [])

  useEffect(() => { laad() }, [laad])

  const laatste = [...metingen].reverse().find(m => m.gewicht != null)
  const einddoelDatum = doelen?.einddoelDatum || null

  // BMI afleiden uit gewicht voor tussendoelen en einddoel
  const lengteM = lengte ? lengte / 100 : null
  function gewichtNaarBMI(g) {
    if (!g || !lengteM) return null
    return Math.round((g / (lengteM * lengteM)) * 10) / 10
  }
  const tussendoelenMetBMI = tussendoelen.map(t => ({
    ...t,
    bmi: t.gewicht != null ? gewichtNaarBMI(t.gewicht) : null,
  }))
  const doelBMI = gewichtNaarBMI(doelen?.doelGewicht)

  const grafiekProps = {
    metingen,
    tussendoelen,
    einddoelDatum,
  }

  return (
    <div className="flex flex-col pb-6">
      <div className="bg-green-500 px-5 pt-14 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Fysiek 💪</h1>
          <p className="text-green-100 text-sm mt-1">Lichaamsmetingen bijhouden</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/basisgegevens')}
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
            onClick={() => navigate('/metingen')}
            className="bg-white text-green-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            title="Metingen beheren"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/>
              <path d="m14.5 12.5 2-2"/>
              <path d="m11.5 9.5 2-2"/>
              <path d="m8.5 6.5 2-2"/>
              <path d="m17.5 15.5 2-2"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Laatste meting */}
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
              className="mt-3 bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              + Eerste meting toevoegen
            </button>
          </div>
        )}

        {/* Grafieken */}
        <GrafiekKaart titel="Gewicht" dataKey="gewicht" kleur="#3b82f6"
          einddoel={doelen?.doelGewicht} eenheid="kg" {...grafiekProps} />
        <GrafiekKaart titel="Vetpercentage" dataKey="vetPercentage" kleur="#f97316"
          einddoel={doelen?.doelVet} eenheid="%" {...grafiekProps} />
        <GrafiekKaart titel="Buikomvang" dataKey="buikomvang" kleur="#8b5cf6"
          einddoel={doelen?.doelBuik} eenheid="cm" {...grafiekProps} />
        <GrafiekKaart
          titel="BMI"
          dataKey="bmi"
          kleur="#22c55e"
          eenheid=""
          metingen={metingen}
          tussendoelen={tussendoelenMetBMI}
          einddoel={doelBMI}
          einddoelDatum={einddoelDatum}
        />

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
