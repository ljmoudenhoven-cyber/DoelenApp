import { useState, useEffect } from 'react'
import { getAll, getSetting } from '../store/db'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

function formatDatum(datumStr) {
  const d = new Date(datumStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function GrafiekKaart({ titel, data, dataKey, kleur, doel, eenheid }) {
  if (data.length < 2) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-medium text-gray-700 text-sm mb-2">{titel}</h3>
        <p className="text-gray-400 text-xs">Nog te weinig data — meet minstens 2 maandagen.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700 text-sm">{titel}</h3>
        <span className="text-gray-500 text-xs">{data[data.length - 1]?.[dataKey]} {eenheid}</span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="datum" tick={{ fontSize: 10 }} tickFormatter={formatDatum} />
          <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} width={35} />
          <Tooltip
            formatter={(v) => [`${v} ${eenheid}`, titel]}
            labelFormatter={formatDatum}
          />
          {doel && (
            <ReferenceLine y={doel} stroke="#22c55e" strokeDasharray="5 5" label={{ value: `Doel: ${doel}`, fontSize: 10, fill: '#22c55e' }} />
          )}
          <Line type="monotone" dataKey={dataKey} stroke={kleur} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Fysiek() {
  const [metingen, setMetingen] = useState([])
  const [doelen, setDoelen] = useState(null)
  const [lengte, setLengte] = useState(null)

  useEffect(() => {
    async function laad() {
      const [alle, d, l] = await Promise.all([
        getAll('metingen'),
        getSetting('fysiekDoelen'),
        getSetting('lengte'),
      ])
      const gesorteerd = alle.sort((a, b) => a.datum.localeCompare(b.datum))
      setMetingen(gesorteerd)
      setDoelen(d)
      setLengte(l)
    }
    laad()
  }, [])

  const laatste = metingen[metingen.length - 1]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-green-500 px-5 pt-14 pb-6">
        <h1 className="text-white text-2xl font-bold">Fysiek 💪</h1>
        <p className="text-green-100 text-sm mt-1">Wekelijkse lichaamsmetingen</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Laatste meting */}
        {laatste && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Laatste meting</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatKaart label="Gewicht" waarde={`${laatste.gewicht} kg`} />
              <StatKaart label="Vetpercentage" waarde={`${laatste.vetPercentage}%`} />
              <StatKaart label="Buikomvang" waarde={`${laatste.buikomvang} cm`} />
              <StatKaart label="BMI" waarde={laatste.bmi} extra={bmiCategorie(laatste.bmi)} />
            </div>
            <p className="text-gray-400 text-xs mt-3">
              {formatDatum(laatste.datum)} {lengte && `• Lengte: ${lengte}cm`}
            </p>
          </div>
        )}

        {metingen.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-500 text-sm">Nog geen metingen ingevoerd.</p>
            <p className="text-gray-400 text-xs mt-1">Vul elke maandag je metingen in via de takenlijst.</p>
          </div>
        )}

        {/* Grafieken */}
        <GrafiekKaart
          titel="Gewicht"
          data={metingen}
          dataKey="gewicht"
          kleur="#3b82f6"
          doel={doelen?.doelGewicht}
          eenheid="kg"
        />
        <GrafiekKaart
          titel="Vetpercentage"
          data={metingen}
          dataKey="vetPercentage"
          kleur="#f97316"
          doel={doelen?.doelVet}
          eenheid="%"
        />
        <GrafiekKaart
          titel="Buikomvang"
          data={metingen}
          dataKey="buikomvang"
          kleur="#8b5cf6"
          doel={doelen?.doelBuik}
          eenheid="cm"
        />
        <GrafiekKaart
          titel="BMI"
          data={metingen}
          dataKey="bmi"
          kleur="#22c55e"
          eenheid=""
        />
      </div>
    </div>
  )
}

function StatKaart({ label, waarde, extra }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="font-semibold text-gray-800 text-lg leading-tight">{waarde}</p>
      {extra && <p className="text-xs text-green-600">{extra}</p>}
    </div>
  )
}

function bmiCategorie(bmi) {
  if (!bmi) return null
  if (bmi < 18.5) return 'Ondergewicht'
  if (bmi < 25) return 'Normaal gewicht'
  if (bmi < 30) return 'Overgewicht'
  return 'Obesitas'
}
