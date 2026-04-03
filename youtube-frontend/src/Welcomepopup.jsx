// src/WelcomePopup.jsx
import { useState, useEffect } from 'react'
import { PlayCircle } from 'lucide-react'

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false)
  const [flyAway, setFlyAway] = useState(false)

  useEffect(() => {
    // Check localStorage only once on mount
    const seen = localStorage.getItem('faseeh_welcome_seen')
    if (!seen) {
      // Slightly longer delay so the page settles first
      const timer = setTimeout(() => {
        setVisible(true)
      }, 800)
      return () => clearTimeout(timer)   // Cleanup
    }
  }, [])

  const handleOk = () => {
    setFlyAway(true)

    // Slightly shorter timeout for fly away animation
    setTimeout(() => {
      setVisible(false)
      localStorage.setItem('faseeh_welcome_seen', 'true')
    }, 700)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop - Higher z-index */}
      <div
        className={`fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md transition-opacity duration-500 ${
          flyAway ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Popup Container */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div
          className={`
            pointer-events-auto relative w-full max-w-md
            transition-all duration-700 ease-out
            ${flyAway
              ? 'translate-x-[140vw] -translate-y-[70vh] rotate-[25deg] scale-75 opacity-0'
              : 'translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100'
            }
          `}
          style={{
            transitionTimingFunction: flyAway 
              ? 'cubic-bezier(0.55, 0, 1, 0.45)' 
              : 'cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Card */}
          <div className="relative bg-gradient-to-br from-[#1a0a0a] via-[#140a14] to-[#0a0a1a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(220,38,38,0.35)]">

            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-red-500/40 rounded-full animate-ping"
                  style={{
                    left: `${15 + i * 14}%`,
                    top: `${20 + (i % 3) * 25}%`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: `${2 + i * 0.3}s`,
                  }}
                />
              ))}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-600/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative p-8 text-center">
              {/* Logo */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-900/60">
                    <PlayCircle size={40} fill="white" className="text-white" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 bg-red-500/20 rounded-3xl blur-xl animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-black mb-1 tracking-tight">
                Faseeh<span className="text-red-500">Vision</span>
              </h1>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/15" />
                <span className="text-xs text-zinc-500 font-medium tracking-widest uppercase">Special Access</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/15" />
              </div>

              {/* Message */}
              <div className="space-y-3 mb-7">
                <p className="text-lg font-bold text-white leading-snug">
                  Welcome to a platform built with ❤️
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  This is <span className="text-white font-semibold">FaseehVision</span> — crafted by{' '}
                  <span className="text-red-400 font-bold">Faseeh Khan</span> for his best friends only. 🎬✨
                </p>
                <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-500/20 rounded-xl px-4 py-2 text-xs text-red-300 font-medium">
                  <span>🔒</span> Exclusive • Private • Made with love
                </div>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-1 mb-7">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                    ★
                  </span>
                ))}
              </div>

              {/* OK Button */}
              <button
                onClick={handleOk}
                className="
                  relative w-full py-4 rounded-2xl font-black text-base tracking-wide
                  bg-gradient-to-r from-red-600 to-rose-600
                  hover:from-red-500 hover:to-rose-500
                  shadow-lg shadow-red-900/50 hover:shadow-red-900/70
                  transition-all duration-200 hover:scale-[1.02] active:scale-95
                  overflow-hidden group
                "
              >
                <span className="relative z-10">Let's Go! 🚀</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>

              <p className="text-xs text-zinc-600 mt-4">Made by Faseeh Khan 🤍</p>
            </div>
          </div>

          {/* Floating plane */}
          <div className={`absolute -top-4 -right-4 text-3xl transition-all duration-700 ${flyAway ? 'rotate-45 scale-150' : 'rotate-0'}`}>
            ✈️
          </div>
        </div>
      </div>
    </>
  )
}