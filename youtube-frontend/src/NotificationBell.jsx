import { usePush } from "./usePush"

export default function NotificationBell() {
  const { isSubscribed, isLoading, subscribe, unsubscribe } = usePush()

  if (!('Notification' in window)) return null   // browser doesn't support it

  return (
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
  )
}