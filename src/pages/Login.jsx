import { useState } from 'react'
import { stuurInlogCode, verifieerInlogCode } from '../store/auth'
import { Sprout, Mail } from '../components/Iconen'

export default function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [stap, setStap] = useState('email')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  async function versturenEmail(e) {
    e.preventDefault()
    setFout('')
    if (!email || !email.includes('@')) {
      setFout('Vul een geldig e-mailadres in')
      return
    }
    setBezig(true)
    try {
      await stuurInlogCode(email.trim())
      setStap('code')
    } catch (err) {
      setFout(err.message || 'Er ging iets mis. Probeer opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  async function versturenCode(e) {
    e.preventDefault()
    setFout('')
    const opgeschoond = code.replace(/\D/g, '')
    if (opgeschoond.length < 6 || opgeschoond.length > 8) {
      setFout('De code bestaat uit 6 tot 8 cijfers')
      return
    }
    setBezig(true)
    try {
      await verifieerInlogCode(email.trim(), opgeschoond)
    } catch (err) {
      setFout(err.message || 'Code is ongeldig of verlopen.')
      setBezig(false)
    }
  }

  function terug() {
    setStap('email')
    setCode('')
    setFout('')
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-b from-accent-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-100 text-accent-600 flex items-center justify-center mb-4">
          <Sprout size={36} strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">DoelenApp</h1>
        <p className="text-gray-500 text-sm mb-8">Log in om je data te synchroniseren</p>

        {stap === 'email' ? (
          <form onSubmit={versturenEmail} className="w-full max-w-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setFout('') }}
                placeholder="jij@voorbeeld.nl"
                autoComplete="email"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
              />
            </div>

            {fout && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{fout}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={bezig}
              className="w-full bg-accent-500 text-accent-fg font-semibold py-4 rounded-xl text-base shadow-sm disabled:opacity-50"
            >
              {bezig ? 'Versturen…' : 'Stuur inlogcode'}
            </button>
            <p className="text-gray-400 text-xs text-center">
              Geen wachtwoord nodig — je krijgt een inlogcode in je mail.
            </p>
          </form>
        ) : (
          <form onSubmit={versturenCode} className="w-full max-w-sm space-y-4">
            <div className="bg-white border border-accent-200 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center mx-auto mb-2">
                <Mail size={20} strokeWidth={1.75} />
              </div>
              <p className="text-gray-600 text-sm">
                We hebben een code gestuurd naar
              </p>
              <p className="font-medium text-gray-800 text-sm mt-0.5">{email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inlogcode uit de mail</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 8)); setFout('') }}
                placeholder="123456"
                autoComplete="one-time-code"
                autoFocus
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-accent-500"
              />
            </div>

            {fout && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{fout}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={bezig || code.length < 6}
              className="w-full bg-accent-500 text-accent-fg font-semibold py-4 rounded-xl text-base shadow-sm disabled:opacity-50"
            >
              {bezig ? 'Inloggen…' : 'Inloggen'}
            </button>

            <button
              type="button"
              onClick={terug}
              className="w-full text-gray-500 text-sm font-medium py-2"
            >
              Ander e-mailadres gebruiken
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
