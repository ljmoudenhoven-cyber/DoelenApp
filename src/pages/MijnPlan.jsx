import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSetting, setSetting } from '../store/db'
import { Check } from '../components/Iconen'
import {
  ACTIVITEIT_OPTIES,
  bouwPlan,
  berekenBMI,
  berekenBMR,
  berekenTDEE,
  gezondeBmiBereik,
  getPlannen,
  voegPlanToe,
  verwijderOudePlannen,
  getHuidigeStand,
} from '../store/doelplan'
import { formatDateKey } from '../store/taken'
import BottomModal from '../components/BottomModal'

function formatDatum(datumStr) {
  if (!datumStr) return ''
  const d = new Date(datumStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function PreviewModal({ resultaat, mode, onAnnuleer, onBevestig }) {
  if (!resultaat) return null

  if (resultaat.onmogelijk) {
    return (
      <BottomModal titel="Plan kan niet worden gemaakt" onSluit={onAnnuleer}>
        <div className="space-y-3">
          {(resultaat.waarschuwingen || []).map((w, i) => (
            <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-700 text-sm">{w.bericht}</p>
            </div>
          ))}
          <button onClick={onAnnuleer} className="w-full text-gray-500 text-sm font-medium py-2">
            Sluiten
          </button>
        </div>
      </BottomModal>
    )
  }

  const { plan, waarschuwingen } = resultaat
  return (
    <BottomModal titel="Voorgesteld plan" onSluit={onAnnuleer}>
      <div className="space-y-4">
        <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 space-y-1">
          <p className="text-xs text-accent-600 font-medium uppercase tracking-wide">
            {mode === 'doelgewicht' ? 'Berekende einddatum' : 'Berekend doelgewicht'}
          </p>
          <p className="text-2xl font-bold text-accent-700">
            {mode === 'doelgewicht'
              ? formatDatum(plan.eindDatum)
              : `${plan.doelGewicht} kg`}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Van {plan.startGewicht} kg naar {plan.doelGewicht} kg • {plan.tussendoelen.length + 1} mijlpalen •
            gemiddeld {plan.gemTempo} kg/week
          </p>
        </div>

        {waarschuwingen && waarschuwingen.length > 0 && (
          <div className="space-y-2">
            {waarschuwingen.map((w, i) => {
              const stijl = w.type === 'fout'
                ? 'bg-red-50 border-red-200 text-red-700'
                : w.type === 'waarschuwing'
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              return (
                <div key={i} className={`border rounded-xl p-3 ${stijl}`}>
                  <p className="text-xs">{w.bericht}</p>
                </div>
              )
            })}
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tussendoelen elke 2 weken</p>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {plan.tussendoelen.map(td => (
              <div key={td.datum} className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">{formatDatum(td.datum)}</span>
                <span className="text-sm font-semibold text-gray-800">{td.gewicht} kg</span>
              </div>
            ))}
            <div className="px-4 py-2 flex items-center justify-between bg-accent-50">
              <span className="text-xs text-accent-700 font-medium">Einddoel — {formatDatum(plan.eindDatum)}</span>
              <span className="text-sm font-bold text-accent-700">{plan.doelGewicht} kg</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-400">
          Bij bevestigen wordt dit als nieuw plan opgeslagen. Eerdere plannen blijven bewaard
          voor de geschiedenis op je grafieken.
        </p>

        <div className="space-y-2">
          <button onClick={onBevestig} className="w-full bg-accent-500 text-accent-fg font-medium py-3 rounded-xl">
            Bevestig en sla op
          </button>
          <button onClick={onAnnuleer} className="w-full text-gray-500 text-sm font-medium py-2">
            Annuleren
          </button>
        </div>
      </div>
    </BottomModal>
  )
}

export default function MijnPlan() {
  const navigate = useNavigate()
  const [lengte, setLengte] = useState('')
  const [geslacht, setGeslacht] = useState('')
  const [leeftijd, setLeeftijd] = useState('')
  const [activiteit, setActiviteit] = useState('licht')
  const [huidigeMeting, setHuidigeMeting] = useState(null)
  const [plannen, setPlannen] = useState([])

  const [mode, setMode] = useState('doelgewicht')
  const [doelGewichtInput, setDoelGewichtInput] = useState('')
  const [eindDatumInput, setEindDatumInput] = useState('')

  const [previewResultaat, setPreviewResultaat] = useState(null)
  const [fout, setFout] = useState('')
  const [opgeslagen, setOpgeslagen] = useState(false)

  const laad = useCallback(async () => {
    const [l, g, lt, a, m, p] = await Promise.all([
      getSetting('lengte'),
      getSetting('geslacht'),
      getSetting('leeftijd'),
      getSetting('activiteitsniveau'),
      getHuidigeStand(),
      getPlannen(),
    ])
    if (l) setLengte(String(l))
    if (g) setGeslacht(g)
    if (lt) setLeeftijd(String(lt))
    if (a) setActiviteit(a)
    setHuidigeMeting(m)
    setPlannen(p)
  }, [])

  useEffect(() => { laad() }, [laad])

  async function bewaarBasisgegevens() {
    if (!lengte || parseInt(lengte) < 100 || parseInt(lengte) > 250) {
      setFout('Vul een geldige lengte in (100–250 cm).')
      return false
    }
    if (!leeftijd || parseInt(leeftijd) < 12 || parseInt(leeftijd) > 110) {
      setFout('Vul een geldige leeftijd in (12–110 jaar).')
      return false
    }
    if (!geslacht) {
      setFout('Kies een geslacht (nodig voor BMR-berekening).')
      return false
    }
    setFout('')
    await setSetting('lengte', parseInt(lengte))
    await setSetting('geslacht', geslacht)
    await setSetting('leeftijd', parseInt(leeftijd))
    await setSetting('activiteitsniveau', activiteit)
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 1500)
    return true
  }

  async function genereerPlan() {
    if (!await bewaarBasisgegevens()) return
    if (!huidigeMeting?.gewicht) {
      setFout('Voeg eerst een meting toe op de Metingen-pagina zodat we je huidige gewicht weten.')
      return
    }
    const basisData = {
      lengte: parseInt(lengte),
      geslacht,
      leeftijd: parseInt(leeftijd),
      activiteitsniveau: activiteit,
    }

    if (mode === 'doelgewicht') {
      const dg = parseFloat(doelGewichtInput)
      if (!dg || dg <= 0) {
        setFout('Vul een streefgewicht in.')
        return
      }
      if (Math.abs(huidigeMeting.gewicht - dg) < 0.5) {
        setFout('Streefgewicht ligt te dicht bij je huidige gewicht.')
        return
      }
      const r = bouwPlan({
        mode: 'doelgewicht',
        startGewicht: huidigeMeting.gewicht,
        doelGewicht: dg,
        basisData,
      })
      setPreviewResultaat(r)
    } else {
      if (!eindDatumInput) {
        setFout('Kies een streefdatum.')
        return
      }
      if (eindDatumInput <= formatDateKey(new Date())) {
        setFout('De streefdatum moet in de toekomst liggen.')
        return
      }
      const r = bouwPlan({
        mode: 'einddatum',
        startGewicht: huidigeMeting.gewicht,
        eindDatum: eindDatumInput,
        basisData,
      })
      setPreviewResultaat(r)
    }
  }

  async function bevestigPlan() {
    if (!previewResultaat?.plan) return
    const updated = await voegPlanToe(previewResultaat.plan)
    setPlannen(updated)
    setPreviewResultaat(null)
    setDoelGewichtInput('')
    setEindDatumInput('')
  }

  async function verwijderHistorie() {
    if (!confirm('Alle eerdere plannen verwijderen? Alleen je huidige actieve plan blijft staan.')) return
    const updated = await verwijderOudePlannen()
    setPlannen(updated)
  }

  const lengteN = parseInt(lengte) || null
  const huidigGewicht = huidigeMeting?.gewicht
  const huidigBmi = berekenBMI(huidigGewicht, lengteN)
  const huidigeBmr = berekenBMR({
    gewicht: huidigGewicht,
    lengte: lengteN,
    leeftijd: parseInt(leeftijd) || null,
    geslacht,
  })
  const huidigeTdee = berekenTDEE(huidigeBmr, activiteit)
  const gezondBereik = lengteN ? gezondeBmiBereik(lengteN) : null

  const actievePlan = plannen.length > 0 ? plannen[plannen.length - 1] : null

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-accent-fg text-2xl font-bold">Mijn plan</h1>
          <p className="text-accent-fg-soft text-sm mt-1">Basisgegevens en doelen op één plek</p>
        </div>
        <button
          onClick={() => navigate('/fysiek')}
          className="bg-accent-overlay text-accent-fg text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Basisgegevens */}
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-3">Basisgegevens</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lengte (cm)</label>
              <input
                type="number"
                inputMode="numeric"
                value={lengte}
                onChange={e => { setLengte(e.target.value); setFout('') }}
                placeholder="bijv. 182"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leeftijd (jaar)</label>
              <input
                type="number"
                inputMode="numeric"
                value={leeftijd}
                onChange={e => { setLeeftijd(e.target.value); setFout('') }}
                placeholder="bijv. 35"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Geslacht</label>
              <div className="flex gap-3">
                {['Man', 'Vrouw'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGeslacht(g)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      geslacht === g
                        ? 'bg-accent-500 text-accent-fg border-accent-500'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activiteitsniveau</label>
              <div className="space-y-2">
                {ACTIVITEIT_OPTIES.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setActiviteit(o.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      activiteit === o.id
                        ? 'bg-accent-50 text-accent-700 border-accent-300'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-xs text-gray-500">Huidig gewicht (uit laatste meting)</p>
              <p className="text-sm font-semibold text-gray-800">
                {huidigGewicht ? `${huidigGewicht} kg` : '— nog geen meting'}
                {huidigBmi && <span className="text-gray-400 font-normal ml-2">BMI {huidigBmi}</span>}
              </p>
              {lengteN && (() => {
                const m = lengteN / 100
                const midden = Math.round(22 * m * m)
                const onder = Math.round(20 * m * m)
                const boven = Math.round(24 * m * m)
                return (
                  <>
                    <p className="text-xs text-gray-500">
                      Streefdoel rond {midden} kg (BMI 22, midden van gezond)
                    </p>
                    <p className="text-xs text-gray-500">
                      Praktisch gezond bereik: {onder}–{boven} kg (BMI 20–24)
                    </p>
                  </>
                )
              })()}
              {huidigeTdee && (
                <p className="text-xs text-gray-500">
                  Onderhoudsbehoefte (TDEE): ~{Math.round(huidigeTdee)} kcal/dag
                </p>
              )}
            </div>

            <button
              onClick={bewaarBasisgegevens}
              className="w-full bg-accent-500 text-accent-fg font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Check size={16} strokeWidth={2.5} />
              {opgeslagen ? 'Opgeslagen' : 'Basisgegevens opslaan'}
            </button>
          </div>
        </section>

        {/* Mijn doel */}
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-3">Mijn doel</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Wat wil je doen?</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'doelgewicht', label: 'Streefgewicht halen' },
                  { id: 'einddatum', label: 'Tegen een datum' },
                ].map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setMode(o.id)}
                    className={`py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                      mode === o.id
                        ? 'bg-accent-500 text-accent-fg border-accent-500'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'doelgewicht' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Streefgewicht (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={doelGewichtInput}
                  onChange={e => { setDoelGewichtInput(e.target.value); setFout('') }}
                  placeholder="bijv. 78"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  De app berekent automatisch een realistische einddatum op basis van een gezond tempo.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Streefdatum</label>
                <input
                  type="date"
                  value={eindDatumInput}
                  min={formatDateKey(new Date())}
                  onChange={e => { setEindDatumInput(e.target.value); setFout('') }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  De app berekent een realistisch streefgewicht passend bij deze datum.
                </p>
              </div>
            )}

            {fout && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-700 text-xs">{fout}</p>
              </div>
            )}

            <button
              onClick={genereerPlan}
              className="w-full bg-accent-500 text-accent-fg font-semibold py-3 rounded-xl text-sm"
            >
              Genereer plan
            </button>
          </div>
        </section>

        {/* Huidig plan */}
        {actievePlan && (
          <section>
            <h2 className="text-gray-800 font-semibold text-base mb-3">Huidig plan</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Sinds {formatDatum(actievePlan.gegenereerdOp)}</p>
                <p className="text-base font-semibold text-gray-800">
                  {actievePlan.startGewicht} kg → {actievePlan.doelGewicht} kg
                </p>
                <p className="text-xs text-gray-500">
                  Op {formatDatum(actievePlan.eindDatum)} • ~{actievePlan.gemTempo} kg/week
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl divide-y divide-gray-200 max-h-48 overflow-y-auto">
                {actievePlan.tussendoelen.map(td => (
                  <div key={td.datum} className="px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDatum(td.datum)}</span>
                    <span className="text-sm font-semibold text-gray-700">{td.gewicht} kg</span>
                  </div>
                ))}
              </div>

              {plannen.length > 1 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Je hebt {plannen.length} plannen in je geschiedenis.</p>
                  <button
                    onClick={verwijderHistorie}
                    className="w-full text-red-500 text-sm font-medium py-2 border border-red-200 rounded-xl"
                  >
                    Verwijder oude plannen
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

      </div>

      {previewResultaat && (
        <PreviewModal
          resultaat={previewResultaat}
          mode={mode}
          onAnnuleer={() => setPreviewResultaat(null)}
          onBevestig={bevestigPlan}
        />
      )}
    </div>
  )
}
