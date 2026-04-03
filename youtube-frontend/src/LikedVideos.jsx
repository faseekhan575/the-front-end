// src/LikedVideos.jsx
import { useGetLikedVideosQuery, useToggleVideoLikeMutation } from './apiSlice';
import { Link } from 'react-router-dom';
import { ThumbsUp, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const formatNum = (n) => {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n;
};

export default function LikedVideos() {
  const { data, isLoading, isError, refetch } = useGetLikedVideosQuery();
  const [toggleLike] = useToggleVideoLikeMutation();

  // Track liked videos + their current like counts locally
  const [localLiked, setLocalLiked] = useState(new Set());
  const [localLikeCounts, setLocalLikeCounts] = useState({});

  // Backend structure: [{ _id, videos: { ...full video } }]
  let likedItems = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  // Initialize local state when data loads
  useEffect(() => {
    if (likedItems.length > 0) {
      const likedIds = new Set(likedItems.map(item => item?.videos?._id).filter(Boolean));
      const counts = {};

      likedItems.forEach(item => {
        const video = item?.videos;
        if (video?._id) {
          counts[video._id] = video.likes ?? 0;
        }
      });

      setLocalLiked(likedIds);
      setLocalLikeCounts(counts);
    }
  }, [data]);

  const handleToggleLike = async (videoId, currentCount, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!videoId) return;

    const wasLiked = localLiked.has(videoId);
    const newCount = wasLiked ? currentCount - 1 : currentCount + 1;

    // Optimistic update
    setLocalLiked(prev => {
      const newSet = new Set(prev);
      if (wasLiked) newSet.delete(videoId);
      else newSet.add(videoId);
      return newSet;
    });

    setLocalLikeCounts(prev => ({
      ...prev,
      [videoId]: Math.max(0, newCount)
    }));

    try {
      await toggleLike(videoId).unwrap();

      toast.success(wasLiked ? "Removed from liked videos" : "Liked ❤️");

      // If unliked → remove from list after short delay (smooth UX)
      if (wasLiked) {
        setTimeout(() => {
          refetch(); // Refresh full list from server
        }, 600);
      }
    } catch (err) {
      // Revert optimistic update on error
      setLocalLiked(prev => {
        const newSet = new Set(prev);
        if (wasLiked) newSet.add(videoId);
        else newSet.delete(videoId);
        return newSet;
      });

      setLocalLikeCounts(prev => ({
        ...prev,
        [videoId]: currentCount
      }));

      toast.error("Failed to update like");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-white/6 rounded-xl w-48 mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <div className="aspect-video bg-white/6 rounded-2xl mb-3"></div>
              <div className="h-3.5 bg-white/6 rounded-xl w-3/4 mb-2"></div>
              <div className="h-3 bg-white/6 rounded-xl w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-32">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-semibold">Error loading liked videos</h2>
      </div>
    );
  }

  // Filter out any items that were unliked locally (until refetch happens)
  const displayedItems = likedItems.filter(item => {
    const vid = item?.videos?._id;
    return vid && localLiked.has(vid);
  });

  if (displayedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mb-6">
          <ThumbsUp size={36} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No liked videos yet</h2>
        <p className="text-zinc-400 text-sm max-w-sm">Videos you like will appear here. Start exploring!</p>
        <Link to="/" className="mt-6 bg-red-600 hover:bg-red-500 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
          Browse Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-red-600/15 rounded-2xl flex items-center justify-center">
          <ThumbsUp size={22} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Liked Videos</h1>
          <p className="text-zinc-400 text-sm">{displayedItems.length} videos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {displayedItems.map((item) => {
          const video = item?.videos;
          if (!video?._id) return null;

          const isLiked = localLiked.has(video._id);
          const likeCount = localLikeCounts[video._id] ?? (video.likes || 0);

          return (
            <Link 
              to={`/watch/${video._id}`} 
              key={video._id} 
              className="group relative"
            >
              <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden mb-3">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { e.target.src = '/default-thumbnail.png'; }}
                />
                
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-2 py-0.5 rounded-lg font-semibold">
                    {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                  </div>
                )}

                {/* Like Button with Count */}
                <button
                  onClick={(e) => handleToggleLike(video._id, likeCount, e)}
                  className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 hover:bg-black/90 px-3 py-1 rounded-full transition-all hover:scale-105 z-10"
                >
                  <ThumbsUp 
                    size={18} 
                    className={`transition-all ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} 
                  />
                  <span className="text-xs font-medium text-white">{formatNum(likeCount)}</span>
                </button>
              </div>

              <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-red-400 transition-colors">
                {video.title}
              </h3>
              
              <Link 
                to={`/channel/${video.owner?.username}`} 
                onClick={e => e.stopPropagation()}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors block"
              >
                {video.owner?.fullname || 'Unknown'}
              </Link>
              
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <Eye size={11} />
                <span>{formatNum(video.views)} views</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}