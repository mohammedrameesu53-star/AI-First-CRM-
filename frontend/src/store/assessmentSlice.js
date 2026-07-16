import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';
import { fetchHCPById } from './hcpSlice';

// Async thunk to submit transcript for assessment
export const evaluateTranscript = createAsyncThunk(
  'assessment/evaluateTranscript',
  async ({ hcpId, transcript }, { dispatch, rejectWithValue }) => {
    try {
      const assessmentResult = await api.createAssessment(hcpId, transcript);
      // Re-fetch the HCP to ensure the new assessment is loaded in details
      dispatch(fetchHCPById(hcpId));
      return assessmentResult;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentAssessment: null,
  loading: false,
  error: null,
};

const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,
  reducers: {
    clearCurrentAssessment: (state) => {
      state.currentAssessment = null;
    },
    clearAssessmentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(evaluateTranscript.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(evaluateTranscript.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAssessment = action.payload;
      })
      .addCase(evaluateTranscript.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentAssessment, clearAssessmentError } = assessmentSlice.actions;
export default assessmentSlice.reducer;
