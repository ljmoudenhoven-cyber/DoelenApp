import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MetingFormulier from '../components/formulieren/MetingFormulier'
import { getItem } from '../store/db'

export default function MetingToevoegen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isBewerken = Boolean(id)
  const [bestaand, setBestaand] = useState(null)
  const [geladen, setGeladen] = useState(!isBewerken)

  useEffect(() => {
    async function laad() {
      if (!isBewerken) return
      const m = await getItem('metingen', decodeURIComponent(id))
      setBestaand(m)
      setGeladen(true)
    }
    laad()
  }, [id, isBewerken])

  function terug() {
    navigate(isBewerken ? '/metingen' : '/fysiek')
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-green-500 px-5 pt-14 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">
            {isBewerken ? 'Meting bewerken ✏️' : 'Meting toevoegen 📏'}
          </h1>
          <p className="text-green-100 text-sm mt-1">
            {isBewerken ? 'Pas gewicht, vet% of buikomvang aan' : 'Vul je gewicht, vet% en buikomvang in'}
          </p>
        </div>
        <button
          onClick={terug}
          className="bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          {!geladen ? (
            <p className="text-gray-400 text-sm text-center py-6">Laden...</p>
          ) : isBewerken && !bestaand ? (
            <p className="text-gray-400 text-sm text-center py-6">Meting niet gevonden.</p>
          ) : (
            <MetingFormulier
              manueel={!isBewerken}
              bestaand={bestaand}
              onVoltooid={terug}
            />
          )}
        </div>
      </div>
    </div>
  )
}
