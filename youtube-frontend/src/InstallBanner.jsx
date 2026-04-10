import { useInstallPrompt } from './useInstallPrompt'
import { useState } from 'react'

export default function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  if (!isInstallable || isInstalled || dismissed) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#272727',
      color: '#fff',
      padding: '14px 20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      maxWidth: '360px',
      width: '90%',
    }}>
      <img src="/icons/icon-192x192.png" width={40} height={40}
        style={{ borderRadius: '8px' }} alt="app icon" />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>Add to Home Screen</div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>
          Get push notifications & faster access
        </div>
      </div>
      <button
        onClick={promptInstall}
        style={{
          background: '#ff0000',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 14px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '13px',
        }}
      >
        Install
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', color: '#aaa',
          cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
      >
        ✕
      </button>
    </div>
  )
}