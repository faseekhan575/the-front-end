// src/GoogleCallback.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from './authSlice'

export default function GoogleCallback() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchUser = async (retries = 3) => {
      try {
        const res = await fetch(
          'https://node-chai-production.up.railway.app/api/v1/user/current-user',
          { method: 'GET', credentials: 'include' }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)

        dispatch(setCredentials({
          user: data.data,
          accessToken: 'cookie-based',
        }))

        navigate('/', { replace: true })
      } catch (error) {
        if (retries > 0) {
          setTimeout(() => fetchUser(retries - 1), 300)
        } else {
          navigate('/login', { replace: true })
        }
      }
    }
    fetchUser()
  }, [])

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Signing you in with Google...</p>
      </div>
    </div>
  )
}