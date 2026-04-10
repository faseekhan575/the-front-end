import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

const BACKEND = 'https://node-chai-production.up.railway.app'

// Convert VAPID base64 string to Uint8Array (required by browser API)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePush() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const user = useSelector((state) => state.auth?.user)

  // On mount — check if already subscribed
  useEffect(() => {
    if (!user) return
    checkSubscription()
  }, [user])

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setIsSubscribed(!!sub)
  }

  const subscribe = async () => {
    if (!user) return alert('Please login first')
    setIsLoading(true)
    try {
      // 1. Get VAPID public key from backend
      const keyRes = await fetch(`${BACKEND}/api/v10/push/vapid-public-key`, {
        credentials: 'include',
      })
      const keyData = await keyRes.json()
      const publicKey = keyData?.data?.publicKey
      if (!publicKey) throw new Error('Could not get VAPID key')

      // 2. Register service worker & subscribe
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // 3. Send subscription to backend
      await fetch(`${BACKEND}/api/v10/push/subscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setIsSubscribed(true)
    } catch (err) {
      console.error('Push subscribe error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch(`${BACKEND}/api/v10/push/unsubscribe`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setIsSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { isSubscribed, isLoading, subscribe, unsubscribe }
}