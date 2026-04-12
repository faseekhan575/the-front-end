// src/GoogleCallback.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from './authSlice'

export default function GoogleCallback() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

 useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const accessToken = params.get('accessToken')
  const refreshToken = params.get('refreshToken')

  if (accessToken) {
    localStorage.clear()

    const base64Payload = accessToken.split('.')[1]
    const payload = JSON.parse(atob(base64Payload))

    dispatch(setCredentials({
      user: {
        _id: payload._id,
        username: payload.username,
        email: payload.email,
        fullname: payload.fullname,
      },
      accessToken,
    }))

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }

    setTimeout(() => {
      navigate('/', { replace: true })
    }, 500)

  } else {
    navigate('/login', { replace: true })
  }
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