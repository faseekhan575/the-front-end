// src/store.js
import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from './apiSlice'
import authReducer, { loadUserFromStorage } from './authSlice'

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
})

// Load user from localStorage when app starts
store.dispatch(loadUserFromStorage())

export default store