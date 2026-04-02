// src/Login.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLoginMutation } from './apiSlice'
import { useDispatch } from 'react-redux'
import { setCredentials } from './authSlice'
import { toast } from 'sonner'
import { Eye, EyeOff, PlayCircle, ArrowRight } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login] = useLoginMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await login({
        email: email || undefined,
        username: username || undefined,
        passward: password
      }).unwrap()

      dispatch(setCredentials({
        user: result.data?.user || result.data,
        accessToken: result.data?.accesstoken || result.data?.accessToken
      }))
      toast.success("Welcome back! 🎬")
      navigate('/')
    } catch (err) {
      toast.error(err?.data?.message || "Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 bg-gradient-to-br from-red-950/40 via-[#0d0d0d] to-[#0d0d0d] border-r border-white/5 p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center">
            <PlayCircle size={22} fill="white" className="text-white" />
          </div>
          <span className="text-xl font-bold">Faseeh<span className="text-red-500">Vision</span></span>
        </div>

        <div>
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Your world of<br />
            <span className="text-red-500">videos</span> awaits.
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Watch, upload, and connect with creators from around the world on FaseehVision.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {['bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-green-500'].map((c, i) => (
              <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-[#0d0d0d] flex items-center justify-center text-xs font-bold`}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-400">Join thousands of creators today</p>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center">
              <PlayCircle size={18} fill="white" className="text-white" />
            </div>
            <span className="text-xl font-bold">Faseeh<span className="text-red-500">Vision</span></span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Sign in</h1>
          <p className="text-zinc-400 mb-8">Don't have an account? <Link to="/register" className="text-red-400 hover:text-red-300 font-medium">Create one</Link></p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-600 -mt-2">Fill username OR email (at least one)</p>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}