// src/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8000',
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
  tagTypes: ['User', 'Video', 'Comment', 'Like', 'Playlist', 'Subscription', 'Dashboard'],
  endpoints: (builder) => ({

    // ====================== AUTH ======================
    register: builder.mutation({
      query: (formData) => ({
        url: '/api/v1/user/Register',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),

    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/v1/user/Login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/api/v1/user/logout',
        method: 'POST',
      }),
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

    // ====================== VIDEO ======================
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
      query: (formData) => ({
        url: '/api/v2/video/Publish',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Video', 'Dashboard'],
    }),

    // ====================== LIKE ======================
    toggleVideoLike: builder.mutation({
      query: (videoid) => ({
        url: `/api/v6/like/likevideo/videoid/${videoid}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Video'],
    }),

    getLikedVideos: builder.query({
      query: () => '/api/v6/like/getalllikevideos',
      providesTags: ['Like'],
    }),

    // ====================== COMMENT ======================
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

    // ====================== SUBSCRIPTION ======================
    toggleSubscription: builder.mutation({
      query: (channalid) => ({
        url: `/api/v9/subcription/toggle/${channalid}`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    getSubscribedChannels: builder.query({
      query: () => '/api/v9/subcription/getsubcribedchananl/:subscribeID',
      providesTags: ['Subscription'],
    }),

    // ====================== DASHBOARD ======================
    getChannelStats: builder.query({
      query: () => '/api/v7/dashbaord/getallchannelstats',
      providesTags: ['Dashboard'],
    }),

    getMyVideos: builder.query({
      query: () => '/api/v7/dashbaord/getallvideouplode',
      providesTags: ['Video'],
    }),

    // ====================== PLAYLIST ======================
    createPlaylist: builder.mutation({
      query: ({ name, description }) => ({
        url: '/api/v3/playlist/createplaylist',
        method: 'POST',
        body: { name, description },
      }),
      invalidatesTags: ['Playlist'],
    }),

    getUserPlaylists: builder.query({
      query: (userid) => `/api/v3/playlist/getuserplay/${userid}`,
      providesTags: ['Playlist'],
    }),

  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useGetChannelProfileQuery,
  useGetAllVideosQuery,
  useGetVideoByIdQuery,
  usePublishVideoMutation,
  useToggleVideoLikeMutation,
  useGetLikedVideosQuery,
  useGetVideoCommentsQuery,
  useAddCommentMutation,
  useToggleSubscriptionMutation,
  useGetSubscribedChannelsQuery,
  useGetChannelStatsQuery,
  useGetMyVideosQuery,
  useCreatePlaylistMutation,
  useGetUserPlaylistsQuery,
} = apiSlice