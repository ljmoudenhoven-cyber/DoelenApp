import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Hoofdpagina from './pages/Hoofdpagina'
import Fysiek from './pages/Fysiek'
import Sport from './pages/Sport'
import Lezen from './pages/Lezen'
import Export from './pages/Export'
import Instellingen from './pages/Instellingen'
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

function NavBar() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 flex justify-around items-center py-2 pb-safe z-50">
      <NavLink to="/" end className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-green-600' : 'text-gray-400'}`
      }>
        <span className="text-xl">🏠</span>
        <span className="text-[10px] font-medium">Home</span>
      </NavLink>
      <NavLink to="/fysiek" className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-green-600' : 'text-gray-400'}`
      }>
        <span className="text-xl">💪</span>
        <span className="text-[10px] font-medium">Fysiek</span>
      </NavLink>
      <NavLink to="/sport" className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-green-600' : 'text-gray-400'}`
      }>
        <span className="text-xl">🏃</span>
        <span className="text-[10px] font-medium">Sport</span>
      </NavLink>
      <NavLink to="/lezen" className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-green-600' : 'text-gray-400'}`
      }>
        <span className="text-xl">📚</span>
        <span className="text-[10px] font-medium">Lezen</span>
      </NavLink>
      <NavLink to="/export" className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-green-600' : 'text-gray-400'}`
      }>
        <span className="text-xl">📤</span>
        <span className="text-[10px] font-medium">Export</span>
      </NavLink>
    </nav>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-green-600 text-4xl animate-pulse">🌱</div>
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
        navigate('/instellingen')
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
    <div className="flex flex-col min-h-dvh pb-20">
      <Routes>
        <Route path="/" element={<Hoofdpagina />} />
        <Route path="/fysiek" element={<Fysiek />} />
        <Route path="/sport" element={<Sport />} />
        <Route path="/lezen" element={<Lezen />} />
        <Route path="/export" element={<Export />} />
        <Route path="/instellingen" element={<Instellingen />} />
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
    <BrowserRouter basename="/DoelenApp">
      <AppInner />
    </BrowserRouter>
  )
}
