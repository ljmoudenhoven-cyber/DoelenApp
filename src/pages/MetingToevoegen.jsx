import { useNavigate } from 'react-router-dom'
import MetingFormulier from '../components/formulieren/MetingFormulier'

export default function MetingToevoegen() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-green-500 px-5 pt-14 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Meting toevoegen 📏</h1>
          <p className="text-green-100 text-sm mt-1">Vul je gewicht, vet% en buikomvang in</p>
        </div>
        <button
          onClick={() => navigate('/fysiek')}
          className="bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <MetingFormulier
            manueel={true}
            onVoltooid={() => navigate('/fysiek')}
          />
        </div>
      </div>
    </div>
  )
}
