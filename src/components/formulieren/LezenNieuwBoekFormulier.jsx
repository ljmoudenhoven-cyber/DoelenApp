import { useState } from 'react'
import { setItem } from '../../store/db'
import { taakAfvinken } from '../../store/taken'

export default function LezenNieuwBoekFormulier({ taak, onVoltooid }) {
  const [titel, setTitel] = useState('')
  const [paginas, setPaginas] = useState('')
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  async function opslaan() {
    if (!titel.trim() || !paginas) {
      setFout('Vul de titel en het aantal pagina\'s in.')
      return
    }
    setBezig(true)

    const nu = new Date()
    const maandKey = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}`

    const boek = {
      id: `boek-${maandKey}`,
      titel: titel.trim(),
      totaalPaginas: parseInt(paginas),
      huidigePagina: 0,
      maand: maandKey,
      gestart: taak.datum,
      ingevoerdOp: new Date().toISOString(),
    }

    await setItem('lezen', boek.id, boek)
    await setItem('settings', 'huidigBoek', boek)
    await taakAfvinken(taak.id)
    onVoltooid()
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">Welk boek ga je deze maand lezen?</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Boektitel</label>
        <input
          type="text"
          value={titel}
          onChange={e => setTitel(e.target.value)}
          placeholder="bijv. Atomic Habits"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aantal pagina's</label>
        <input
          type="number"
          inputMode="numeric"
          value={paginas}
          onChange={e => setPaginas(e.target.value)}
          placeholder="bijv. 320"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
        />
      </div>

      {fout && <p className="text-red-500 text-xs">{fout}</p>}

      <button
        onClick={opslaan}
        disabled={bezig}
        className="w-full bg-accent-500 text-white font-medium py-3 rounded-xl disabled:opacity-50"
      >
        {bezig ? 'Opslaan...' : 'Boek toevoegen'}
      </button>
    </div>
  )
}
