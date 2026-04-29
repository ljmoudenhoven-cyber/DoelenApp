import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Hoofdpagina from './pages/Hoofdpagina'
import Fysiek from './pages/Fysiek'
import Sport from './pages/Sport'
import Lezen from './pages/Lezen'
import Export from './pages/Export'
import Instellingen from './pages/Instellingen'
import { genereerWekelijkseTaken } from './store/taken'
import { getSetting, setItem } from './store/db'
import { genereerSportSchema } from './store/sportSchema'

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

function AppInner() {
  const navigate = useNavigate()
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    async function init() {
      // Check eerste keer opstarten
      const lengte = await getSetting('lengte')
      if (!lengte) {
        navigate('/instellingen')
      }

      // Zorg dat sportschema bestaat
      const bestaandSchema = await getSetting('sportSchema')
      if (!bestaandSchema) {
        const schema = genereerSportSchema()
        await setItem('settings', 'sportSchema', schema)
      }

      // Genereer taken voor vandaag
      await genereerWekelijkseTaken()
      setGeladen(true)
    }
    init()
  }, [navigate])

  if (!geladen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-green-600 text-4xl animate-pulse">🌱</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh pb-20">
      <Routes>
        <Route path="/" element={<Hoofdpagina />} />
        <Route path="/fysiek" element={<Fysiek />} />
        <Route path="/sport" element={<Sport />} />
        <Route path="/lezen" element={<Lezen />} />
        <Route path="/export" element={<Export />} />
        <Route path="/instellingen" element={<Instellingen />} />
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
