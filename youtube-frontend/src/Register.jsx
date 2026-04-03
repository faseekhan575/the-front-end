// src/Register.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useRegisterMutation } from './apiSlice'
import { toast } from 'sonner'
import { Eye, EyeOff, PlayCircle, ArrowRight, Camera, ImagePlus, User } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({ fullname: '', username: '', email: '', passward: '' })
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const [register] = useRegisterMutation()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleCover = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    const data = new FormData()
    data.append('fullname', formData.fullname)
    data.append('username', formData.username)
    data.append('email', formData.email)
    data.append('passward', formData.passward)
    if (avatar) data.append('avatar', avatar)
    if (coverImage) data.append('coverImage', coverImage)

    try {
      await register(data).unwrap()
      toast.success("Account created! Please sign in. 🎉")
      navigate('/login')
    } catch (err) {
      toast.error(err?.data?.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center">
            <PlayCircle size={18} fill="white" className="text-white" />
          </div>
          <span className="text-xl font-bold">Faseeh<span className="text-red-500">Vision</span></span>
        </div>

        <h1 className="text-3xl font-bold mb-2">Create your account</h1>
        <p className="text-zinc-400 mb-8">Already have one? <Link to="/login" className="text-red-400 hover:text-red-300 font-medium">Sign in</Link></p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cover image preview area */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Cover Image
              <span className="text-zinc-600 ml-1 normal-case font-normal">(optional)</span>
            </label>
            <label className="cursor-pointer block relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors group">
              <div className="h-28 bg-white/5 flex items-center justify-center overflow-hidden">
                {coverPreview
                  ? <img src={coverPreview} className="w-full h-full object-cover" alt="cover" />
                  : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      <ImagePlus size={28} />
                      <span className="text-xs">Click to upload cover image</span>
                    </div>
                  )
                }
              </div>
              <input type="file" accept="image/*" onChange={handleCover} className="hidden" />
            </label>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <label className="cursor-pointer relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 bg-white/5 flex items-center justify-center hover:border-red-500/50 transition-colors group">
                {avatarPreview
                  ? <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar" />
                  : <Camera size={22} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                }
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">+</span>
              </div>
              <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
            </label>
            <div>
              <p className="font-medium text-sm">{avatarPreview ? 'Avatar set ✓' : 'Upload your avatar'}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Click the image to choose a photo</p>
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text" name="fullname" value={formData.fullname} onChange={handleChange}
              required placeholder="John Doe"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Username</label>
              <input
                type="text" name="username" value={formData.username} onChange={handleChange}
                required placeholder="johndoe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                required placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'} name="passward" value={formData.passward} onChange={handleChange}
                required placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}