import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSetting, setSetting } from '../store/db'
import { supabase } from '../store/supabase'
import { signOut } from '../store/auth'
import { Check, Cog, ChevronRight, HeartPulse, Download } from '../components/Iconen'

export default function Instellingen() {
  const navigate = useNavigate()
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [opgeslagen, setOpgeslagen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''))
    getSetting('naam').then(n => { if (n) setNaam(n) })
  }, [])

  async function opslaan() {
    await setSetting('naam', naam.trim())
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 1500)
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-green-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            Instellingen
            <Cog size={22} strokeWidth={2.5} />
          </h1>
          <p className="text-green-100 text-sm mt-1">Naam, gegevens en account</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Persoonlijk */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Persoonlijk</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
            <input
              type="text"
              value={naam}
              onChange={e => setNaam(e.target.value)}
              placeholder="bijv. Lars"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
            />
            <p className="text-gray-400 text-xs mt-1">Wordt gebruikt voor de begroeting op de hoofdpagina</p>
          </div>
          <button
            onClick={opslaan}
            disabled={opgeslagen}
            className="w-full bg-green-500 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {opgeslagen ? (
              <>
                <Check size={16} strokeWidth={2.5} />
                Opgeslagen
              </>
            ) : (
              'Naam opslaan'
            )}
          </button>
        </div>

        {/* Meer instellingen */}
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          <InstellingLink
            icoon={<HeartPulse size={18} />}
            kleur="text-green-600 bg-green-50"
            label="Basisgegevens"
            sublabel="Lengte, geslacht, beginstand"
            onClick={() => navigate('/basisgegevens')}
          />
          <InstellingLink
            icoon={<Download size={18} />}
            kleur="text-blue-600 bg-blue-50"
            label="Gegevens exporteren"
            sublabel="Download je data als CSV"
            onClick={() => navigate('/export')}
          />
        </div>

        {/* Account */}
        {email && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-1">Account</h2>
            <p className="text-gray-500 text-xs mb-3">Ingelogd als <span className="font-medium text-gray-700">{email}</span></p>
            <button
              onClick={async () => {
                if (!confirm('Weet je zeker dat je wilt uitloggen? Je data blijft bewaard in de cloud.')) return
                await signOut()
              }}
              className="w-full border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-xl"
            >
              Uitloggen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function InstellingLink({ icoon, kleur, label, sublabel, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${kleur}`}>
        {icoon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>
      </div>
      <ChevronRight size={18} className="text-gray-400 shrink-0" />
    </button>
  )
}
