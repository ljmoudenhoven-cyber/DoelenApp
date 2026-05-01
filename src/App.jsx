import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Hoofdpagina from './pages/Hoofdpagina'
import Fysiek from './pages/Fysiek'
import Sport from './pages/Sport'
import Lezen from './pages/Lezen'
import Export from './pages/Export'
import Instellingen from './pages/Instellingen'
import Basisgegevens from './pages/Basisgegevens'
import Tussendoelen from './pages/Tussendoelen'
import MetingToevoegen from './pages/MetingToevoegen'
import Metingen from './pages/Metingen'
import TussendoelToevoegen from './pages/TussendoelToevoegen'
import Login from './pages/Login'
import { genereerWekelijkseTaken } from './store/taken'
import { getSetting, setItem } from './store/db'
import { genereerSportSchema } from './store/sportSchema'
import { useAuth } from './store/auth'
import { pullAll, clearLocalData } from './store/sync'
import { Sprout } from './components/Iconen'

function NavIcon({ children }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

function NavBar() {
  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-green-600' : 'text-gray-400'}`

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 z-50"
      style={{
        paddingTop: 'calc(0.5rem + env(safe-area-inset-bottom) / 2)',
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom) / 2)',
      }}
    >
      <div className="flex justify-around items-center">
        <NavLink to="/" end className={linkClass}>
          <NavIcon>
            <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>
          </NavIcon>
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>
        <NavLink to="/fysiek" className={linkClass}>
          <NavIcon>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
            <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
          </NavIcon>
          <span className="text-[10px] font-medium">Fysiek</span>
        </NavLink>
        <NavLink to="/sport" className={linkClass}>
          <NavIcon>
            <path d="M14.4 14.4 9.6 9.6"/>
            <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
            <path d="m21.5 21.5-1.4-1.4"/>
            <path d="M3.9 3.9 2.5 2.5"/>
            <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>
          </NavIcon>
          <span className="text-[10px] font-medium">Sport</span>
        </NavLink>
        <NavLink to="/lezen" className={linkClass}>
          <NavIcon>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </NavIcon>
          <span className="text-[10px] font-medium">Lezen</span>
        </NavLink>
        <NavLink to="/export" className={linkClass}>
          <NavIcon>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </NavIcon>
          <span className="text-[10px] font-medium">Export</span>
        </NavLink>
      </div>
    </nav>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-green-600 animate-pulse">
        <Sprout size={48} strokeWidth={1.5} />
      </div>
    </div>
  )
}

function AppInner() {
  const navigate = useNavigate()
  const { user, geladen: authGeladen } = useAuth()
  const [vorigeUserId, setVorigeUserId] = useState(null)
  const [dataGeladen, setDataGeladen] = useState(false)

  useEffect(() => {
    if (!authGeladen) return

    if (!user) {
      if (vorigeUserId) {
        clearLocalData().finally(() => {
          setVorigeUserId(null)
          setDataGeladen(false)
        })
      } else {
        setDataGeladen(false)
      }
      return
    }

    if (user.id === vorigeUserId && dataGeladen) return

    async function init() {
      setDataGeladen(false)
      await pullAll()

      const lengte = await getSetting('lengte')
      if (!lengte) {
        navigate('/basisgegevens')
      }

      const bestaandSchema = await getSetting('sportSchema')
      if (!bestaandSchema) {
        const schema = genereerSportSchema()
        await setItem('settings', 'sportSchema', schema)
      }

      await genereerWekelijkseTaken()
      setVorigeUserId(user.id)
      setDataGeladen(true)
    }
    init()
  }, [authGeladen, user, vorigeUserId, dataGeladen, navigate])

  if (!authGeladen) return <Spinner />
  if (!user) return <Login />
  if (!dataGeladen) return <Spinner />

  return (
    <div className="flex flex-col min-h-dvh pb-24">
      <Routes>
        <Route path="/" element={<Hoofdpagina />} />
        <Route path="/fysiek" element={<Fysiek />} />
        <Route path="/sport" element={<Sport />} />
        <Route path="/lezen" element={<Lezen />} />
        <Route path="/export" element={<Export />} />
        <Route path="/instellingen" element={<Instellingen />} />
        <Route path="/basisgegevens" element={<Basisgegevens />} />
        <Route path="/tussendoelen" element={<Tussendoelen />} />
        <Route path="/tussendoel-toevoegen" element={<TussendoelToevoegen />} />
        <Route path="/tussendoel-bewerken/:id" element={<TussendoelToevoegen />} />
        <Route path="/metingen" element={<Metingen />} />
        <Route path="/meting-toevoegen" element={<MetingToevoegen />} />
        <Route path="/meting-bewerken/:id" element={<MetingToevoegen />} />
      </Routes>
      <NavBar />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
