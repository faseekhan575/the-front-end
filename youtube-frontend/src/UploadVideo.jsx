// src/UploadVideo.jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePublishVideoMutation } from './apiSlice'
import { toast } from 'sonner'
import { Upload, Film, Image, X, CheckCircle2, ArrowRight } from 'lucide-react'

export default function UploadVideo() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videofile, setVideofile] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(null)

  const navigate = useNavigate()
  const [publishVideo] = usePublishVideoMutation()

  const handleThumbnail = (file) => {
    if (file) {
      setThumbnail(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleDrop = (e, type) => {
    e.preventDefault()
    setDragOver(null)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (type === 'video' && file.type.startsWith('video/')) setVideofile(file)
    else if (type === 'thumbnail' && file.type.startsWith('image/')) handleThumbnail(file)
    else toast.error("Invalid file type")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !description || !videofile || !thumbnail) {
      toast.error("Please fill all fields and select files")
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('videofile', videofile)
    formData.append('thumbnail', thumbnail)
    try {
      await publishVideo(formData).unwrap()
      toast.success("Video uploaded successfully! 🎉")
      navigate('/')
    } catch (err) {
      toast.error(err?.data?.message || "Failed to upload video")
    } finally {
      setIsUploading(false)
    }
  }

  const steps = [
    { label: 'Video file', done: !!videofile },
    { label: 'Thumbnail', done: !!thumbnail },
    { label: 'Title', done: !!title.trim() },
    { label: 'Description', done: !!description.trim() },
  ]
  const progress = Math.round((steps.filter(s => s.done).length / steps.length) * 100)

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Upload Video</h1>
        <p className="text-zinc-400 text-sm">Share your content with the FaseehVision community</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400 font-medium">Upload progress</span>
          <span className="text-xs font-semibold text-red-400">{progress}%</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3">
          {steps.map((step) => (
            <div key={step.label} className={`flex items-center gap-1.5 text-xs ${step.done ? 'text-emerald-400' : 'text-zinc-600'}`}>
              <CheckCircle2 size={13} />
              {step.label}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video file drop zone */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Video File</label>
          <label
            className={`relative cursor-pointer flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 transition-all ${
              dragOver === 'video'
                ? 'border-red-500 bg-red-500/5'
                : videofile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/15 hover:border-white/25 hover:bg-white/3'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver('video') }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, 'video')}
          >
            <input type="file" accept="video/*" onChange={(e) => setVideofile(e.target.files[0])} className="hidden" />
            {videofile ? (
              <>
                <CheckCircle2 size={36} className="text-emerald-400" />
                <div className="text-center">
                  <p className="font-semibold text-sm text-emerald-400">{videofile.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{(videofile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setVideofile(null) }}
                  className="absolute top-3 right-3 w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-white/6 rounded-2xl flex items-center justify-center">
                  <Film size={26} className="text-zinc-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">Drop video here or click to browse</p>
                  <p className="text-xs text-zinc-500 mt-1">MP4, MOV, AVI supported</p>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Thumbnail</label>
          <label
            className={`relative cursor-pointer flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl transition-all overflow-hidden ${
              dragOver === 'thumb'
                ? 'border-red-500'
                : thumbnail
                  ? 'border-emerald-500/50'
                  : 'border-white/15 hover:border-white/25'
            }`}
            style={{ minHeight: '140px' }}
            onDragOver={(e) => { e.preventDefault(); setDragOver('thumb') }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, 'thumbnail')}
          >
            <input type="file" accept="image/*" onChange={(e) => handleThumbnail(e.target.files[0])} className="hidden" />
            {thumbnailPreview ? (
              <>
                <img src={thumbnailPreview} alt="thumbnail" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setThumbnail(null); setThumbnailPreview(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6">
                <div className="w-12 h-12 bg-white/6 rounded-2xl flex items-center justify-center">
                  <Image size={22} className="text-zinc-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">Upload thumbnail</p>
                  <p className="text-xs text-zinc-500 mt-0.5">JPG, PNG, WEBP • 16:9 ratio recommended</p>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            placeholder="Give your video a catchy title..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
          />
          <p className="text-right text-xs text-zinc-600 mt-1">{title.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Tell viewers about your video..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading || progress < 100}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-red-900/20"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading... Please wait
            </>
          ) : (
            <>
              <Upload size={18} />
              Publish Video
              <ArrowRight size={16} />
            </>
          )}
        </button>
        {progress < 100 && !isUploading && (
          <p className="text-center text-xs text-zinc-500">Complete all fields above to publish</p>
        )}
      </form>
    </div>
  )
}