// src/WatchVideo.jsx — Production-grade. All logic unchanged.
import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
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
  Bell, MoreHorizontal, Flag, ChevronDown, ChevronUp,
  Heart, Send, Copy, Check, Eye, Calendar,
  BellOff, Loader2, Play,
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'

// ─── Detect iOS PWA ───────────────────────────────────────────────────────────
const isIOSPWA = () =>
  typeof window !== 'undefined' &&
  /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
  window.navigator.standalone === true

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)       return 'just now'
  if (s < 3600)     return Math.floor(s / 60)     + 'm ago'
  if (s < 86400)    return Math.floor(s / 3600)   + 'h ago'
  if (s < 2592000)  return Math.floor(s / 86400)  + 'd ago'
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function WatchSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="aspect-video bg-zinc-800 rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                            -skew-x-12 animate-[shimmer_1.8s_infinite]" />
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-zinc-800 rounded-xl w-5/6" />
            <div className="h-4 bg-zinc-800 rounded-xl w-3/6" />
          </div>
          <div className="flex items-center gap-3 py-4 border-y border-white/6">
            <div className="w-11 h-11 rounded-full bg-zinc-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-32" />
              <div className="h-3 bg-zinc-800 rounded w-20" />
            </div>
            <div className="h-9 w-28 bg-zinc-800 rounded-xl" />
          </div>
          <div className="space-y-5 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-zinc-800 rounded w-24" />
                  <div className="h-3 bg-zinc-800 rounded w-full" />
                  <div className="h-3 bg-zinc-800 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-40 aspect-video bg-zinc-800 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-800 rounded w-4/5" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Comment Item ─────────────────────────────────────────────────────────────
function CommentItem({ comment, currentUser }) {
  const [toggleCommentLike] = useToggleCommentLikeMutation()
  const [liked,     setLiked]     = useState(false)
  const [likeCount, setLikeCount] = useState(comment.likes ?? comment.likeCount ?? 0)

  const handleLike = async () => {
    if (!currentUser) { toast.error('Sign in to like comments'); return }
    try {
      await toggleCommentLike(comment._id).unwrap()
      setLiked(!liked)
      setLikeCount((p) => liked ? p - 1 : p + 1)
    } catch {
      toast.error('Failed to like comment')
    }
  }

  return (
    <div className="flex gap-3 group">
      <Link to={`/channel/${comment.owner?.username}`} className="flex-shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10
                        hover:ring-red-500/40 transition-all duration-200">
          <img
            src={comment.owner?.avatar || '/default-avatar.png'}
            alt={comment.owner?.username}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/default-avatar.png' }}
          />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Link
            to={`/channel/${comment.owner?.username}`}
            className="text-sm font-bold hover:text-red-400 transition-colors"
          >
            @{comment.owner?.username}
          </Link>
          <span className="text-xs text-zinc-600">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed break-words">{comment.content}</p>
        <div className="flex items-center gap-4 mt-2.5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all
              ${liked ? 'text-red-400' : 'text-zinc-600 hover:text-zinc-300'}`}
          >
            <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
            {likeCount > 0 && <span>{formatNum(likeCount)}</span>}
          </button>
          <button className="text-xs text-zinc-600 hover:text-zinc-300 font-semibold transition-colors">
            Reply
          </button>
          <button className="ml-auto text-zinc-700 hover:text-zinc-500 transition-colors
                             opacity-0 group-hover:opacity-100">
            <Flag size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VideoPlayer — iOS PWA safe ───────────────────────────────────────────────
// Key insight: iOS PWA completely blocks any programmatic play() call.
// The ONLY way to play video on iOS PWA is a direct user tap on the element.
// So on iOS PWA we skip autoPlay entirely and show a tap overlay instead.
function VideoPlayer({ src, poster }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const ios = isIOSPWA()

  // ── Non-iOS: normal behaviour, autoPlay works fine ──
  if (!ios) {
    return (
      <video
        src={src}
        controls
        autoPlay
        playsInline
        preload="metadata"
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        className="w-full h-full"
        poster={poster}
      />
    )
  }

  // ── iOS PWA: tap overlay triggers play() synchronously inside click ──
  const handleTap = () => {
    const vid = videoRef.current
    if (!vid) return
    // This is inside a direct click handler → iOS allows it
    vid.play().catch(() => {})
    setPlaying(true)
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        preload="metadata"
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        className="w-full h-full"
        poster={poster}
        onPlay={()  => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        // ✋ NO autoPlay — iOS PWA silently kills it
      />

      {/* Overlay: only shown before first tap */}
      {!playing && (
        <div
          onClick={handleTap}
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.52)', cursor: 'pointer' }}
        >
          {/* Red play button */}
          <div style={{
            width: '76px', height: '76px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 48px rgba(239,68,68,0.45)',
            marginBottom: '14px',
            transition: 'transform 0.15s',
          }}>
            <Play size={34} color="#fff" fill="#fff" style={{ marginLeft: '5px' }} />
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.03em',
          }}>
            Tap to play
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main WatchVideo ──────────────────────────────────────────────────────────
export default function WatchVideo() {
  const { videoId } = useParams()

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

  const { data: videoData,    isLoading }               = useGetVideoByIdQuery(videoId)
  const { data: commentsData, refetch: refetchComments } = useGetVideoCommentsQuery(
    { videoId, page: 1, limit: 50 }
  )
  const { data: subscribedData } = useGetSubscribedChannelsQuery(undefined, { skip: !user })

  const [addComment, { isLoading: isCommenting }] = useAddCommentMutation()
  const [toggleLike] = useToggleVideoLikeMutation()
  const [toggleSub]  = useToggleSubscriptionMutation()

  const video    = videoData?.data
  const comments = commentsData?.data || []

  useEffect(() => {
    if (video) {
      setLikeCount(video.likeCount ?? 0)
      setLiked(video.isLiked ?? false)
    }
  }, [video])

  useEffect(() => {
    const handler = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShowShare(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const subscribedChannels = subscribedData?.data || []
  const isOwnVideo   = user && video?.owner?._id && String(user._id) === String(video.owner._id)
  const isSubscribed = !isOwnVideo && subscribedChannels.some(
    (sub) => String(sub.channel?._id) === String(video?.owner?._id)
  )

  const handleLike = async () => {
    if (!user) return toast.error('Sign in to like videos')
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((p) => Math.max(0, wasLiked ? p - 1 : p + 1))
    try {
      await toggleLike(videoId).unwrap()
      toast.success(wasLiked ? 'Like removed' : 'Liked ❤️')
    } catch {
      setLiked(wasLiked)
      setLikeCount((p) => Math.max(0, wasLiked ? p + 1 : p - 1))
      toast.error('Something went wrong')
    }
  }

  const handleSubscribe = async () => {
    if (!video?.owner?._id || !user) return toast.error('Sign in to subscribe')
    if (isOwnVideo) return toast.error('You cannot subscribe to your own channel')
    setSubLoading(true)
    try {
      await toggleSub(video.owner._id).unwrap()
      toast.success(isSubscribed ? 'Unsubscribed' : 'Subscribed! 🔔')
    } catch {
      toast.error('Failed to toggle subscription')
    } finally {
      setSubLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    try {
      await addComment({ videoId, content: commentText }).unwrap()
      setCommentText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      refetchComments()
      toast.success('Comment posted!')
    } catch {
      toast.error('Failed to post comment')
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
    setShowShare(false)
  }

  const handleTweet = () => {
    const text = encodeURIComponent(`Watching "${video?.title}" on FaseehVision 🎬\n${window.location.href}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    setShowShare(false)
  }

  if (isLoading) return <WatchSkeleton />

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-white/8">
          <Play size={36} className="text-zinc-700 ml-1" />
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-2">Video not found</h2>
        <p className="text-zinc-500 text-sm mb-6">This video may have been removed or made private.</p>
        <Link
          to="/"
          className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-2xl text-sm font-bold transition-all hover:scale-105"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%)  skewX(-12deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 fade-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 min-w-0">

            {/* ── VIDEO PLAYER ── */}
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/70 ring-1 ring-white/8">
              <VideoPlayer src={video.videofile} poster={video.thumbnail} />
            </div>

            {/* ── TITLE ── */}
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mt-5 mb-1">
              {video.title}
            </h1>

            {/* ── META ROW ── */}
            <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {formatNum(video.views)} views
              </span>
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(video.createdAt)}
              </span>
            </div>

            {/* ── CHANNEL ROW + ACTION BUTTONS ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap py-4 border-y border-white/8">
              <div className="flex items-center gap-3">
                <Link to={`/channel/${video.owner?.username}`} className="flex-shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/10
                                  hover:ring-red-500/50 transition-all duration-300">
                    <img
                      src={video.owner?.avatar || '/default-avatar.png'}
                      alt={video.owner?.fullname}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/default-avatar.png' }}
                    />
                  </div>
                </Link>
                <div>
                  <Link
                    to={`/channel/${video.owner?.username}`}
                    className="font-bold text-sm hover:text-red-400 transition-colors leading-tight block"
                  >
                    {video.owner?.fullname}
                  </Link>
                  <p className="text-xs text-zinc-500 mt-0.5">@{video.owner?.username}</p>
                </div>

                {!isOwnVideo ? (
                  <button
                    onClick={handleSubscribe}
                    disabled={subLoading}
                    className={`ml-1 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                                transition-all disabled:opacity-60
                                ${isSubscribed
                                  ? 'bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/10'
                                  : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 hover:scale-105'
                                }`}
                  >
                    {subLoading
                      ? <Loader2 size={13} className="animate-spin" />
                      : isSubscribed ? <BellOff size={13} /> : <Bell size={13} />
                    }
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                ) : (
                  <span className="ml-1 px-3 py-1.5 text-xs text-zinc-500 bg-white/5 rounded-xl border border-white/8">
                    Your video
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center bg-white/8 rounded-xl overflow-hidden border border-white/8">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold
                                transition-all border-r border-white/8
                                ${liked
                                  ? 'text-red-400 bg-red-600/15'
                                  : 'text-zinc-300 hover:bg-white/8 hover:text-white'
                                }`}
                  >
                    <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
                    <span>{formatNum(likeCount)}</span>
                  </button>
                  <button className="px-3 py-2 text-zinc-500 hover:bg-white/8 hover:text-zinc-300 transition-colors">
                    <ThumbsDown size={16} />
                  </button>
                </div>

                <div className="relative" ref={shareRef}>
                  <button
                    onClick={() => setShowShare(!showShare)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/8 hover:bg-white/14
                               rounded-xl text-sm font-bold border border-white/8
                               transition-all text-zinc-300 hover:text-white"
                  >
                    <Share2 size={15} />
                    <span className="hidden sm:inline">Share</span>
                  </button>

                  {showShare && (
                    <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-white/10
                                    rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-30 w-52
                                    animate-[fadeUp_0.2s_ease_both]">
                      <div className="px-4 py-3 border-b border-white/8">
                        <p className="text-xs text-zinc-500 font-semibold">Share this video</p>
                      </div>
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/6
                                   text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                      >
                        {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                        Copy link
                      </button>
                      <button
                        onClick={handleTweet}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/6
                                   text-sm font-medium text-zinc-300 hover:text-white transition-colors border-t border-white/6"
                      >
                        <span className="font-black text-sky-400 text-base leading-none">𝕏</span>
                        Share on X
                      </button>
                    </div>
                  )}
                </div>

                <button className="w-9 h-9 flex items-center justify-center bg-white/8 hover:bg-white/14
                                   rounded-xl border border-white/8 text-zinc-400 hover:text-white transition-all">
                  <MoreHorizontal size={17} />
                </button>
              </div>
            </div>

            {/* ── DESCRIPTION ── */}
            <div className="mt-4 bg-zinc-900/70 border border-white/8 rounded-2xl p-5
                            hover:border-white/12 transition-colors">
              <p className={`text-sm text-zinc-300 leading-relaxed whitespace-pre-line
                             ${!descExpanded ? 'line-clamp-3' : ''}`}>
                {video.description || 'No description provided.'}
              </p>
              {(video.description?.length ?? 0) > 150 && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="flex items-center gap-1 mt-3 text-xs font-bold text-zinc-400
                             hover:text-white transition-colors"
                >
                  {descExpanded
                    ? <><ChevronUp size={13} /> Show less</>
                    : <><ChevronDown size={13} /> Show more</>
                  }
                </button>
              )}
            </div>

            {/* ── COMMENTS ── */}
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-white/6 rounded-xl flex items-center justify-center">
                  <MessageCircle size={16} className="text-zinc-400" />
                </div>
                <h2 className="font-black text-lg tracking-tight">
                  {formatNum(comments.length)}{' '}
                  <span className="font-normal text-zinc-500">
                    {comments.length === 1 ? 'Comment' : 'Comments'}
                  </span>
                </h2>
              </div>

              {user ? (
                <form onSubmit={handleAddComment} className="flex gap-3 mb-8">
                  <Link to={`/channel/${user.username}`} className="flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10
                                    hover:ring-red-500/40 transition-all">
                      <img
                        src={user.avatar || '/default-avatar.png'}
                        alt={user.username}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/default-avatar.png' }}
                      />
                    </div>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-end gap-2 bg-white/5 border border-white/10
                                    rounded-2xl px-4 py-3 focus-within:border-red-500/40
                                    focus-within:bg-white/7 transition-all">
                      <textarea
                        ref={textareaRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment(e)
                        }}
                        onInput={(e) => {
                          e.target.style.height = 'auto'
                          e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        placeholder="Share your thoughts…"
                        rows={1}
                        className="flex-1 bg-transparent text-sm outline-none resize-none
                                   placeholder-zinc-600 text-zinc-200 leading-relaxed"
                        style={{ minHeight: '24px', maxHeight: '160px' }}
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim() || isCommenting}
                        className="flex-shrink-0 w-8 h-8 bg-red-600 hover:bg-red-500
                                   disabled:bg-zinc-800 disabled:cursor-not-allowed
                                   rounded-xl flex items-center justify-center transition-all
                                   hover:scale-110 active:scale-95"
                        title="Post (Ctrl+Enter)"
                      >
                        {isCommenting
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Send size={13} />
                        }
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-700 mt-1.5 ml-1">Ctrl+Enter to post</p>
                  </div>
                </form>
              ) : (
                <div className="mb-8 p-5 bg-white/4 rounded-2xl border border-white/8 text-center">
                  <p className="text-sm text-zinc-400">
                    <Link to="/login" className="text-red-400 hover:text-red-300 font-bold transition-colors">
                      Sign in
                    </Link>{' '}
                    to join the conversation
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="w-16 h-16 bg-white/4 rounded-3xl flex items-center justify-center mb-4">
                      <MessageCircle size={26} className="text-zinc-700" />
                    </div>
                    <p className="text-zinc-500 font-semibold text-sm mb-1">No comments yet</p>
                    <p className="text-zinc-700 text-xs">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment, i) => (
                    <div
                      key={comment._id}
                      className="fade-up"
                      style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                    >
                      <CommentItem comment={comment} currentUser={user} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 px-1">
                Up Next
              </h3>
              <div className="flex flex-col items-center justify-center py-16
                              border border-dashed border-white/10 rounded-2xl text-center">
                <div className="w-14 h-14 bg-white/4 rounded-2xl flex items-center justify-center mb-3">
                  <Play size={22} className="text-zinc-700 ml-0.5" />
                </div>
                <p className="text-zinc-500 text-sm font-semibold">Related videos</p>
                <p className="text-zinc-700 text-xs mt-1">Coming soon</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}