import { useInstallPrompt } from './useInstallPrompt'
import { useState } from 'react'

export default function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  if (!isInstallable || isInstalled || dismissed) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#181818',
      borderTop: '0.5px solid #333',
      padding: '16px 20px 24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }}>
      <img
        src="/pwa-192x192.png"
        width={48} height={48}
        style={{ borderRadius: '12px', flexShrink: 0 }}
        alt="app icon"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '15px', color: '#fff', marginBottom: '2px' }}>
          FaseehVision
        </div>
        <div style={{ fontSize: '13px', color: '#aaa' }}>
          Install for faster access & notifications
        </div>
      </div>
      <button
        onClick={promptInstall}
        style={{
          background: '#ff0000',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 18px',
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Install
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          fontSize: '22px',
          lineHeight: 1,
          padding: '4px',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}