import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getAll, getItem } from '../store/db'
import { formatDateKey } from '../store/taken'
import { getHealthcheckConfig } from '../store/healthcheck'
import { ClipboardCheck, Cog } from '../components/Iconen'
import TaakModal from '../components/TaakModal'

const DAGEN = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

function laatsteNDagen(n) {
  const out = []
  const vandaag = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(vandaag)
    d.setDate(vandaag.getDate() - i)
    out.push(d)
  }
  return out
}

function kleurVoorGevoel(score) {
  if (!score) return 'bg-gray-100'
  if (score === 1) return 'bg-accent-100'
  if (score === 2) return 'bg-accent-200'
  if (score === 3) return 'bg-accent-500'
  if (score === 4) return 'bg-accent-600'
  return 'bg-accent-700'
}

function tekstKleurVoorGevoel(score) {
  if (!score) return 'text-gray-400'
  if (score === 1 || score === 2) return 'text-gray-700'
  return 'text-accent-fg'
}

function VandaagKaart({ entry, taak, onVulIn }) {
  if (entry) {
    const gevoel = entry.antwoorden?.gevoel || 0
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-800">Vandaag</span>
          <span className="text-xs text-gray-400">Ingevuld</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">Gevoel</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <div
              key={n}
              className={`flex-1 h-3 rounded-md ${gevoel >= n ? 'bg-accent-500' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        {taak && (
          <button
            onClick={onVulIn}
            className="text-accent-600 text-xs font-medium mt-3"
          >
            Bewerken
          </button>
        )}
      </div>
    )
  }
  if (taak) {
    return (
      <div className="bg-accent-50 border border-accent-200 rounded-xl p-4">
        <p className="text-accent-700 font-semibold text-sm">Nog niet ingevuld vandaag</p>
        <p className="text-accent-600 text-xs mt-1">Een minuut nu, een patroon later.</p>
        <button
          onClick={onVulIn}
          className="mt-3 bg-accent-500 text-accent-fg text-sm font-medium px-4 py-2 rounded-lg"
        >
          Vul nu in
        </button>
      </div>
    )
  }
  return null
}

function TrendGrafiek({ titel, dataKey, data }) {
  return (
    <section>
      <h2 className="text-gray-800 font-semibold text-base mb-3">{titel}</h2>
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#9ca3af' }} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              labelStyle={{ color: '#6b7280' }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="var(--accent-500)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--accent-500)' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function MaandHeatmap({ entries }) {
  const vandaag = new Date()
  const jaar = vandaag.getFullYear()
  const maand = vandaag.getMonth()
  const eerste = new Date(jaar, maand, 1)
  const dagInWeekMa = (eerste.getDay() + 6) % 7
  const aantalDagen = new Date(jaar, maand + 1, 0).getDate()

  const cellen = []
  for (let i = 0; i < dagInWeekMa; i++) cellen.push({ leeg: true, key: `pre-${i}` })
  for (let d = 1; d <= aantalDagen; d++) {
    const datumKey = formatDateKey(new Date(jaar, maand, d))
    const entry = entries.find(e => e.datum === datumKey)
    cellen.push({
      key: datumKey,
      dag: d,
      gevoel: entry?.antwoorden?.gevoel || 0,
      isVandaag: d === vandaag.getDate(),
    })
  }

  return (
    <section>
      <h2 className="text-gray-800 font-semibold text-base mb-3">Deze maand</h2>
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <p className="text-xs text-gray-500 capitalize mb-3">{MAANDEN[maand]} {jaar}</p>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAGEN.map(d => (
            <div key={d} className="text-[10px] text-gray-400 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cellen.map(c => c.leeg ? (
            <div key={c.key} className="aspect-square" />
          ) : (
            <div
              key={c.key}
              className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium ${kleurVoorGevoel(c.gevoel)} ${tekstKleurVoorGevoel(c.gevoel)} ${c.isVandaag ? 'ring-2 ring-accent-600 ring-offset-1' : ''}`}
            >
              {c.dag}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400">
          <span>Slecht</span>
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-3 rounded bg-accent-100" />
            <div className="w-3 h-3 rounded bg-accent-200" />
            <div className="w-3 h-3 rounded bg-accent-500" />
            <div className="w-3 h-3 rounded bg-accent-600" />
            <div className="w-3 h-3 rounded bg-accent-700" />
          </div>
          <span>Uitstekend</span>
        </div>
      </div>
    </section>
  )
}

function ThemaTellingen({ entries, themas }) {
  const last7Keys = laatsteNDagen(7).map(d => formatDateKey(d))
  const weekEntries = entries.filter(e => last7Keys.includes(e.datum))
  const totaal = weekEntries.length
  if (totaal === 0) return null

  const rijen = []
  if (themas.sport) rijen.push({
    label: 'Sport', waarde: weekEntries.filter(e => e.antwoorden?.sport === true).length, max: totaal,
  })
  if (themas.meditatie) rijen.push({
    label: 'Meditatie', waarde: weekEntries.filter(e => e.antwoorden?.meditatie === true).length, max: totaal,
  })
  if (themas.medicijnen) rijen.push({
    label: 'Medicijnen', waarde: weekEntries.filter(e => e.antwoorden?.medicijnen === true).length, max: totaal,
  })
  if (themas.hoofdpijn) rijen.push({
    label: 'Hoofdpijn', waarde: weekEntries.filter(e => (e.antwoorden?.hoofdpijn || 0) > 0).length, max: totaal, suffix: 'dagen',
  })
  if (themas.water) {
    const totaalWater = weekEntries.reduce((s, e) => s + (e.antwoorden?.water || 0), 0)
    const gemiddelde = totaal > 0 ? Math.round((totaalWater / totaal) * 10) / 10 : 0
    rijen.push({ label: 'Water', waarde: gemiddelde, suffix: 'glazen p/d' })
  }

  if (rijen.length === 0) return null

  return (
    <section>
      <h2 className="text-gray-800 font-semibold text-base mb-3">Deze week</h2>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {rijen.map(r => (
          <div key={r.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-700">{r.label}</span>
            <span className="text-sm font-semibold text-gray-800">
              {r.waarde}
              {r.max != null && <span className="text-gray-400 font-normal"> / {r.max}</span>}
              {r.suffix && <span className="text-gray-400 font-normal"> {r.suffix}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function MijnCheckins() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [config, setConfig] = useState(null)
  const [vandaagTaak, setVandaagTaak] = useState(null)
  const [activeTaak, setActiveTaak] = useState(null)

  const laad = useCallback(async () => {
    const vandaagKey = formatDateKey(new Date())
    const [all, cfg, taak] = await Promise.all([
      getAll('healthcheck'),
      getHealthcheckConfig(),
      getItem('taken', `healthcheck-${vandaagKey}`),
    ])
    setEntries(all.sort((a, b) => a.datum.localeCompare(b.datum)))
    setConfig(cfg)
    setVandaagTaak(taak)
  }, [])

  useEffect(() => { laad() }, [laad])

  if (!config) return null

  const vandaagKey = formatDateKey(new Date())
  const vandaagEntry = entries.find(e => e.datum === vandaagKey)
  const heeftGenoegData = entries.length >= 3

  const trendDagen = laatsteNDagen(14).map(d => {
    const key = formatDateKey(d)
    const e = entries.find(x => x.datum === key)
    return {
      datum: key,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      gevoel: e?.antwoorden?.gevoel || null,
      slaap: e?.antwoorden?.slaap || null,
    }
  })

  function vulIn() {
    if (vandaagTaak) setActiveTaak(vandaagTaak)
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-accent-fg text-2xl font-bold flex items-center gap-2">
            Mijn check-ins
            <ClipboardCheck size={22} strokeWidth={2.5} />
          </h1>
          <p className="text-accent-fg-soft text-sm mt-1">Je dagen in cijfers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/healthcheck-instellen')}
            aria-label="Check-in instellingen"
            className="bg-white text-accent-600 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
          >
            <Cog size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-accent-overlay text-accent-fg text-sm font-medium px-4 py-2 rounded-full"
          >
            Sluiten
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {!config.actief ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-gray-500 text-sm font-medium">Check-in staat uit</p>
            <p className="text-gray-400 text-xs mt-1">Schakel hem in via het tandwiel-icoon om te beginnen.</p>
          </div>
        ) : (
          <>
            <VandaagKaart entry={vandaagEntry} taak={vandaagTaak} onVulIn={vulIn} />

            {entries.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                <p className="text-gray-500 text-sm font-medium">Nog geen check-ins</p>
                <p className="text-gray-400 text-xs mt-1">Vul je eerste check-in in om je geschiedenis op te bouwen.</p>
              </div>
            ) : !heeftGenoegData ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                <p className="text-gray-500 text-sm font-medium">Bouw je geschiedenis op</p>
                <p className="text-gray-400 text-xs mt-1">Vanaf drie ingevulde dagen zie je hier je trends en patronen.</p>
              </div>
            ) : (
              <>
                {config.themas.gevoel && <TrendGrafiek titel="Gevoel — laatste 14 dagen" dataKey="gevoel" data={trendDagen} />}
                {config.themas.slaap && <TrendGrafiek titel="Slaap — laatste 14 dagen" dataKey="slaap" data={trendDagen} />}
                <MaandHeatmap entries={entries} />
                <ThemaTellingen entries={entries} themas={config.themas} />
              </>
            )}
          </>
        )}
      </div>

      {activeTaak && (
        <TaakModal
          taak={activeTaak}
          type="invullen"
          onSluit={() => setActiveTaak(null)}
          onVoltooid={() => { setActiveTaak(null); laad() }}
          onOvergeslagen={() => setActiveTaak(null)}
          onVerwijderd={() => setActiveTaak(null)}
        />
      )}
    </div>
  )
}
