// src/UploadVideo.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePublishVideoMutation } from './apiSlice' // ✅ using RTK Query
import {
  Upload, Film, Image, X, CheckCircle2,
  ArrowRight, AlertTriangle, Zap, Clock,
  Smartphone, FolderOpen, RefreshCw
} from 'lucide-react'

const MAX_VIDEO_MB = 80
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024

// ─────────────────────────────────────────────────────────────────────────────
// 80MB Exceeded Modal
// ─────────────────────────────────────────────────────────────────────────────
function SizeLimitModal({ fileSize, onClose, onPickAnother }) {
  const fileMB = (fileSize / 1024 / 1024).toFixed(1)
  const overBy = (fileSize / 1024 / 1024 - MAX_VIDEO_MB).toFixed(1)
  const limitPercent = Math.min((MAX_VIDEO_MB / parseFloat(fileMB)) * 100, 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.18s ease' }}
    >
      <div
        className="bg-[#111111] w-full max-w-md rounded-3xl border border-red-500/40 shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 0 60px rgba(220,38,38,0.15), 0 25px 50px rgba(0,0,0,0.8)' }}
      >
        <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        <div className="p-7">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0"
              style={{ boxShadow: '0 0 20px rgba(220,38,38,0.2)' }}>
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <div className="pt-1">
              <h3 className="text-white font-extrabold text-xl leading-tight tracking-tight">Video Too Large</h3>
              <p className="text-zinc-400 text-sm mt-1">Your file exceeds the current upload limit</p>
            </div>
          </div>
          <div className="bg-white/[0.04] rounded-2xl p-5 mb-5 border border-white/[0.07] space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your file</span>
                <span className="text-sm text-red-400 font-black tabular-nums">{fileMB} MB</span>
              </div>
              <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded-full w-full"
                  style={{ boxShadow: '0 0 12px rgba(220,38,38,0.6)' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Max allowed</span>
                <span className="text-sm text-emerald-400 font-black tabular-nums">{MAX_VIDEO_MB} MB</span>
              </div>
              <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full"
                  style={{ width: `${limitPercent}%`, boxShadow: '0 0 10px rgba(52,211,153,0.4)' }} />
              </div>
            </div>
            <p className="text-xs text-center text-zinc-500 pt-1 border-t border-white/[0.05]">
              Over the limit by <span className="text-red-400 font-bold">{overBy} MB</span>
            </p>
          </div>
          <div className="border border-yellow-500/20 bg-yellow-950/25 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <Zap size={15} className="text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-sm text-zinc-300 leading-relaxed">
                <span className="text-yellow-400 font-bold">Free Plan Limit — </span>
                We're on Cloudinary's free tier capped at <span className="text-white font-bold">80MB</span>.
                As FaseehVision grows we'll support{' '}
                <span className="text-emerald-400 font-bold">GB-sized uploads</span>. Thanks for your patience 🙏
              </p>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 mb-6">
            <p className="text-xs text-zinc-300 font-semibold mb-2.5">💡 Compress your video with:</p>
            <div className="flex gap-2 flex-wrap">
              {['HandBrake (Free)', 'Clipchamp', 'iMovie', 'CapCut'].map((t) => (
                <span key={t} className="text-xs bg-white/[0.07] text-zinc-200 font-medium px-3 py-1.5 rounded-lg border border-white/[0.08]">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-white/[0.1] text-zinc-300 hover:bg-white/[0.06] hover:text-white text-sm font-semibold transition-all">
              Cancel
            </button>
            <button onClick={onPickAnother}
              className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{ boxShadow: '0 0 20px rgba(220,38,38,0.3)' }}>
              <RefreshCw size={15} />
              Upload Shorter Video
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Video Loading State
// ─────────────────────────────────────────────────────────────────────────────
function VideoLoadingState({ fileName }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const steps = [12, 28, 45, 60, 74, 86, 95, 100]
    let i = 0
    const id = setInterval(() => {
      if (i < steps.length) { setPct(steps[i]); i++ }
      else clearInterval(id)
    }, 160)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-2 w-full">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Film size={26} className="text-red-400" />
        </div>
        <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
          <circle cx="32" cy="32" r="28" fill="none" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.25s ease', filter: 'drop-shadow(0 0 5px #dc2626)' }} />
        </svg>
      </div>
      <div className="text-center w-full px-6">
        <p className="text-sm font-bold text-white mb-0.5">Reading video file...</p>
        <p className="text-xs text-zinc-500 mb-3 truncate">{fileName}</p>
        <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden max-w-[180px] mx-auto">
          <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
            style={{ width: `${pct}%`, transition: 'width 0.25s ease', boxShadow: '0 0 8px rgba(220,38,38,0.6)' }} />
        </div>
        <p className="text-xs text-red-400 font-semibold mt-1.5 tabular-nums">{pct}%</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Overlay
// ─────────────────────────────────────────────────────────────────────────────
function UploadOverlay({ progress }) {
  const label =
    progress < 20 ? 'Preparing upload...' :
    progress < 50 ? 'Uploading your reel...' :
    progress < 80 ? 'Halfway there, hang tight! 💪' :
    progress < 99 ? 'Almost done...' : 'Processing complete! 🎉'

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl"
      style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="w-full max-w-xs px-6 text-center">
        <div className="relative w-32 h-32 mx-auto mb-7">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
            <circle cx="64" cy="64" r="56" fill="none" stroke="url(#uploadGrad)" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.45s ease', filter: 'drop-shadow(0 0 8px #dc2626)' }} />
            <defs>
              <linearGradient id="uploadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-white tabular-nums">{progress}</span>
            <span className="text-xs text-zinc-400 font-semibold -mt-0.5">%</span>
          </div>
        </div>
        <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden mb-5">
          <div className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg,#dc2626,#f87171)',
              transition: 'width 0.45s ease',
              boxShadow: '0 0 16px rgba(220,38,38,0.6)'
            }} />
        </div>
        <p className="text-white font-bold text-lg mb-1.5">{label}</p>
        <p className="text-zinc-500 text-xs mb-8">Don't close or refresh this page</p>
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-500"
              style={{ animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reel Tips Banner
// ─────────────────────────────────────────────────────────────────────────────
function ReelTipsBanner() {
  return (
    <div className="mb-7 p-4 bg-gradient-to-br from-red-950/50 to-zinc-900/30 border border-red-500/20 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone size={13} className="text-red-400" />
        <span className="text-xs font-black text-red-400 uppercase tracking-widest">Before You Upload</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { icon: <Clock size={11} />, text: 'Keep reels under 60 seconds' },
          { icon: <Smartphone size={11} />, text: 'Vertical 9:16 ratio is best' },
          { icon: <Zap size={11} />, text: 'Max 80MB · MP4 preferred' },
        ].map((tip, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-zinc-300 font-medium bg-white/[0.05] rounded-xl px-3 py-2.5 border border-white/[0.06]">
            <span className="text-red-400 shrink-0">{tip.icon}</span>
            {tip.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children, badge }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <label className="text-xs font-black text-zinc-200 uppercase tracking-widest">{children}</label>
      {badge && (
        <span className="text-xs text-zinc-400 font-semibold bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
          {badge}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function UploadVideo() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videofile, setVideofile] = useState(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(null)
  const [sizeError, setSizeError] = useState(null)
  const videoInputRef = useRef(null)
  const navigate = useNavigate()

  // ✅ RTK Query mutation — uses Railway URL from apiSlice baseUrl automatically
  const [publishVideo] = usePublishVideoMutation()

  const handleVideoSelect = (file) => {
    if (!file) return
    if (!file.type.startsWith('video/')) { toast.error('Please select a valid video file'); return }
    if (file.size > MAX_VIDEO_BYTES) { setSizeError(file); return }
    setVideoLoading(true)
    setTimeout(() => { setVideofile(file); setVideoLoading(false) }, 1600)
  }

  const handleThumbnail = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Thumbnail must be under 5MB'); return }
    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e, type) => {
    e.preventDefault(); setDragOver(null)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (type === 'video') handleVideoSelect(file)
    else if (type === 'thumbnail') handleThumbnail(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !description || !videofile || !thumbnail) {
      toast.error('Please fill all fields and select files'); return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // ── Checkpoints: 20 → 40 → 55 → 89 → 95 → 99 ──
    // ~5s gap between each step, holds at 99 until API done.
    // If API resolves at ANY point mid-animation → instantly jump to 100.
    const checkpoints = [20, 40, 55, 89, 95, 99]
    const GAP_MS = 5000          // 5 seconds between each checkpoint
    let apiDone = false          // true the moment API resolves
    let apiFailed = false
    let apiError = null
    let resolveApiWait = null    // lets the progress loop know API finished early

    // This promise resolves as soon as the API call settles
    const apiSignal = new Promise(r => { resolveApiWait = r })

    // Kick off the real API call in parallel — don't await here
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('videofile', videofile)
    formData.append('thumbnail', thumbnail)

    publishVideo(formData).unwrap()
      .then(() => { apiDone = true; resolveApiWait() })
      .catch(err => { apiDone = true; apiFailed = true; apiError = err; resolveApiWait() })

    // Walk through each checkpoint with a 5s pause between them.
    // At every pause we also race against the API signal — if API finishes
    // early we break out immediately and jump straight to 100%.
    for (const target of checkpoints) {
      if (apiDone) break                          // API already done, stop here
      setUploadProgress(target)                   // snap to checkpoint
      if (target === 99) break                    // reached 99 → hold, exit loop

      // Wait 5s OR until API resolves — whichever comes first
      await Promise.race([
        new Promise(r => setTimeout(r, GAP_MS)),
        apiSignal,
      ])

      if (apiDone) break                          // API resolved during the wait
    }

    // If API still running (we're sitting at 99) → wait for it now
    if (!apiDone) await apiSignal

    // API is done — handle result
    if (apiFailed) {
      toast.error(apiError?.data?.message || 'Upload failed. Please try again.')
      setIsUploading(false)
      setUploadProgress(0)
      return
    }

    // ✅ Success
    setUploadProgress(100)
    toast.success('Reel published successfully! 🎉')
    setTimeout(() => { setIsUploading(false); setUploadProgress(0); navigate('/') }, 700)
  }

  const steps = [
    { label: 'Video', done: !!videofile },
    { label: 'Thumbnail', done: !!thumbnail },
    { label: 'Title', done: !!title.trim() },
    { label: 'Description', done: !!description.trim() },
  ]
  const formProgress = Math.round((steps.filter(s => s.done).length / steps.length) * 100)
  const canPublish = formProgress === 100 && !isUploading && !videoLoading

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes dotPulse{ 0%,100%{opacity:.25;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }
      `}</style>

      {sizeError && (
        <SizeLimitModal
          fileSize={sizeError.size}
          onClose={() => setSizeError(null)}
          onPickAnother={() => { setSizeError(null); setTimeout(() => videoInputRef.current?.click(), 100) }}
        />
      )}

      {isUploading && <UploadOverlay progress={uploadProgress} />}

      <div className="max-w-2xl mx-auto py-10 px-4">

        <div className="mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight mb-1.5">Upload Reel</h1>
          <p className="text-zinc-400 text-sm font-medium">Share your content with the FaseehVision community</p>
        </div>

        <ReelTipsBanner />

        <div className="mb-9">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Form Completion</span>
            <span className="text-sm font-black text-red-400 tabular-nums">{formProgress}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
              style={{ width: `${formProgress}%`, boxShadow: formProgress > 0 ? '0 0 10px rgba(220,38,38,0.4)' : 'none' }} />
          </div>
          <div className="flex gap-5 mt-3 flex-wrap">
            {steps.map((s) => (
              <div key={s.label} className={`flex items-center gap-1.5 text-xs font-semibold transition-colors duration-300 ${s.done ? 'text-emerald-400' : 'text-zinc-600'}`}>
                <CheckCircle2 size={13} />{s.label}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">

          {/* ── Video Drop Zone ── */}
          <div>
            <SectionLabel badge="Max 80MB">Video File</SectionLabel>
            <label
              className={`relative cursor-pointer flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-9 transition-all duration-200 ${
                dragOver === 'video' ? 'border-red-500 bg-red-500/[0.06] scale-[1.01]'
                : videofile         ? 'border-emerald-500/50 bg-emerald-500/[0.06]'
                : videoLoading      ? 'border-red-500/40 bg-red-500/[0.05]'
                : 'border-white/[0.1] hover:border-white/25 hover:bg-white/[0.02]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver('video') }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, 'video')}
              onClick={(e) => { if (videofile || videoLoading) e.preventDefault() }}
            >
              <input ref={videoInputRef} type="file" accept="video/*"
                onChange={(e) => handleVideoSelect(e.target.files[0])} className="hidden" />

              {videoLoading && <VideoLoadingState fileName="your video" />}

              {videofile && !videoLoading && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center"
                    style={{ boxShadow: '0 0 20px rgba(52,211,153,0.15)' }}>
                    <CheckCircle2 size={30} className="text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-base text-emerald-400 truncate max-w-xs">{videofile.name}</p>
                    <p className="text-xs text-zinc-400 font-medium mt-1">{(videofile.size / 1024 / 1024).toFixed(1)} MB · Ready to publish</p>
                  </div>
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVideofile(null) }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/[0.08] hover:bg-white/[0.15] rounded-xl flex items-center justify-center transition-all border border-white/[0.08]">
                    <X size={14} className="text-zinc-300" />
                  </button>
                </>
              )}

              {!videofile && !videoLoading && (
                <>
                  <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08]">
                    <Film size={28} className="text-zinc-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-base text-white">Drop your reel here or click to browse</p>
                    <p className="text-xs text-zinc-500 font-medium mt-1.5">MP4, MOV, AVI · Vertical 9:16 recommended</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold bg-white/[0.05] px-4 py-2 rounded-full border border-white/[0.08] hover:bg-white/[0.08] transition-all">
                    <FolderOpen size={12} /> Browse files
                  </div>
                </>
              )}
            </label>
          </div>

          {/* ── Thumbnail Drop Zone ── */}
          <div>
            <SectionLabel badge="Max 5MB">Thumbnail</SectionLabel>
            <label
              className={`relative cursor-pointer flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl transition-all duration-200 overflow-hidden ${
                dragOver === 'thumb' ? 'border-red-500 scale-[1.01]'
                : thumbnail         ? 'border-emerald-500/50'
                : 'border-white/[0.1] hover:border-white/25'
              }`}
              style={{ minHeight: '152px' }}
              onDragOver={(e) => { e.preventDefault(); setDragOver('thumb') }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, 'thumbnail')}
            >
              <input type="file" accept="image/*" onChange={(e) => handleThumbnail(e.target.files[0])} className="hidden" />
              {thumbnailPreview ? (
                <>
                  <img src={thumbnailPreview} alt="thumbnail" className="w-full h-38 object-cover" style={{ height: '152px' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-bold truncate max-w-[200px]">{thumbnail.name}</span>
                  </div>
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); setThumbnail(null); setThumbnailPreview(null) }}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-xl flex items-center justify-center transition-all">
                    <X size={14} className="text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2.5 py-6">
                  <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08]">
                    <Image size={24} className="text-zinc-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-base text-white">Upload thumbnail</p>
                    <p className="text-xs text-zinc-500 font-medium mt-1">JPG, PNG, WEBP · 9:16 ratio for reels</p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* ── Title ── */}
          <div>
            <SectionLabel>Title</SectionLabel>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              required maxLength={100} placeholder="Give your reel a catchy title..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-sm text-white font-medium placeholder-zinc-600 focus:outline-none focus:border-red-500/70 focus:bg-white/[0.06] transition-all" />
            <p className="text-right text-xs text-zinc-600 font-medium mt-1.5">{title.length}/100</p>
          </div>

          {/* ── Description ── */}
          <div>
            <SectionLabel>Description</SectionLabel>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              required rows={4} placeholder="Tell viewers about your reel..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-sm text-white font-medium placeholder-zinc-600 focus:outline-none focus:border-red-500/70 focus:bg-white/[0.06] transition-all resize-y" />
          </div>

          {/* ── Submit ── */}
          <button type="submit" disabled={!canPublish}
            className="w-full flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed font-bold py-4 rounded-xl transition-all text-sm"
            style={canPublish ? { boxShadow: '0 0 24px rgba(220,38,38,0.35)' } : {}}>
            <Upload size={17} />
            Publish Reel
            <ArrowRight size={16} />
          </button>

          {!canPublish && !isUploading && (
            <p className="text-center text-xs text-zinc-600 font-medium">
              {videoLoading ? 'Loading video file...' : 'Complete all fields above to publish'}
            </p>
          )}
        </form>
      </div>
    </>
  )
}