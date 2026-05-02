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

const HEADER_H = 60 // px
const MODAL_H = '92dvh'

export default function BottomModal({ titel, onSluit, children }) {
  useScrollLock()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div
        className="bg-white rounded-t-2xl w-full max-w-[430px]"
        style={{ height: MODAL_H }}
      >
        <div
          className="flex items-center justify-between px-5 border-b border-gray-100"
          style={{ height: HEADER_H }}
        >
          <h2 className="font-semibold text-gray-800 text-base">{titel}</h2>
          <button onClick={onSluit} aria-label="Sluiten" className="text-gray-400 text-3xl leading-none pb-1">&times;</button>
        </div>

        <div
          className="px-5 py-4"
          style={{
            height: `calc(${MODAL_H} - ${HEADER_H}px)`,
            overflowY: 'scroll',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
