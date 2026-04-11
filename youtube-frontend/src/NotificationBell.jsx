import { usePush } from './usePush'
import { useState, useRef, useEffect } from 'react'

export default function NotificationBell() {
  const { isSubscribed, isLoading, subscribe, unsubscribe } = usePush()
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef(null)

  if (!('Notification' in window)) return null

  // Show tooltip on first visit if not subscribed
  useEffect(() => {
    if (!isSubscribed) {
      const seen = localStorage.getItem('bell_tooltip_seen')
      if (!seen) {
        setShowTooltip(true)
        localStorage.setItem('bell_tooltip_seen', '1')
      }
    }
  }, [])

  const handleClick = () => {
    setShowTooltip(false)
    isSubscribed ? unsubscribe() : subscribe()
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>

      {/* Tooltip popup */}
      {showTooltip && !isSubscribed && (
        <div ref={tooltipRef} style={{
          position: 'absolute',
          top: '54px',
          right: 0,
          background: '#212121',
          border: '0.5px solid #333',
          borderRadius: '12px',
          padding: '14px 16px',
          width: '220px',
          zIndex: 999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '14px',
            width: '10px',
            height: '10px',
            background: '#212121',
            border: '0.5px solid #333',
            borderRight: 'none',
            borderBottom: 'none',
            transform: 'rotate(45deg)',
          }} />
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginBottom: '6px' }}>
            Enable notifications
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px', lineHeight: 1.5 }}>
            Get notified when new videos are uploaded
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleClick}
              style={{
                flex: 1,
                background: '#ff0000',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Allow
            </button>
            <button
              onClick={() => setShowTooltip(false)}
              style={{
                flex: 1,
                background: 'transparent',
                color: '#aaa',
                border: '0.5px solid #444',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Bell button */}
      <button
        onClick={handleClick}
        disabled={isLoading}
        title={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: isSubscribed ? '#ff0000' : 'transparent',
          border: isSubscribed ? 'none' : '0.5px solid #444',
          cursor: isLoading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, transform 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = isSubscribed ? '#cc0000' : '#2a2a2a'}
        onMouseLeave={e => e.currentTarget.style.background = isSubscribed ? '#ff0000' : 'transparent'}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isLoading ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#888" strokeWidth="2"
            style={{ animation: 'bellSpin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={isSubscribed ? '#fff' : '#aaa'} strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        )}

        {/* Red dot when subscribed */}
        {isSubscribed && (
          <span style={{
            position: 'absolute',
            top: '1px',
            right: '1px',
            width: '10px',
            height: '10px',
            background: '#fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              background: '#ff0000',
              borderRadius: '50%',
              display: 'block',
            }} />
          </span>
        )}
      </button>

      <style>{`
        @keyframes bellSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}