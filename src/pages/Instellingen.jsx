import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSetting, setSetting } from '../store/db'
import { supabase } from '../store/supabase'
import { signOut } from '../store/auth'
import { Check } from '../components/Iconen'

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
    setTimeout(() => navigate('/'), 800)
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="bg-green-500 px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            Instellingen
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </h1>
          <p className="text-green-100 text-sm mt-1">Naam en account</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full"
        >
          Sluiten
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">
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
        </div>

        {opgeslagen && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-center gap-2 text-green-700">
            <Check size={18} />
            <p className="font-medium">Opgeslagen</p>
          </div>
        )}

        <button
          onClick={opslaan}
          disabled={opgeslagen}
          className="w-full bg-green-500 text-white font-semibold py-4 rounded-xl text-base shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {opgeslagen ? (
            <>
              <Check size={18} strokeWidth={2.5} />
              Opgeslagen
            </>
          ) : (
            'Opslaan'
          )}
        </button>

        {email && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mt-2">
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
