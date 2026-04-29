import { useEffect } from 'react'

// Vergrendelt achtergrondscroll op iOS terwijl modal open is
function useScrollLock() {
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])
}

export default function BottomModal({ titel, onSluit, children }) {
  useScrollLock()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div
        className="bg-white rounded-t-2xl w-full max-w-[430px] flex flex-col"
        style={{ maxHeight: '85dvh' }}
      >
        {/* Vaste header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">{titel}</h2>
          <button onClick={onSluit} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        {/* Scrollbaar inhoud */}
        <div
          className="flex-1 overflow-y-scroll px-5 py-4 pb-8"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
