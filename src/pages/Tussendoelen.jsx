import { useState, useEffect, useCallback } from 'react'
import { getSetting, setItem } from '../store/db'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { X, Repeat } from '../components/Iconen'
import {
  berekenTussendoelen,
  valideerDoelTempo,
  getHuidigeStand,
  vervangAutomatischeTussendoelen,
  LABELS,
} from '../store/tussendoelen'
import { formatDateKey } from '../store/taken'
import BottomModal from '../components/BottomModal'

function formatDatum(datumStr) {
  if (!datumStr) return ''
  const d = new Date(datumStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

const METRIC_TYPES = ['gewicht', 'vetPercentage', 'buikomvang']

function PreviewModal({ tussendoelen, validaties, onAnnuleer, onBevestig }) {
  const heeftWaarschuwing = Object.values(validaties).some(v => v && !v.ok)
  const heeftIets = tussendoelen.length > 0

  return (
    <BottomModal titel="Preview tussendoelen" onSluit={onAnnuleer}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Op basis van je huidige meting en doelen wordt een gezonde curve uitgestippeld:
          sneller in de eerste twee weken (vooral water), gestaag in het midden, en afvlakkend
          richting je einddoel.
        </p>

        {heeftWaarschuwing && (
          <div className="space-y-2">
            {METRIC_TYPES.map(t => {
              const v = validaties[t]
              if (!v || v.ok || !v.vanToepassing) return null
              return (
                <div key={t} className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-orange-700 text-sm font-medium">
                    {LABELS[t].naam} — tempo te hoog
                  </p>
                  <p className="text-orange-600 text-xs mt-1">
                    Je vraagt {v.huidigTempo} {LABELS[t].kort}/week. Gezond is max {v.maxTempo} {LABELS[t].kort}/week.
                    Overweeg een einddatum vanaf {formatDatum(v.suggestieDatum)} (≥ {v.minWeken} weken).
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {!heeftIets ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-gray-500 text-sm">Geen tussendoelen te genereren.</p>
            <p className="text-gray-400 text-xs mt-1">Controleer of je een huidige meting, doelen en een einddatum hebt ingesteld.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {tussendoelen.map(td => (
              <div key={td.id} className="px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-800">{formatDatum(td.datum)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {[
                    td.gewicht != null && `${td.gewicht} kg`,
                    td.vetPercentage != null && `${td.vetPercentage}%`,
                    td.buikomvang != null && `${td.buikomvang} cm`,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400">
          Bestaande handmatige tussendoelen blijven staan. Eerder gegenereerde automatische worden vervangen.
        </p>

        <div className="space-y-2">
          <button
            onClick={onBevestig}
            disabled={!heeftIets}
            className="w-full bg-accent-500 text-accent-fg font-medium py-3 rounded-xl disabled:opacity-50"
          >
            Bevestig en sla op
          </button>
          <button
            onClick={onAnnuleer}
            className="w-full text-gray-500 text-sm font-medium py-2"
          >
            Annuleren
          </button>
        </div>
      </div>
    </BottomModal>
  )
}

export default function Tussendoelen() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tussendoelen, setTussendoelen] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [foutPreview, setFoutPreview] = useState('')

  const laad = useCallback(async () => {
    const td = await getSetting('tussendoelen')
    setTussendoelen(td || [])
  }, [])

  useEffect(() => { laad() }, [laad])

  async function autoGenereer() {
    setFoutPreview('')
    const [huidig, doelen, einddoelDatum] = await Promise.all([
      getHuidigeStand(),
      getSetting('fysiekDoelen'),
      Promise.resolve().then(async () => {
        const d = await getSetting('fysiekDoelen')
        return d?.einddoelDatum
      }),
    ])

    if (!huidig) {
      setFoutPreview('Je hebt nog geen meting. Voeg eerst je huidige stand toe via Basisgegevens of Metingen.')
      return
    }
    if (!doelen?.einddoelDatum) {
      setFoutPreview('Stel eerst een einddatum in via Basisgegevens.')
      return
    }
    if (doelen.einddoelDatum <= formatDateKey(new Date())) {
      setFoutPreview('De einddatum ligt in het verleden — pas hem aan via Basisgegevens.')
      return
    }

    const startDatum = formatDateKey(new Date())
    const huidigStand = {
      gewicht: huidig.gewicht,
      vetPercentage: huidig.vetPercentage,
      buikomvang: huidig.buikomvang,
    }
    const doelStand = {
      gewicht: doelen.doelGewicht,
      vetPercentage: doelen.doelVet,
      buikomvang: doelen.doelBuik,
    }

    const dagenTotEind = Math.round(
      (new Date(doelen.einddoelDatum + 'T00:00:00') - new Date(startDatum + 'T00:00:00')) / (1000 * 60 * 60 * 24)
    )

    const validaties = {
      gewicht: valideerDoelTempo(huidigStand.gewicht, doelStand.gewicht, dagenTotEind, 'gewicht'),
      vetPercentage: valideerDoelTempo(huidigStand.vetPercentage, doelStand.vetPercentage, dagenTotEind, 'vetPercentage'),
      buikomvang: valideerDoelTempo(huidigStand.buikomvang, doelStand.buikomvang, dagenTotEind, 'buikomvang'),
    }

    const nieuwe = berekenTussendoelen({
      startDatum,
      eindDatum: doelen.einddoelDatum,
      huidig: huidigStand,
      doel: doelStand,
    })

    setPreviewData({ tussendoelen: nieuwe, validaties })
  }

  useEffect(() => {
    if (searchParams.get('genereer') === 'true') {
      autoGenereer()
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function bevestigPreview() {
    const updated = await vervangAutomatischeTussendoelen(previewData.tussendoelen)
    setTussendoelen(updated)
    setPreviewData(null)
  }

  async function verwijder(id) {
    if (!confirm('Weet je zeker dat je dit tussendoel wilt verwijderen?')) return
    const bestaand = await getSetting('tussendoelen') || []
    const nieuw = bestaand.filter(t => t.id !== id)
    await setItem('settings', 'tussendoelen', nieuw)
    setTussendoelen(nieuw)
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-accent-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-accent-fg text-2xl font-bold flex items-center gap-2">
            Tussendoelen
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </h1>
          <p className="text-accent-fg-soft text-sm mt-1">Mijlpalen op weg naar je einddoel</p>
        </div>
        <button
          onClick={() => navigate('/fysiek')}
          className="bg-accent-overlay text-accent-fg text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5 space-y-4">
        <p className="text-gray-500 text-sm">
          Tussendoelen verschijnen als punten op de doellijn in de grafieken. Zo zie je hoe je koers loopt richting je einddoel.
        </p>

        <div className="space-y-2">
          <button
            onClick={autoGenereer}
            className="w-full bg-accent-500 text-accent-fg font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Repeat size={16} strokeWidth={2.5} />
            Genereer automatisch
          </button>
          <button
            onClick={() => navigate('/tussendoel-toevoegen')}
            className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-xl text-sm"
          >
            + Tussendoel toevoegen
          </button>
          {foutPreview && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mt-2">
              <p className="text-orange-700 text-xs">{foutPreview}</p>
            </div>
          )}
        </div>

        {tussendoelen.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-gray-400 text-sm">Nog geen tussendoelen.</p>
            <p className="text-gray-300 text-xs mt-1">Genereer automatisch of voeg er handmatig één toe.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
            {tussendoelen.map(td => (
              <div key={td.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{formatDatum(td.datum)}</p>
                    {!td.automatisch && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">handmatig</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[
                      td.gewicht != null && `${td.gewicht} kg`,
                      td.vetPercentage != null && `${td.vetPercentage}%`,
                      td.buikomvang != null && `${td.buikomvang} cm`,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/tussendoel-bewerken/${encodeURIComponent(td.id)}`)}
                    className="text-gray-500 text-xs px-3 py-1.5 rounded-lg border border-gray-200"
                  >
                    Bewerk
                  </button>
                  <button
                    onClick={() => verwijder(td.id)}
                    aria-label="Verwijder tussendoel"
                    className="text-red-400 p-1.5 rounded-lg border border-red-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewData && (
        <PreviewModal
          tussendoelen={previewData.tussendoelen}
          validaties={previewData.validaties}
          onAnnuleer={() => setPreviewData(null)}
          onBevestig={bevestigPreview}
        />
      )}
    </div>
  )
}
