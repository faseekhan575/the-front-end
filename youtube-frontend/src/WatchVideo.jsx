// src/WatchVideo.jsx
import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  useGetVideoByIdQuery,
  useGetVideoCommentsQuery,
  useAddCommentMutation,
  useToggleVideoLikeMutation,
  useToggleSubscriptionMutation,
  useToggleCommentLikeMutation,
  useGetSubscribedChannelsQuery,
} from './apiSlice'
import {
  ThumbsUp, ThumbsDown, Share2, MessageCircle,
  Bell, BellOff, MoreHorizontal, Flag,
  ChevronDown, ChevronUp, Heart, Send,
  Copy, Check, Eye, Calendar, Loader2,
  Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, RotateCcw, RotateCw,
  PictureInPicture2,
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)       return 'just now'
  if (s < 3600)     return Math.floor(s / 60)      + 'm ago'
  if (s < 86400)    return Math.floor(s / 3600)    + 'h ago'
  if (s < 2592000)  return Math.floor(s / 86400)   + 'd ago'
  if (s < 31536000) return Math.floor(s / 2592000) + 'mo ago'
  return Math.floor(s / 31536000) + 'y ago'
}
const formatNum = (n) => {
  if (!n && n !== 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00'
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}

// ─── Video Player ─────────────────────────────────────────────────────────────
function VideoPlayer({ src, poster, title }) {
  const videoRef     = useRef(null)
  const containerRef = useRef(null)
  const progressRef  = useRef(null)
  const hideTimer    = useRef(null)

  const [playing,    setPlaying]    = useState(false)
  const [curTime,    setCurTime]    = useState(0)
  const [duration,   setDuration]   = useState(0)
  const [volume,     setVolume]     = useState(1)
  const [muted,      setMuted]      = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [showCtrl,   setShowCtrl]   = useState(true)
  const [buffered,   setBuffered]   = useState(0)
  const [rate,       setRate]       = useState(1)
  const [showSpeed,  setShowSpeed]  = useState(false)
  const [seeking,    setSeeking]    = useState(false)
  const [skipAnim,   setSkipAnim]   = useState(null)
  const [showVol,    setShowVol]    = useState(false)
  const [pip,        setPip]        = useState(false)
  const [loaded,     setLoaded]     = useState(false)
  const [waiting,    setWaiting]    = useState(false)

  const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  useEffect(() => {
    setPlaying(false); setCurTime(0); setDuration(0)
    setLoaded(false); setWaiting(false); setBuffered(0)
  }, [src])

  const resetHide = useCallback(() => {
    setShowCtrl(true)
    clearTimeout(hideTimer.current)
    if (playing && !showSpeed)
      hideTimer.current = setTimeout(() => setShowCtrl(false), 3200)
  }, [playing, showSpeed])

  useEffect(() => {
    resetHide()
    return () => clearTimeout(hideTimer.current)
  }, [playing, resetHide])

  useEffect(() => {
    const fn = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', fn)
    return () => document.removeEventListener('fullscreenchange', fn)
  }, [])

  useEffect(() => {
    const fn = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay() }
      if (e.key === 'ArrowRight' || e.key === 'l') { e.preventDefault(); skip(10)  }
      if (e.key === 'ArrowLeft'  || e.key === 'j') { e.preventDefault(); skip(-10) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); adjVol(0.1)  }
      if (e.key === 'ArrowDown') { e.preventDefault(); adjVol(-0.1) }
      if (e.key === 'm') toggleMute()
      if (e.key === 'f') toggleFS()
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [volume, playing])

  const seekTo = useCallback((e) => {
    const bar = progressRef.current; const v = videoRef.current
    if (!bar || !v || !v.duration) return
    const rect = bar.getBoundingClientRect()
    const cx   = e.touches ? e.touches[0].clientX : e.clientX
    const pct  = Math.max(0, Math.min(1, (cx - rect.left) / rect.width))
    v.currentTime = pct * v.duration; setCurTime(v.currentTime)
  }, [])

  useEffect(() => {
    if (!seeking) return
    const move = (e) => seekTo(e)
    const up   = ()  => setSeeking(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
  }, [seeking, seekTo])

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return
    v.paused ? v.play() : v.pause()
    resetHide()
  }
  const skip = (sec) => {
    const v = videoRef.current; if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec))
    setSkipAnim(sec > 0 ? 'fwd' : 'bwd')
    setTimeout(() => setSkipAnim(null), 700)
    resetHide()
  }
  const adjVol = (delta) => {
    const v = videoRef.current; if (!v) return
    const nv = Math.max(0, Math.min(1, volume + delta))
    v.volume = nv; setVolume(nv); setMuted(nv === 0); v.muted = nv === 0
  }
  const toggleMute = () => {
    const v = videoRef.current; if (!v) return
    v.muted = !v.muted; setMuted(v.muted)
    if (!v.muted && volume === 0) { v.volume = 0.5; setVolume(0.5) }
  }
const toggleFS = () => {
  const v = videoRef.current;
  if (!v) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    // Mobile-friendly: request fullscreen on the video itself
    v.requestFullscreen?.({ navigationUI: "hide" })
      .catch(() => {
        toast.error('Fullscreen not supported on this device');
      });
  }
};
  const togglePip = async () => {
    const v = videoRef.current; if (!v) return
    try {
      if (document.pictureInPictureElement) { await document.exitPictureInPicture(); setPip(false) }
      else { await v.requestPictureInPicture(); setPip(true) }
    } catch { toast.error('PiP not supported') }
  }
  const applySpeed = (r) => {
    const v = videoRef.current; if (v) v.playbackRate = r
    setRate(r); setShowSpeed(false)
    toast.success(`${r === 1 ? 'Normal' : r + '×'} speed`)
  }

  const progress = duration ? (curTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`relative bg-black w-full select-none overflow-hidden
        ${fullscreen ? 'rounded-none' : 'rounded-none sm:rounded-3xl'}`}
      style={{ aspectRatio: '16/9' }}
      onMouseMove={resetHide}
      onMouseLeave={() => playing && !showSpeed && setShowCtrl(false)}
      onTouchStart={resetHide}
    >
      {/* ── 1. VIDEO ── */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
      
        onPlay={() => { setPlaying(true); setMuted(videoRef.current?.muted ?? true) }}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setShowCtrl(true) }}
        onTimeUpdate={() => {
          const v = videoRef.current; if (!v) return
          setCurTime(v.currentTime)
          if (v.buffered.length > 0)
            setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100)
        }}
        onLoadedMetadata={() => {
          const v = videoRef.current
          if (v) { setDuration(v.duration); setLoaded(true) }
        }}
        onWaiting={() => setWaiting(true)}
        onCanPlay={() => setWaiting(false)}
      />

      {/* ── 2. BUFFERING SPINNER (pointer-events-none, z-10) ── */}
      {(waiting || !loaded) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-14 h-14 rounded-full border-[3px] border-white/10 border-t-red-500 animate-spin" />
        </div>
      )}

      {/* ── 3. PAUSED OVERLAY (pointer-events-none, z-10) ── */}
      {!playing && loaded && !waiting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-20 h-20 bg-black/55 backdrop-blur-xl rounded-full flex items-center justify-center ring-2 ring-white/20 shadow-2xl">
            <Play size={30} fill="white" className="text-white ml-1" />
          </div>
        </div>
      )}

      {/* ── 4. SKIP ANIMATION (pointer-events-none, z-10) ── */}
      {skipAnim && (
        <div className={`absolute inset-0 flex items-center pointer-events-none z-10
          ${skipAnim === 'fwd' ? 'justify-end pr-14' : 'justify-start pl-14'}`}>
          <div className="flex flex-col items-center gap-1.5 bg-black/65 backdrop-blur-xl rounded-2xl px-5 py-3.5 animate-[skipPop_.7s_ease_both]">
            {skipAnim === 'fwd'
              ? <RotateCw size={26} className="text-white" />
              : <RotateCcw size={26} className="text-white" />}
            <span className="text-white text-[11px] font-black tracking-widest">10 SEC</span>
          </div>
        </div>
      )}

      {/*
        ── 5. CLICK / DOUBLE-TAP ZONES (z-20) ───────────────────────────────
        Handles play/pause on single click and ±10s skip on double-click.
        Must be BELOW the controls overlay (z-30) so the bottom bar stays
        on top and catches progress/button clicks before these zones do.
      */}
      <div className="absolute inset-0 flex z-20">
        <div className="flex-1 cursor-pointer" onClick={togglePlay} onDoubleClick={() => skip(-10)} />
        <div className="w-16  cursor-pointer" onClick={togglePlay} />
        <div className="flex-1 cursor-pointer" onClick={togglePlay} onDoubleClick={() => skip(10)} />
      </div>

      {/*
        ── 6. CONTROLS OVERLAY (z-30, pointer-events-none) ──────────────────
        The wrapper is pointer-events-none so it never swallows clicks in the
        video area — those fall through to the zones above.
        Only the bottom bar div gets pointer-events-auto so controls work.
        z-30 > z-20 ensures the bottom bar sits above the click zones.
      */}
      <div
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 pointer-events-none z-30
          ${showCtrl ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Top gradient */}
        <div className="bg-gradient-to-b from-black/80 via-black/25 to-transparent px-4 pt-4 pb-16">
          <p className="text-white/90 text-sm font-semibold line-clamp-1 hidden sm:block tracking-tight">
            {title}
          </p>
        </div>

        {/* Bottom bar — pointer-events-auto re-enables all controls */}
        <div className="bg-gradient-to-t from-black/95 via-black/55 to-transparent px-3 sm:px-5 pb-3 sm:pb-4 pt-12 pointer-events-auto">

          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-[3px] bg-white/15 rounded-full cursor-pointer mb-4
                       hover:h-[5px] transition-all duration-100 group/prog"
            onMouseDown={(e) => { setSeeking(true); seekTo(e) }}
            onTouchStart={(e) => { setSeeking(true); seekTo(e) }}
          >
            <div className="absolute inset-y-0 left-0 bg-white/20 rounded-full pointer-events-none"
                 style={{ width: `${buffered}%` }} />
            <div className="absolute inset-y-0 left-0 bg-red-500 rounded-full pointer-events-none"
                 style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full
                            shadow-lg shadow-black/60 pointer-events-none
                            opacity-0 group-hover/prog:opacity-100 transition-opacity"
                 style={{ left: `${progress}%` }} />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1">

            <button onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/12 rounded-xl transition-colors">
              {playing
                ? <Pause size={22} fill="white" className="text-white" />
                : <Play  size={22} fill="white" className="text-white ml-0.5" />}
            </button>

            <button onClick={() => skip(-10)}
              className="w-9 h-9 hidden sm:flex items-center justify-center hover:bg-white/12 rounded-xl transition-colors"
              title="Back 10s (J)">
              <RotateCcw size={18} className="text-white" />
            </button>

            <button onClick={() => skip(10)}
              className="w-9 h-9 hidden sm:flex items-center justify-center hover:bg-white/12 rounded-xl transition-colors"
              title="Forward 10s (L)">
              <RotateCw size={18} className="text-white" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1"
              onMouseEnter={() => setShowVol(true)}
              onMouseLeave={() => setShowVol(false)}>
              <button onClick={toggleMute}
                className="w-9 h-9 flex items-center justify-center hover:bg-white/12 rounded-xl transition-colors">
                {(muted || volume === 0)
                  ? <VolumeX size={19} className="text-white" />
                  : <Volume2 size={19} className="text-white" />}
              </button>
              <div className={`transition-all duration-200 overflow-hidden ${showVol ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}>
                <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={(e) => {
                    const nv = Number(e.target.value)
                    if (videoRef.current) { videoRef.current.volume = nv; videoRef.current.muted = nv === 0 }
                    setVolume(nv); setMuted(nv === 0)
                  }}
                  className="w-full accent-red-500 cursor-pointer" />
              </div>
            </div>

            {/* Time */}
            <span className="text-white/85 text-[11px] sm:text-xs font-mono tabular-nums ml-1.5 flex-shrink-0">
              {formatTime(curTime)}<span className="text-white/30 mx-1.5">/</span>{formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Speed */}
            <div className="relative">
              <button onClick={() => setShowSpeed(!showSpeed)}
                className="h-8 px-2.5 text-white/75 hover:text-white hover:bg-white/12 rounded-xl transition-colors text-xs font-black tracking-wide">
                {rate === 1 ? '1×' : `${rate}×`}
              </button>
              {showSpeed && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#0f0f0f]/98 backdrop-blur-xl
                                border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-32 z-50
                                animate-[fadeUp_.15s_ease_both]">
                  <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[.2em] px-3 pt-2.5 pb-1">Speed</p>
                  {RATES.map((r) => (
                    <button key={r} onClick={() => applySpeed(r)}
                      className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors
                        ${rate === r ? 'text-red-400 bg-red-500/10' : 'text-zinc-300 hover:bg-white/8 hover:text-white'}`}>
                      {r === 1 ? 'Normal' : `${r}×`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP */}
            <button onClick={togglePip}
              className="w-9 h-9 hidden sm:flex items-center justify-center hover:bg-white/12 rounded-xl transition-colors"
              title="Picture in Picture">
              <PictureInPicture2 size={17} className={pip ? 'text-red-400' : 'text-white/75'} />
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFS}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/12 rounded-xl transition-colors"
              title="Fullscreen (F)">
              {fullscreen ? <Minimize size={17} className="text-white" /> : <Maximize size={17} className="text-white" />}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes skipPop {
          0%   { opacity:0; transform:scale(.65) }
          25%  { opacity:1; transform:scale(1)   }
          75%  { opacity:1; transform:scale(1)   }
          100% { opacity:0; transform:scale(.9)  }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(6px) }
          to   { opacity:1; transform:translateY(0)   }
        }
        @keyframes slideIn {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:1; transform:translateY(0)    }
        }
      `}</style>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function WatchSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto -mx-4 sm:mx-auto animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0 lg:gap-8">
        <div className="space-y-5">
          <div className="w-full aspect-video bg-zinc-900 sm:rounded-3xl" />
          <div className="px-4 sm:px-0 space-y-3">
            <div className="h-6 bg-zinc-900 rounded-xl w-5/6" />
            <div className="h-3.5 bg-zinc-900 rounded-xl w-2/6" />
          </div>
          <div className="px-4 sm:px-0 flex gap-3 py-4 border-y border-white/5">
            <div className="w-11 h-11 rounded-full bg-zinc-900 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-900 rounded w-28" />
              <div className="h-3 bg-zinc-900 rounded w-16" />
            </div>
            <div className="h-9 w-28 bg-zinc-900 rounded-2xl" />
          </div>
        </div>
        <div className="hidden lg:block space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-40 aspect-video bg-zinc-900 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-zinc-900 rounded w-full" />
                <div className="h-3 bg-zinc-900 rounded w-4/5" />
                <div className="h-3 bg-zinc-900 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Comment Item ─────────────────────────────────────────────────────────────
function CommentItem({ comment, currentUser, index }) {
  const [toggleCommentLike] = useToggleCommentLikeMutation()
  const [liked,     setLiked]     = useState(false)
  const [likeCount, setLikeCount] = useState(comment.likes ?? comment.likeCount ?? 0)

  const handleLike = async () => {
    if (!currentUser) { toast.error('Sign in to like comments'); return }
    try {
      await toggleCommentLike(comment._id).unwrap()
      setLiked(!liked); setLikeCount((p) => liked ? p - 1 : p + 1)
    } catch { toast.error('Failed to like comment') }
  }

  return (
    <div className="flex gap-3 group"
      style={{ animation: 'slideIn .35s ease both', animationDelay: `${Math.min(index * 25, 250)}ms` }}>
      <Link to={`/channel/${comment.owner?.username}`} className="flex-shrink-0 mt-0.5">
        <img src={comment.owner?.avatar || '/default-avatar.png'} alt={comment.owner?.username}
          className="w-9 h-9 rounded-full object-cover ring-1 ring-white/8 hover:ring-red-500/40 transition-all"
          onError={(e) => { e.target.src = '/default-avatar.png' }} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <Link to={`/channel/${comment.owner?.username}`}
            className="text-[13px] font-bold hover:text-red-400 transition-colors">
            @{comment.owner?.username}
          </Link>
          <span className="text-[11px] text-zinc-500">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-zinc-200 leading-relaxed break-words">{comment.content}</p>
        <div className="flex items-center gap-4 mt-2.5">
          <button onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-110 active:scale-95
              ${liked ? 'text-red-400' : 'text-zinc-400 hover:text-zinc-100'}`}>
            <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
            {likeCount > 0 && <span>{formatNum(likeCount)}</span>}
          </button>
          <button className="text-xs text-zinc-500 hover:text-zinc-200 font-bold transition-colors">Reply</button>
          <button className="ml-auto text-zinc-700 hover:text-zinc-400 transition-all opacity-0 group-hover:opacity-100">
            <Flag size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WatchVideo() {
  const { videoId } = useParams()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [videoId])

  const [commentText,  setCommentText]  = useState('')
  const [liked,        setLiked]        = useState(false)
  const [likeCount,    setLikeCount]    = useState(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [showShare,    setShowShare]    = useState(false)
  const [subLoading,   setSubLoading]   = useState(false)
  const textareaRef = useRef(null)
  const shareRef    = useRef(null)

  const user = useSelector((state) => state.auth.user)

  const { data: videoData,    isLoading }                = useGetVideoByIdQuery(videoId)
  const { data: commentsData, refetch: refetchComments } = useGetVideoCommentsQuery({ videoId, page: 1, limit: 50 })
  const { data: subscribedData }                         = useGetSubscribedChannelsQuery(undefined, { skip: !user })
  const [addComment,  { isLoading: isCommenting }]       = useAddCommentMutation()
  const [toggleLike]                                     = useToggleVideoLikeMutation()
  const [toggleSub]                                      = useToggleSubscriptionMutation()

  const video    = videoData?.data
  const comments = commentsData?.data || []

  useEffect(() => {
    if (video) { setLikeCount(video.likeCount ?? 0); setLiked(video.isLiked ?? false) }
  }, [video])

  useEffect(() => { setCommentText(''); setDescExpanded(false) }, [videoId])

  useEffect(() => {
    const fn = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShowShare(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const subscribedChannels = subscribedData?.data || []
  const isOwnVideo   = user && video?.owner?._id && String(user._id) === String(video.owner._id)
  const isSubscribed = !isOwnVideo && subscribedChannels.some(
    (s) => String(s.channel?._id) === String(video?.owner?._id)
  )

  const handleLike = async () => {
    if (!user) return toast.error('Sign in to like videos')
    const was = liked
    setLiked(!was); setLikeCount((p) => Math.max(0, was ? p - 1 : p + 1))
    try { await toggleLike(videoId).unwrap(); toast.success(was ? 'Like removed' : 'Liked! ❤️') }
    catch {
      setLiked(was); setLikeCount((p) => Math.max(0, was ? p + 1 : p - 1))
      toast.error('Something went wrong')
    }
  }

  const handleSubscribe = async () => {
    if (!video?.owner?._id || !user) return toast.error('Sign in to subscribe')
    if (isOwnVideo) return toast.error("You can't subscribe to your own channel")
    setSubLoading(true)
    try { await toggleSub(video.owner._id).unwrap(); toast.success(isSubscribed ? 'Unsubscribed' : 'Subscribed! 🔔') }
    catch { toast.error('Failed to toggle subscription') }
    finally { setSubLoading(false) }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    try {
      await addComment({ videoId, content: commentText }).unwrap()
      setCommentText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      refetchComments(); toast.success('Comment posted!')
    } catch { toast.error('Failed to post comment') }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2500)
    }); setShowShare(false)
  }

  const handleTweet = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Watching "${video?.title}" on FaseehVision 🎬\n${window.location.href}`)}`,
      '_blank'
    ); setShowShare(false)
  }

  if (isLoading) return <WatchSkeleton />

  if (!video) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-white/8">
        <Play size={36} className="text-zinc-700 ml-1" />
      </div>
      <h2 className="text-2xl font-black tracking-tight mb-2">Video not found</h2>
      <p className="text-zinc-500 text-sm mb-8">This video may have been removed or made private.</p>
      <Link to="/" className="px-7 py-3 bg-red-600 hover:bg-red-500 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95">
        Back to Home
      </Link>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:1; transform:translateY(0)    }
        }
        .watch-in { animation: slideIn .4s ease both; }
        @keyframes likePop {
          0%   { transform: scale(1)    }
          40%  { transform: scale(1.25) }
          70%  { transform: scale(0.92) }
          100% { transform: scale(1)    }
        }
        .like-pop { animation: likePop .35s ease both; }
      `}</style>

      <div className="-mx-4 sm:-mx-6 md:mx-0 max-w-[1500px] md:mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-0 lg:gap-8">

          {/* ── Main column ── */}
          <div className="min-w-0 watch-in">

            <div className="sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/80 ring-0 sm:ring-1 ring-white/[.07]">
              <VideoPlayer src={video.videofile} poster={video.thumbnail} title={video.title} />
            </div>

            <div className="px-4 md:px-0 mt-4 sm:mt-6">

              <h1 className="text-[1.1rem] sm:text-xl lg:text-2xl font-black tracking-tight leading-snug text-white">
                {video.title}
              </h1>

              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 bg-white/[.07] px-2.5 py-1 rounded-lg">
                  <Eye size={12} className="text-zinc-400" />
                  {formatNum(video.views)} views
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 bg-white/[.07] px-2.5 py-1 rounded-lg">
                  <Calendar size={12} className="text-zinc-400" />
                  {formatDate(video.createdAt)}
                </span>
              </div>

              <div className="h-px bg-white/[.08] mt-4 mb-4" />

              <div className="flex items-center justify-between gap-3 flex-wrap">

                <div className="flex items-center gap-3">
                  <Link to={`/channel/${video.owner?.username}`}>
                    <img src={video.owner?.avatar || '/default-avatar.png'} alt={video.owner?.fullname}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-white/15 hover:ring-red-500/60 transition-all"
                      onError={(e) => { e.target.src = '/default-avatar.png' }} />
                  </Link>
                  <div>
                    <Link to={`/channel/${video.owner?.username}`}
                      className="font-bold text-sm sm:text-base text-white hover:text-red-400 transition-colors block leading-tight">
                      {video.owner?.fullname}
                    </Link>
                    <p className="text-xs text-zinc-400 mt-0.5">@{video.owner?.username}</p>
                  </div>

                  {!isOwnVideo ? (
                    <button
                      onClick={handleSubscribe}
                      disabled={subLoading}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black
                                  transition-all active:scale-95 disabled:opacity-60 shadow-lg
                                  ${isSubscribed
                                    ? 'bg-white/10 hover:bg-white/15 text-zinc-100 border border-white/20'
                                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50 hover:scale-105 hover:shadow-red-800/60'}`}
                    >
                      {subLoading
                        ? <Loader2 size={14} className="animate-spin" />
                        : isSubscribed ? <BellOff size={14} /> : <Bell size={14} />}
                      {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 text-xs text-zinc-400 bg-white/6 rounded-2xl border border-white/10">Your video</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-white/[.09] border border-white/[.14] rounded-2xl overflow-hidden">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-black border-r border-white/[.12]
                                  transition-all active:scale-95
                                  ${liked
                                    ? 'text-white bg-red-600 hover:bg-red-500'
                                    : 'text-zinc-100 hover:text-white hover:bg-white/[.10]'}`}
                    >
                      <ThumbsUp size={16} fill={liked ? 'white' : 'none'} />
                      <span className={`text-sm font-black tabular-nums ${liked ? 'text-white' : 'text-zinc-100'}`}>
                        {formatNum(likeCount)}
                      </span>
                    </button>
                    <button className="px-3.5 py-2.5 text-zinc-300 hover:text-white hover:bg-white/[.10] transition-colors">
                      <ThumbsDown size={16} />
                    </button>
                  </div>

                  <div className="relative" ref={shareRef}>
                    <button
                      onClick={() => setShowShare(!showShare)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/[.09] hover:bg-white/[.14]
                                 border border-white/[.14] rounded-2xl text-sm font-black text-zinc-100 hover:text-white transition-all"
                    >
                      <Share2 size={15} />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                    {showShare && (
                      <div className="absolute right-0 top-full mt-2 bg-[#111]/98 backdrop-blur-2xl border border-white/10
                                      rounded-2xl shadow-2xl overflow-hidden z-30 w-52 animate-[slideIn_.2s_ease_both]">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-4 py-3">Share video</p>
                        <button onClick={handleShare}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/6 text-sm font-semibold text-zinc-200 hover:text-white transition-colors">
                          {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}Copy link
                        </button>
                        <button onClick={handleTweet}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/6 text-sm font-semibold text-zinc-200 hover:text-white transition-colors border-t border-white/8">
                          <span className="font-black text-sky-400 text-base leading-none">𝕏</span>Share on X
                        </button>
                      </div>
                    )}
                  </div>

                  <button className="w-10 h-10 flex items-center justify-center bg-white/[.09] hover:bg-white/[.14]
                                     border border-white/[.14] rounded-2xl text-zinc-300 hover:text-white transition-all">
                    <MoreHorizontal size={17} />
                  </button>
                </div>
              </div>

              <div
                className="mt-5 bg-white/[.04] hover:bg-white/[.06] border border-white/[.09] rounded-2xl p-4 sm:p-5 transition-colors"
                onClick={() => (video.description?.length ?? 0) > 100 && setDescExpanded(!descExpanded)}
                style={{ cursor: (video.description?.length ?? 0) > 100 ? 'pointer' : 'default' }}
              >
                <p className={`text-sm text-zinc-200 leading-relaxed whitespace-pre-line ${!descExpanded ? 'line-clamp-2' : ''}`}>
                  {video.description || 'No description provided.'}
                </p>
                {(video.description?.length ?? 0) > 100 && (
                  <button className="flex items-center gap-1 mt-3 text-xs font-black text-zinc-400 hover:text-white transition-colors">
                    {descExpanded ? <><ChevronUp size={12} />Show less</> : <><ChevronDown size={12} />Show more</>}
                  </button>
                )}
              </div>

              <div className="mt-10 pb-16">
                <div className="flex items-center gap-3 mb-7">
                  <MessageCircle size={19} className="text-zinc-400" />
                  <h2 className="font-black text-xl text-white">
                    {formatNum(comments.length)}
                    <span className="font-normal text-zinc-400 ml-2 text-lg">
                      {comments.length === 1 ? 'Comment' : 'Comments'}
                    </span>
                  </h2>
                </div>

                {user ? (
                  <form onSubmit={handleAddComment} className="flex gap-3 mb-10">
                    <img src={user.avatar || '/default-avatar.png'} alt={user.username}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0 mt-0.5"
                      onError={(e) => { e.target.src = '/default-avatar.png' }} />
                    <div className="flex-1">
                      <div className="flex items-end gap-2 bg-white/[.05] border border-white/[.10]
                                      focus-within:border-red-500/60 focus-within:bg-white/[.07]
                                      rounded-2xl px-4 py-3.5 transition-all">
                        <textarea ref={textareaRef} value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment(e) }}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                          placeholder="Share your thoughts…" rows={1}
                          className="flex-1 bg-transparent text-sm outline-none resize-none placeholder-zinc-600 text-zinc-100 leading-relaxed"
                          style={{ minHeight: '24px', maxHeight: '140px' }} />
                        <button type="submit" disabled={!commentText.trim() || isCommenting}
                          className="flex-shrink-0 w-8 h-8 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800
                                     disabled:cursor-not-allowed rounded-xl flex items-center justify-center
                                     transition-all hover:scale-110 active:scale-95">
                          {isCommenting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1.5 ml-1">Ctrl+Enter to post</p>
                    </div>
                  </form>
                ) : (
                  <div className="mb-10 p-5 bg-white/[.04] rounded-2xl border border-white/[.09] text-center">
                    <p className="text-sm text-zinc-400">
                      <Link to="/login" className="text-red-400 hover:text-red-300 font-black transition-colors">Sign in</Link>
                      {' '}to join the conversation
                    </p>
                  </div>
                )}

                <div className="space-y-7">
                  {comments.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                      <div className="w-16 h-16 bg-white/[.04] rounded-3xl flex items-center justify-center mb-4 border border-white/[.08]">
                        <MessageCircle size={24} className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-400 font-bold text-sm">No comments yet</p>
                      <p className="text-zinc-600 text-xs mt-1">Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    comments.map((c, i) => (
                      <CommentItem key={c._id} comment={c} currentUser={user} index={i} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[.2em]">Up Next</p>
              <div className="flex flex-col items-center justify-center py-24
                              border border-dashed border-white/[.09] rounded-3xl text-center">
                <div className="w-14 h-14 bg-white/[.04] rounded-2xl flex items-center justify-center mb-3 border border-white/[.08]">
                  <Play size={22} className="text-zinc-600 ml-0.5" />
                </div>
                <p className="text-zinc-400 text-sm font-bold">Related videos</p>
                <p className="text-zinc-600 text-xs mt-1">Coming soon</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}