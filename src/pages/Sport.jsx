import { useState, useEffect } from 'react'
import { getAll, getSetting, getItem } from '../store/db'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

function formatTijd(seconden) {
  if (!seconden) return '—'
  const m = Math.floor(seconden / 60)
  const s = seconden % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatTempo(tempoMinKm) {
  if (!tempoMinKm) return '—'
  const m = Math.floor(tempoMinKm)
  const s = Math.round((tempoMinKm - m) * 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

function formatDatum(datumStr) {
  const d = new Date(datumStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function Sport() {
  const [activiteiten, setActiviteiten] = useState([])
  const [records, setRecords] = useState(null)
  const [schema, setSchema] = useState([])

  useEffect(() => {
    async function laad() {
      const [alle, rec, sch] = await Promise.all([
        getAll('sport'),
        getItem('settings', 'sportRecords'),
        getItem('settings', 'sportSchema'),
      ])
      const gesorteerd = alle.sort((a, b) => a.datum.localeCompare(b.datum))
      setActiviteiten(gesorteerd)
      setRecords(rec)
      setSchema(sch || [])
    }
    laad()
  }, [])

  const doel = new Date('2026-08-12')
  const vandaag = new Date()
  const dagenTotDoel = Math.ceil((doel - vandaag) / (1000 * 60 * 60 * 24))

  // Volgende geplande training
  const toekomst = schema.filter(s => s.datum >= vandaag.toISOString().split('T')[0])
  const volgende = toekomst[0]

  return (
    <div className="flex flex-col">
      <div className="bg-green-500 px-5 pt-14 pb-6">
        <h1 className="text-white text-2xl font-bold">Sport 🏃</h1>
        <p className="text-green-100 text-sm mt-1">Hardloopschema richting 10km op 12 aug</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Doelstatus */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Doel</h2>
              <p className="text-gray-600 text-sm mt-1">10km in &lt;55 min</p>
              <p className="text-gray-400 text-xs">12 augustus 2026</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{dagenTotDoel}</p>
              <p className="text-gray-400 text-xs">dagen te gaan</p>
            </div>
          </div>
          {volgende && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Volgende training: <span className="font-medium text-gray-700">{volgende.dag} {formatDatum(volgende.datum)} — {volgende.doelAfstand}km</span></p>
            </div>
          )}
        </div>

        {/* Records */}
        {records && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">🏆 Persoonlijke records</h2>
            <div className="grid grid-cols-2 gap-3">
              <RecordKaart label="Langste afstand" waarde={records.langsteAfstand ? `${records.langsteAfstand} km` : '—'} />
              <RecordKaart label="Langste duurloop" waarde={formatTijd(records.langsteDuurloop)} />
              <RecordKaart label="Snelste 1km" waarde={formatTempo(records.snelste1km)} />
              <RecordKaart label="Snelste 5km" waarde={formatTempo(records.snelste5km)} />
            </div>
          </div>
        )}

        {/* Grafiek afstand */}
        {activiteiten.length >= 2 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Afstand over tijd</h2>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={activiteiten}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="datum" tick={{ fontSize: 9 }} tickFormatter={formatDatum} />
                <YAxis tick={{ fontSize: 9 }} domain={[0, 12]} width={30} />
                <Tooltip formatter={(v) => [`${v} km`, 'Afstand']} labelFormatter={formatDatum} />
                <ReferenceLine y={10} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Doel 10km', fontSize: 9, fill: '#22c55e' }} />
                <Line type="monotone" dataKey="afstand" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recente trainingen */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Recente trainingen</h2>
          {activiteiten.length === 0 ? (
            <p className="text-gray-400 text-sm">Nog geen trainingen geregistreerd.</p>
          ) : (
            <div className="space-y-2">
              {[...activiteiten].reverse().slice(0, 5).map(a => (
                <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{a.afstand} km</p>
                    <p className="text-xs text-gray-400">{formatDatum(a.datum)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatTijd(a.tijdSec)}</p>
                    <p className="text-xs text-gray-400">{formatTempo(a.tempo)}</p>
                  </div>
                  {a.hartslag && (
                    <div className="text-right">
                      <p className="text-xs text-red-400">♥ {a.hartslag}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecordKaart({ label, waarde }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="font-semibold text-gray-800 text-sm mt-0.5">{waarde}</p>
    </div>
  )
}
