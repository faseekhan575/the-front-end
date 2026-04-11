import { usePush } from './usePush'
import { useState, useRef, useEffect } from 'react'

export default function NotificationBell() {
  const { isSubscribed, isLoading, subscribe, unsubscribe } = usePush()
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef(null)

  if (!('Notification' in window)) return null

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
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>

      {/* Tooltip */}
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
          <div style={{
            position: 'absolute', top: '-6px', right: '14px',
            width: '10px', height: '10px', background: '#212121',
            border: '0.5px solid #333', borderRight: 'none', borderBottom: 'none',
            transform: 'rotate(45deg)',
          }} />
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginBottom: '6px' }}>
            Enable notifications
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px', lineHeight: 1.5 }}>
            Get notified when new videos are uploaded
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleClick} style={{
              flex: 1, background: '#ff0000', color: '#fff', border: 'none',
              borderRadius: '6px', padding: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}>Allow</button>
            <button onClick={() => setShowTooltip(false)} style={{
              flex: 1, background: 'transparent', color: '#aaa',
              border: '0.5px solid #444', borderRadius: '6px',
              padding: '8px', fontSize: '12px', cursor: 'pointer',
            }}>Later</button>
          </div>
        </div>
      )}

      {/* Bell + X wrapper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>

        {/* Bell button */}
        <button
          onClick={!isSubscribed ? handleClick : undefined}
          disabled={isLoading}
          title={isSubscribed ? 'Notifications on' : 'Enable notifications'}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: isSubscribed ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            cursor: isSubscribed ? 'default' : isLoading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { if (!isSubscribed) e.currentTarget.style.background = '#1a1a1a' }}
          onMouseLeave={e => { if (!isSubscribed) e.currentTarget.style.background = 'transparent' }}
        >
          {isLoading ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#555" strokeWidth="2"
              style={{ animation: 'bellSpin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          ) : (
            /* Bell icon — bright white when subscribed, dim when not */
            <svg width="20" height="20" viewBox="0 0 24 24"
              fill={isSubscribed ? '#fff' : 'none'}
              stroke={isSubscribed ? '#fff' : '#666'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          )}
        </button>

        {/* X button — only show when subscribed */}
        {isSubscribed && !isLoading && (
          <button
            onClick={unsubscribe}
            title="Turn off notifications"
            style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'transparent', border: 'none',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              opacity: 0.5, transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <style>{`
        @keyframes bellSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}