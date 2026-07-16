import { configureStore } from '@reduxjs/toolkit';
import hcpReducer from './hcpSlice';
import assessmentReducer from './assessmentSlice';

export const store = configureStore({
  reducer: {
    hcp: hcpReducer,
    assessment: assessmentReducer,
  },
  // Redux Toolkit automatically adds default middlewares (thunk, devtools, etc.)
  devTools: process.env.NODE_ENV !== 'production',
});
