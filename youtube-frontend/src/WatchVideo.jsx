// src/WatchVideo.jsx
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import {
  useGetVideoByIdQuery,
  useGetVideoCommentsQuery,
  useAddCommentMutation,
  useToggleVideoLikeMutation,
  useToggleSubscriptionMutation
} from './apiSlice'
import {
  ThumbsUp, ThumbsDown, Share2, MessageCircle,
  Bell, MoreHorizontal, Flag, ChevronDown, ChevronUp,
  Heart, Send, Copy, Check
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + "y ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + "mo ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + "d ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + "h ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + "m ago"
  return "just now"
}

const formatNum = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n
}

function CommentItem({ comment, currentUser }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 80))
  const [showReply, setShowReply] = useState(false)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  return (
    <div className="flex gap-3 group">
      <Link to={`/channel/${comment.owner?.username}`} className="flex-shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10">
          <img src={comment.owner?.avatar} alt={comment.owner?.username} className="w-full h-full object-cover" />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Link to={`/channel/${comment.owner?.username}`} className="text-sm font-semibold hover:text-red-400 transition-colors">
            @{comment.owner?.username}
          </Link>
          <span className="text-xs text-zinc-500">{timeAgo(comment.createdAt)}</span>
        </div>

        <p className="text-sm text-zinc-200 leading-relaxed">{comment.content}</p>

        {/* Comment actions */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-400' : 'text-zinc-500 hover:text-white'}`}
          >
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-zinc-500 hover:text-white transition-colors font-medium"
          >
            Reply
          </button>
          <button className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100">
            <Flag size={13} />
          </button>
        </div>

        {showReply && currentUser && (
          <div className="mt-3 flex gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
              <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <input
              placeholder={`Reply to @${comment.owner?.username}...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function WatchVideo() {
  const { videoId } = useParams()
  const [commentText, setCommentText] = useState('')
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [subscribed, setSubscribed] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const { data: videoData, isLoading } = useGetVideoByIdQuery(videoId)
  const { data: commentsData, refetch: refetchComments } = useGetVideoCommentsQuery({ videoId, page: 1, limit: 50 })
  const [addComment, { isLoading: isCommenting }] = useAddCommentMutation()
  const [toggleLike] = useToggleVideoLikeMutation()
  const [toggleSub] = useToggleSubscriptionMutation()

  const video = videoData?.data
  const comments = commentsData?.data || []
  const user = useSelector((state) => state.auth.user)

  const handleLike = async () => {
    try {
      await toggleLike(videoId).unwrap()
      setLiked(!liked)
      setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    } catch {
      toast.error("Something went wrong")
    }
  }

  const handleSubscribe = async () => {
    if (!video?.owner?._id) return
    try {
      await toggleSub(video.owner._id).unwrap()
      setSubscribed(!subscribed)
      toast.success(subscribed ? "Unsubscribed" : "Subscribed! 🔔")
    } catch {
      toast.error("Failed to toggle subscription")
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    try {
      await addComment({ videoId, content: commentText }).unwrap()
      setCommentText('')
      refetchComments()
      toast.success("Comment posted!")
    } catch {
      toast.error("Failed to post comment")
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    })
    setShowShare(false)
  }

  const handleTweet = () => {
    const text = encodeURIComponent(`Watching "${video?.title}" on FaseehVision 🎬\n${window.location.href}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="aspect-video bg-white/6 rounded-2xl mb-4"></div>
            <div className="h-6 bg-white/6 rounded-xl w-3/4 mb-3"></div>
            <div className="h-4 bg-white/6 rounded-xl w-1/2"></div>
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-32 h-20 bg-white/6 rounded-xl flex-shrink-0"></div>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-white/6 rounded w-full"></div>
                  <div className="h-3 bg-white/6 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="text-center py-32">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-xl font-semibold">Video not found</h2>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Video + Info ── */}
        <div className="lg:col-span-2">
          {/* Player */}
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            <video
              src={video.videofile}
              controls
              autoPlay
              className="w-full h-full"
            />
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold leading-tight mt-4 mb-3">{video.title}</h1>

          {/* Channel row + actions */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/8">
            {/* Channel */}
            <div className="flex items-center gap-3">
              <Link to={`/channel/${video.owner?.username}`}>
                <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-red-500/50 transition-all">
                  <img src={video.owner?.avatar} alt="" className="w-full h-full object-cover" />
                </div>
              </Link>
              <div>
                <Link to={`/channel/${video.owner?.username}`} className="font-semibold hover:text-red-400 transition-colors text-sm block">
                  {video.owner?.fullname}
                </Link>
                <p className="text-xs text-zinc-400">@{video.owner?.username}</p>
              </div>
              <button
                onClick={handleSubscribe}
                className={`ml-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  subscribed
                    ? 'bg-white/10 hover:bg-white/15 text-zinc-300'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'
                }`}
              >
                {subscribed ? (
                  <><Bell size={15} /> Subscribed</>
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Like / Dislike group */}
              <div className="flex items-center bg-white/8 rounded-xl overflow-hidden border border-white/8">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-r border-white/8 ${
                    liked ? 'text-red-400 bg-red-600/15' : 'hover:bg-white/8 text-zinc-300'
                  }`}
                >
                  <ThumbsUp size={17} fill={liked ? 'currentColor' : 'none'} />
                  <span>{formatNum(likeCount || video.likes || 0)}</span>
                </button>
                <button className="px-3 py-2 hover:bg-white/8 text-zinc-400 transition-colors">
                  <ThumbsDown size={17} />
                </button>
              </div>

              {/* Share */}
              <div className="relative">
                <button
                  onClick={() => setShowShare(!showShare)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/8 hover:bg-white/12 rounded-xl text-sm font-medium border border-white/8 transition-all"
                >
                  <Share2 size={16} />
                  Share
                </button>
                {showShare && (
                  <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20 w-48">
                    <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 text-sm transition-colors">
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      Copy link
                    </button>
                    <button onClick={handleTweet} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 text-sm transition-colors">
                      <span className="font-bold text-sky-400 text-base leading-none">𝕏</span>
                      Share on X
                    </button>
                  </div>
                )}
              </div>

              <button className="w-9 h-9 flex items-center justify-center bg-white/8 hover:bg-white/12 rounded-xl border border-white/8 transition-all">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4 bg-white/4 rounded-2xl p-4 border border-white/6">
            <div className="flex items-center gap-4 text-sm text-zinc-400 mb-3">
              <span className="font-semibold text-white">{formatNum(video.views)} views</span>
              <span>{new Date(video.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <p className={`text-sm text-zinc-300 leading-relaxed whitespace-pre-line ${!descExpanded ? 'line-clamp-3' : ''}`}>
              {video.description}
            </p>
            {video.description?.length > 150 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="flex items-center gap-1 mt-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                {descExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show more</>}
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle size={22} />
              <h2 className="text-lg font-bold">{comments.length} Comments</h2>
            </div>

            {/* Add comment */}
            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-3 mb-8">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-red-500/50 transition-all">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      rows={1}
                      className="flex-1 bg-transparent text-sm outline-none resize-none placeholder-zinc-600"
                      style={{ minHeight: '24px' }}
                      onInput={(e) => {
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isCommenting}
                      className="flex-shrink-0 w-8 h-8 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-white/4 rounded-2xl border border-white/8 text-center">
                <p className="text-sm text-zinc-400">
                  <Link to="/login" className="text-red-400 hover:text-red-300 font-semibold">Sign in</Link> to join the conversation
                </p>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-5">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
                  No comments yet. Be the first!
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentItem key={comment._id} comment={comment} currentUser={user} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-sm text-zinc-400 mb-4 uppercase tracking-wider">Up Next</h3>
          <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-zinc-500 text-sm">
            <div className="text-3xl mb-3">🎬</div>
            Related videos coming soon
          </div>
        </div>
      </div>
    </div>
  )
}