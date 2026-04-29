import { useState } from 'react'
import { signInMetMagicLink } from '../store/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [fout, setFout] = useState('')

  async function versturen(e) {
    e.preventDefault()
    setFout('')
    if (!email || !email.includes('@')) {
      setFout('Vul een geldig e-mailadres in')
      return
    }
    setStatus('verzenden')
    try {
      await signInMetMagicLink(email.trim())
      setStatus('verzonden')
    } catch (err) {
      setFout(err.message || 'Er ging iets mis. Probeer opnieuw.')
      setStatus('idle')
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-b from-green-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4">🌱</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">DoelenApp</h1>
        <p className="text-gray-500 text-sm mb-8">Log in om je data te synchroniseren</p>

        {status === 'verzonden' ? (
          <div className="w-full max-w-sm bg-white border border-green-200 rounded-2xl p-6 shadow-sm text-center">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="font-semibold text-gray-800 mb-2">Check je mail</h2>
            <p className="text-gray-500 text-sm">
              We hebben een inloglink gestuurd naar <span className="font-medium text-gray-700">{email}</span>.
              Klik op de link in de mail om in te loggen.
            </p>
            <button
              onClick={() => { setStatus('idle'); setEmail('') }}
              className="mt-5 text-green-600 text-sm font-medium"
            >
              Ander e-mailadres
            </button>
          </div>
        ) : (
          <form onSubmit={versturen} className="w-full max-w-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setFout('') }}
                placeholder="jij@voorbeeld.nl"
                autoComplete="email"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500"
              />
            </div>

            {fout && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{fout}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'verzenden'}
              className="w-full bg-green-500 text-white font-semibold py-4 rounded-xl text-base shadow-sm disabled:opacity-50"
            >
              {status === 'verzenden' ? 'Versturen…' : 'Stuur inloglink'}
            </button>
            <p className="text-gray-400 text-xs text-center">
              Geen wachtwoord nodig — je krijgt een link in je mail.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
