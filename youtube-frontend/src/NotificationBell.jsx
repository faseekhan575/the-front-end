import { usePush } from "./usePush"
import { useState, useEffect } from "react"
import { X, Bell } from "lucide-react"

export default function NotificationBell() {
  const { isSubscribed, isLoading, subscribe, unsubscribe } = usePush()
  const [showBar, setShowBar] = useState(false)

  // Show the top bar once if user hasn't subscribed and hasn't dismissed it
  useEffect(() => {
    if (!('Notification' in window)) return
    const dismissed = localStorage.getItem('notif_bar_dismissed')
    if (!isSubscribed && !dismissed) {
      setShowBar(true)
    }
  }, [isSubscribed])

  // Hide bar once subscribed
  useEffect(() => {
    if (isSubscribed) setShowBar(false)
  }, [isSubscribed])

  const handleDismiss = () => {
    setShowBar(false)
    localStorage.setItem('notif_bar_dismissed', '1')
  }

  const handleSubscribeFromBar = async () => {
    await subscribe()
    setShowBar(false)
  }

  if (!('Notification' in window)) return null

  return (
    <>
      {/* ── TOP NOTIFICATION BAR ── */}
      {showBar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(90deg, #18181b 0%, #1c1c1f 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '10px 16px',
            boxShadow: '0 2px 24px rgba(0,0,0,0.5)',
            animation: 'slideDown 0.3s ease both',
          }}
        >
          <style>{`
            @keyframes slideDown {
              from { transform: translateY(-100%); opacity: 0; }
              to   { transform: translateY(0);     opacity: 1; }
            }
          `}</style>

          {/* Bell icon */}
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bell size={14} color="#ef4444" />
          </div>

          {/* Text */}
          <p style={{
            fontSize: '13px', color: '#d4d4d8', margin: 0,
            fontWeight: 500, lineHeight: 1.4,
          }}>
            Stay updated —{' '}
            <span style={{ color: '#a1a1aa' }}>
              get notified when new videos drop.
            </span>
          </p>

          {/* Enable button */}
          <button
            onClick={handleSubscribeFromBar}
            disabled={isLoading}
            style={{
              flexShrink: 0,
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'background 0.2s, transform 0.1s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isLoading ? '…' : 'Enable'}
          </button>

          {/* Dismiss X */}
          <button
            onClick={handleDismiss}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#52525b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
            onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── BELL BUTTON (unchanged) ── */}
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        title={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
        className="notification-bell-btn"
        style={{
          background: 'none',
          border: 'none',
          cursor: isLoading ? 'wait' : 'pointer',
          fontSize: '22px',
          padding: '6px',
          borderRadius: '50%',
          transition: 'background 0.2s',
          color: isSubscribed ? '#ff4444' : '#aaa',
        }}
      >
        {isLoading ? '⏳' : isSubscribed ? '🔔' : '🔕'}
      </button>
    </>
  )
}