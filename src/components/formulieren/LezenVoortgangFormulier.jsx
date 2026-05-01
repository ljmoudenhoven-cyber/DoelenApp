import { useState, useEffect } from 'react'
import { getSetting, setItem } from '../../store/db'
import { taakAfvinken } from '../../store/taken'

export default function LezenVoortgangFormulier({ taak, onVoltooid }) {
  const [huidigPagina, setHuidigPagina] = useState('')
  const [boek, setBoek] = useState(null)
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    getSetting('huidigBoek').then(b => { if (b) setBoek(b) })
  }, [])

  async function opslaan() {
    if (!huidigPagina) { setFout('Vul je huidige pagina in.'); return }
    setBezig(true)

    const voortgang = {
      id: `lezen-voortgang-${taak.datum}`,
      datum: taak.datum,
      pagina: parseInt(huidigPagina),
      boekTitel: boek?.titel,
      totaalPaginas: boek?.totaalPaginas,
      ingevoerdOp: new Date().toISOString(),
    }

    await setItem('lezen', voortgang.id, voortgang)

    // Boek bijwerken
    if (boek) {
      await setItem('settings', 'huidigBoek', { ...boek, huidigePagina: parseInt(huidigPagina) })
    }

    await taakAfvinken(taak.id)
    onVoltooid()
  }

  const procent = boek && huidigPagina
    ? Math.round((parseInt(huidigPagina) / boek.totaalPaginas) * 100)
    : null

  return (
    <div className="space-y-4">
      {boek && (
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-blue-800 font-medium text-sm">{boek.titel}</p>
          <p className="text-blue-600 text-xs">{boek.totaalPaginas} pagina's totaal</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Op welke pagina ben je nu?</label>
        <input
          type="number"
          inputMode="numeric"
          value={huidigPagina}
          onChange={e => setHuidigPagina(e.target.value)}
          placeholder={`bijv. ${boek ? Math.round(boek.totaalPaginas * 0.5) : 150}`}
          max={boek?.totaalPaginas}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
        />
        {procent !== null && (
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${procent}%` }} />
            </div>
            <p className="text-blue-600 text-xs mt-1">{procent}% gelezen</p>
          </div>
        )}
      </div>

      {fout && <p className="text-red-500 text-xs">{fout}</p>}

      <button
        onClick={opslaan}
        disabled={bezig}
        className="w-full bg-accent-500 text-white font-medium py-3 rounded-xl disabled:opacity-50"
      >
        {bezig ? 'Opslaan...' : 'Voortgang opslaan'}
      </button>
    </div>
  )
}
