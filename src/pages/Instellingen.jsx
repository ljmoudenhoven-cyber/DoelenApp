import { useState, useEffect } from 'react'
import { getSetting, setSetting, setItem } from '../store/db'
import { useNavigate } from 'react-router-dom'

function berekenBMI(gewicht, lengte) {
  if (!gewicht || !lengte) return null
  const l = lengte / 100
  return Math.round((gewicht / (l * l)) * 10) / 10
}

export default function Instellingen() {
  const navigate = useNavigate()
  const [lengte, setLengte] = useState('')
  const [geslacht, setGeslacht] = useState('')
  // Beginstand
  const [beginGewicht, setBeginGewicht] = useState('')
  const [beginVet, setBeginVet] = useState('')
  const [beginBuik, setBeginBuik] = useState('')
  // Doelen
  const [doelGewicht, setDoelGewicht] = useState('')
  const [doelVet, setDoelVet] = useState('')
  const [doelBuik, setDoelBuik] = useState('')
  const [einddoelDatum, setEinddoelDatum] = useState('')

  const [opgeslagen, setOpgeslagen] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    async function laad() {
      const [l, g, doelen] = await Promise.all([
        getSetting('lengte'),
        getSetting('geslacht'),
        getSetting('fysiekDoelen'),
      ])
      if (l) setLengte(String(l))
      if (g) setGeslacht(g)
      if (doelen) {
        if (doelen.doelGewicht) setDoelGewicht(String(doelen.doelGewicht))
        if (doelen.doelVet) setDoelVet(String(doelen.doelVet))
        if (doelen.doelBuik) setDoelBuik(String(doelen.doelBuik))
        if (doelen.einddoelDatum) setEinddoelDatum(doelen.einddoelDatum)
      }
    }
    laad()
  }, [])

  async function opslaan() {
    if (!lengte || parseInt(lengte) < 100 || parseInt(lengte) > 250) {
      setFout('Vul een geldige lengte in (100–250 cm).')
      return
    }

    const l = parseInt(lengte)
    await setSetting('lengte', l)
    if (geslacht) await setSetting('geslacht', geslacht)

    // Doelen opslaan
    await setItem('settings', 'fysiekDoelen', {
      doelGewicht: doelGewicht ? parseFloat(doelGewicht) : null,
      doelVet: doelVet ? parseFloat(doelVet) : null,
      doelBuik: doelBuik ? parseFloat(doelBuik) : null,
      einddoelDatum: einddoelDatum || null,
    })

    // Beginstand opslaan als eerste meting (alleen als ingevuld)
    if (beginGewicht && beginVet && beginBuik) {
      const vandaag = new Date().toISOString().split('T')[0]
      const bmi = berekenBMI(parseFloat(beginGewicht), l)
      const beginMeting = {
        id: `meting-beginstand-${vandaag}`,
        datum: vandaag,
        gewicht: parseFloat(beginGewicht),
        vetPercentage: parseFloat(beginVet),
        buikomvang: parseFloat(beginBuik),
        bmi,
        beginstand: true,
        ingevoerdOp: new Date().toISOString(),
      }
      await setItem('metingen', beginMeting.id, beginMeting)
    }

    setOpgeslagen(true)
    setTimeout(() => navigate('/'), 1000)
  }

  const vandaag = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-green-500 px-5 pt-14 pb-6">
        <h1 className="text-white text-2xl font-bold">Instellingen ⚙️</h1>
        <p className="text-green-100 text-sm mt-1">Jouw basisgegevens</p>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Persoonsgegevens */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Persoonsgegevens</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lichaamslengte (cm) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={lengte}
              onChange={e => { setLengte(e.target.value); setFout('') }}
              placeholder="bijv. 182"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            />
            <p className="text-gray-400 text-xs mt-1">Nodig voor BMI-berekening</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Geslacht</label>
            <div className="flex gap-3">
              {['Man', 'Vrouw'].map(g => (
                <button
                  key={g}
                  onClick={() => setGeslacht(g)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    geslacht === g
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-1">Wordt gebruikt voor interpretatie van vetpercentage</p>
          </div>
        </div>

        {/* Beginstand */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Beginstand</h2>
            <p className="text-gray-400 text-xs mt-1">
              Vul je huidige metingen in — dit wordt je startpunt in de grafieken
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Huidig gewicht (kg)</label>
            <input type="number" inputMode="decimal" step="0.1" value={beginGewicht}
              onChange={e => setBeginGewicht(e.target.value)} placeholder="bijv. 88"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Huidig vetpercentage (%)</label>
            <input type="number" inputMode="decimal" step="0.1" value={beginVet}
              onChange={e => setBeginVet(e.target.value)} placeholder="bijv. 22"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Huidige buikomvang (cm)</label>
            <input type="number" inputMode="decimal" step="0.5" value={beginBuik}
              onChange={e => setBeginBuik(e.target.value)} placeholder="bijv. 96"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          </div>
        </div>

        {/* Doelen */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Doelen</h2>
            <p className="text-gray-400 text-xs mt-1">Zichtbaar als doellijn in de grafieken</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doelgewicht (kg)</label>
            <input type="number" inputMode="decimal" step="0.5" value={doelGewicht}
              onChange={e => setDoelGewicht(e.target.value)} placeholder="bijv. 80"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doelvetpercentage (%)</label>
            <input type="number" inputMode="decimal" step="0.5" value={doelVet}
              onChange={e => setDoelVet(e.target.value)} placeholder="bijv. 16"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doelbuikomvang (cm)</label>
            <input type="number" inputMode="decimal" step="0.5" value={doelBuik}
              onChange={e => setDoelBuik(e.target.value)} placeholder="bijv. 88"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wanneer wil je je doel bereiken?</label>
            <input type="date" value={einddoelDatum} min={vandaag}
              onChange={e => setEinddoelDatum(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
            <p className="text-gray-400 text-xs mt-1">Dit bepaalt het eindpunt van de doellijn in de grafiek</p>
          </div>
        </div>

        {fout && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{fout}</p>
          </div>
        )}

        {opgeslagen && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-green-700 font-medium">Opgeslagen! ✅</p>
          </div>
        )}

        <button
          onClick={opslaan}
          disabled={opgeslagen}
          className="w-full bg-green-500 text-white font-semibold py-4 rounded-xl text-base shadow-sm disabled:opacity-50"
        >
          Opslaan & starten
        </button>
      </div>
    </div>
  )
}
