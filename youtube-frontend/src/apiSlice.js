// src/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
  baseUrl: 'https://node-chai-production.up.railway.app/',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.accessToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['User', 'Video', 'Comment', 'Like', 'Playlist', 'Subscription', 'Dashboard', 'Tweet'],
  endpoints: (builder) => ({

    // ── AUTH ────────────────────────────────────────────────────────────────
    register: builder.mutation({
      query: (formData) => ({ url: '/api/v1/user/Register', method: 'POST', body: formData }),
      invalidatesTags: ['User'],
    }),
    login: builder.mutation({
      query: (credentials) => ({ url: '/api/v1/user/Login', method: 'POST', body: credentials }),
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation({
      query: () => ({ url: '/api/v1/user/logout', method: 'POST' }),
      invalidatesTags: ['User'],
    }),
    getCurrentUser: builder.query({
      query: () => '/api/v1/user/current-user',
      providesTags: ['User'],
    }),
    getChannelProfile: builder.query({
      query: (username) => `/api/v1/user/c/${username}`,
      providesTags: ['User'],
    }),

    // ── PROFILE EDIT ────────────────────────────────────────────────────────
    updateAccount: builder.mutation({
      query: (data) => ({ url: '/api/v1/user/update-account', method: 'PATCH', body: data }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation({
      query: (data) => ({ url: '/api/v1/user/change-passward', method: 'POST', body: data }),
      invalidatesTags: ['User'],
    }),
    updateAvatar: builder.mutation({
      query: (formData) => ({ url: '/api/v1/user/avatar', method: 'PATCH', body: formData }),
      invalidatesTags: ['User'],
    }),
    updateCoverImage: builder.mutation({
      query: (formData) => ({ url: '/api/v1/user/coverimage', method: 'PATCH', body: formData }),
      invalidatesTags: ['User'],
    }),

    // ── VIDEO ────────────────────────────────────────────────────────────────
    getAllVideos: builder.query({
      query: ({ page = 1, limit = 12, query = '', userId = '' }) =>
        `/api/v2/video/getallvideos?page=${page}&limit=${limit}&query=${query}&userId=${userId}`,
      providesTags: ['Video'],
    }),
    getVideoById: builder.query({
      query: (videoId) => `/api/v2/video/getvideobyid/${videoId}`,
      providesTags: ['Video'],
    }),
    publishVideo: builder.mutation({
      query: (formData) => ({ url: '/api/v2/video/Publish', method: 'POST', body: formData }),
      invalidatesTags: ['Video', 'Dashboard'],
    }),
    deleteVideo: builder.mutation({
      query: (videoId) => ({ url: `/api/v2/video/deletevideo/${videoId}`, method: 'DELETE' }),
      invalidatesTags: ['Video', 'Dashboard'],
    }),
    updateVideo: builder.mutation({
      query: ({ videoId, formData }) => ({ url: `/api/v2/video/updatevideo/${videoId}`, method: 'PATCH', body: formData }),
      invalidatesTags: ['Video', 'Dashboard'],
    }),
    togglePublish: builder.mutation({
      query: (videoId) => ({ url: `/api/v2/video/togglepublish/${videoId}`, method: 'POST' }),
      invalidatesTags: ['Video', 'Dashboard'],
    }),

    // ── LIKE ─────────────────────────────────────────────────────────────────
    toggleVideoLike: builder.mutation({
      query: (videoid) => ({ url: `/api/v6/like/likevideo/videoid/${videoid}`, method: 'PATCH' }),
      invalidatesTags: ['Like', 'Video'],
    }),
    toggleCommentLike: builder.mutation({
      query: (commentId) => ({ url: `/api/v6/like/togglecomemnt/commentId/${commentId}`, method: 'PATCH' }),
      invalidatesTags: ['Like'],
    }),
    getLikedVideos: builder.query({
      query: () => '/api/v6/like/getalllikevideos',
      providesTags: ['Like'],
    }),

    // ── COMMENT ──────────────────────────────────────────────────────────────
    getVideoComments: builder.query({
      query: ({ videoId, page = 1, limit = 20 }) =>
        `/api/v4/comment/getallvideocomments/v/${videoId}?page=${page}&limit=${limit}`,
      providesTags: ['Comment'],
    }),
    addComment: builder.mutation({
      query: ({ videoId, content }) => ({
        url: `/api/v4/comment/addacomment/v/${videoId}`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Comment'],
    }),
    deleteComment: builder.mutation({
      query: (commentId) => ({ url: `/api/v4/comment/deletecomemnt/c/${commentId}`, method: 'DELETE' }),
      invalidatesTags: ['Comment'],
    }),
    updateComment: builder.mutation({
      query: ({ commentId, content }) => ({
        url: `/api/v4/comment/updatecomment/c/${commentId}`,
        method: 'PATCH',
        body: { content },
      }),
      invalidatesTags: ['Comment'],
    }),

    // ── SUBSCRIPTION ─────────────────────────────────────────────────────────
    toggleSubscription: builder.mutation({
      query: (channalid) => ({ url: `/api/v9/subscription/toggle/${channalid}`, method: 'POST' }),
      invalidatesTags: ['Subscription', 'User'],
    }),
    getSubscribedChannels: builder.query({
      query: () => `/api/v9/subscription/getsubcribedchananl`,
      providesTags: ['Subscription'],
    }),
    // Fetch all subscribers of the logged-in user's channel
    // Pass channelId (currentUser._id) from the component
    getChannelSubscribers: builder.query({
      query: (channelId) => `/api/v9/subscription/getchannalsubcribers/${channelId}`,
      providesTags: ['Subscription'],
    }),

    // ── DASHBOARD ─────────────────────────────────────────────────────────────
    getChannelStats: builder.query({
      query: () => '/api/v7/dashboard/getallchannelstats',
      providesTags: ['Dashboard'],
    }),
    getMyVideos: builder.query({
      query: () => '/api/v7/dashboard/getallvideouplode',
      providesTags: ['Video'],
    }),

    // ── PLAYLIST ─────────────────────────────────────────────────────────────
    createPlaylist: builder.mutation({
      query: ({ name, description }) => ({ url: '/api/v3/playlist/createplaylist', method: 'POST', body: { name, description } }),
      invalidatesTags: ['Playlist'],
    }),
    getUserPlaylists: builder.query({
      query: (userid) => `/api/v3/playlist/getuserplay/${userid}`,
      providesTags: ['Playlist'],
    }),
    addVideoToPlaylist: builder.mutation({
      query: ({ videoId, playlistId }) => ({
        url: `/api/v3/playlist/addvideotoplaylist/video/${videoId}/palylist/${playlistId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Playlist'],
    }),
    removeVideoFromPlaylist: builder.mutation({
      query: ({ videoId, playlistId }) => ({
        url: `/api/v3/playlist/removevideofromplaylist/video/${videoId}/palylist/${playlistId}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Playlist'],
    }),
    deletePlaylist: builder.mutation({
      query: (playlistId) => ({ url: `/api/v3/playlist/deleteplaylist/${playlistId}`, method: 'DELETE' }),
      invalidatesTags: ['Playlist'],
    }),
    updatePlaylist: builder.mutation({
      query: ({ playlistId, name, description }) => ({
        url: `/api/v3/playlist/updateplaylist/${playlistId}`,
        method: 'PATCH',
        body: { name, description },
      }),
      invalidatesTags: ['Playlist'],
    }),

    // ── TWEET ────────────────────────────────────────────────────────────────
    createTweet: builder.mutation({
      query: (tweetmessage) => ({ url: '/api/v5/tweet/createtweet', method: 'POST', body: { tweetmessage } }),
      invalidatesTags: ['Tweet'],
    }),
    getUserTweets: builder.query({
      query: () => '/api/v5/tweet/getusertweet',
      providesTags: ['Tweet'],
    }),
    deleteTweet: builder.mutation({
      query: (tweetid) => ({ url: `/api/v5/tweet/deletetweet/tweetid/${tweetid}`, method: 'DELETE' }),
      invalidatesTags: ['Tweet'],
    }),
    updateTweet: builder.mutation({
      query: ({ tweetid, tweetmessage }) => ({
        url: `/api/v5/tweet/updatetweet/tweetid/${tweetid}`,
        method: 'PATCH',
        body: { tweetmessage },
      }),
      invalidatesTags: ['Tweet'],
    }),

  }),
})

export const {
  // Auth
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useGetChannelProfileQuery,
  // Profile edit
  useUpdateAccountMutation,
  useChangePasswordMutation,
  useUpdateAvatarMutation,
  useUpdateCoverImageMutation,
  // Video
  useGetAllVideosQuery,
  useGetVideoByIdQuery,
  usePublishVideoMutation,
  useDeleteVideoMutation,
  useUpdateVideoMutation,
  useTogglePublishMutation,
  // Like
  useToggleVideoLikeMutation,
  useToggleCommentLikeMutation,
  useGetLikedVideosQuery,
  // Comment
  useGetVideoCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
  // Subscription
  useToggleSubscriptionMutation,
  useGetSubscribedChannelsQuery,
  useGetChannelSubscribersQuery,   // ← subscribers with avatars
  // Dashboard
  useGetChannelStatsQuery,
  useGetMyVideosQuery,
  // Playlist
  useCreatePlaylistMutation,
  useGetUserPlaylistsQuery,
  useAddVideoToPlaylistMutation,
  useRemoveVideoFromPlaylistMutation,
  useDeletePlaylistMutation,
  useUpdatePlaylistMutation,
  // Tweet
  useCreateTweetMutation,
  useGetUserTweetsQuery,
  useDeleteTweetMutation,
  useUpdateTweetMutation,
} = apiSlice