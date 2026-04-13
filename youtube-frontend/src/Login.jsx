// src/Login.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLoginMutation } from './apiSlice'
import { useDispatch } from 'react-redux'
import { setCredentials } from './authSlice'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

// ─── Google SVG Icon ──────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
)

const handleGoogleLogin = () => {
  window.location.href = 'https://node-chai-production.up.railway.app/auth/google'
}

// ─── Logo Component ───────────────────────────────────────────────────────────
function Logo({ size = 'md' }) {
  const s = size === 'lg' ? 'w-14 h-14' : 'w-10 h-10'
  const t = size === 'lg' ? 'text-2xl' : 'text-xl'
  return (
    <div className="flex items-center gap-3">
      <div className={`${s} rounded-2xl overflow-hidden ring-2 ring-red-500/30 shadow-lg shadow-red-900/40 flex-shrink-0`}>
        <img src="/f-logo2.jpeg" alt="FaseehVision" className="w-full h-full object-cover" />
      </div>
      <span className={`${t} font-black tracking-tight`}>
        Faseeh<span className="text-red-500">Vision</span>
      </span>
    </div>
  )
}

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navigate  = useNavigate()
  const dispatch  = useDispatch()
  const [login]   = useLoginMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await login({
        email:    email    || undefined,
        username: username || undefined,
        passward: password,
      }).unwrap()

      dispatch(setCredentials({
        user:        result.data?.user        || result.data,
        accessToken: result.data?.accesstoken || result.data?.accessToken,
      }))
      toast.success('Welcome back! 🎬')
      navigate('/')
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060606] flex overflow-hidden">

      {/* ─── LEFT PANEL — Cinematic Branding ─────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[520px] flex-shrink-0 relative overflow-hidden p-12">

        {/* Deep layered background */}
        <div className="absolute inset-0 bg-[#060606]" />

        {/* Ambient glow orbs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-red-700/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-red-900/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[200px] h-[200px] rounded-full bg-rose-600/10 blur-[80px] pointer-events-none" />

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Vertical red line accent */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-red-500/60 to-transparent" />

        <div className="relative z-10">
          <Logo size="md" />
        </div>

        <div className="relative z-10">
          <h2 className="text-[3.2rem] font-black leading-[1.05] tracking-tight mb-5">
            Your world of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-red-500">
              videos
            </span>{' '}awaits.
          </h2>
          <p className="text-zinc-400 text-[15px] leading-relaxed max-w-[340px]">
            Watch, upload, and connect with creators from around the world on FaseehVision.
          </p>
        </div>

        {/* Bottom — profile + quote */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
            <img src="/for.jpeg" alt="Faseeh Khan" className="w-full h-full object-cover" />
          </div>
          <p className="text-sm text-zinc-500 italic">
            "everything is possible when you have dreams"
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL — Sign In Form ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">

        {/* Subtle right-side ambient */}
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] rounded-full bg-red-900/10 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-[fadeUp_0.5s_cubic-bezier(0.22,1,0.36,1)]">

          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <Logo size="md" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[2.2rem] font-black tracking-tight mb-2 leading-tight">
              Welcome back<span className="text-red-500">.</span>
            </h1>
            <p className="text-zinc-400 text-[14px]">
              Don't have an account?{' '}
              <Link to="/register" className="text-red-400 hover:text-red-300 font-semibold transition-colors underline underline-offset-2">
                Create one free
              </Link>
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50
                       text-[#1f1f1f] font-semibold text-[14px] py-4 rounded-2xl transition-all
                       shadow-xl shadow-black/30 hover:shadow-black/40 hover:scale-[1.015]
                       active:scale-[0.985] mb-5 border border-white/90"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* OR Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-zinc-600 font-semibold tracking-widest uppercase">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Form card */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-sm shadow-2xl shadow-black/40">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Username + Email row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    className="w-full bg-white/[0.05] border border-white/[0.09] hover:border-white/[0.15]
                               focus:border-red-500/50 focus:bg-white/[0.07] rounded-xl px-4 py-3
                               text-sm placeholder-zinc-700 outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/[0.05] border border-white/[0.09] hover:border-white/[0.15]
                               focus:border-red-500/50 focus:bg-white/[0.07] rounded-xl px-4 py-3
                               text-sm placeholder-zinc-700 outline-none transition-all duration-200"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-700 -mt-1 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-zinc-700 inline-block" />
                Fill username OR email — at least one required
              </p>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/[0.05] border border-white/[0.09] hover:border-white/[0.15]
                               focus:border-red-500/50 focus:bg-white/[0.07] rounded-xl px-4 py-3 pr-12
                               text-sm placeholder-zinc-700 outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900/60 disabled:cursor-not-allowed
                           text-white font-bold text-[14px] py-4 rounded-xl transition-all mt-1
                           flex items-center justify-center gap-2
                           shadow-lg shadow-red-900/40 hover:shadow-red-800/50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-zinc-700 mt-6">
            By signing in you agree to our{' '}
            <span className="text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors">Terms</span>
            {' '}and{' '}
            <span className="text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors">Privacy Policy</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  )
}