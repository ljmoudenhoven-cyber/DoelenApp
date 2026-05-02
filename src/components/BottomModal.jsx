import { useEffect } from 'react'

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
        style={{ maxHeight: '92dvh' }}
      >
        {/* Vaste header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-800 text-base">{titel}</h2>
          <button
            onClick={onSluit}
            aria-label="Sluiten"
            className="text-gray-400 text-3xl leading-none pb-1"
          >
            &times;
          </button>
        </div>

        {/* Scrollbare inhoud */}
        <div
          className="flex-1 overflow-y-auto px-5 pt-4"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
