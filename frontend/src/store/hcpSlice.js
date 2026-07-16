import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

// Async thunks for HCP actions
export const fetchHCPs = createAsyncThunk('hcp/fetchHCPs', async (_, { rejectWithValue }) => {
  try {
    return await api.getHCPs();
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchHCPById = createAsyncThunk('hcp/fetchHCPById', async (id, { rejectWithValue }) => {
  try {
    return await api.getHCPById(id);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const createHCP = createAsyncThunk('hcp/createHCP', async (hcpData, { rejectWithValue }) => {
  try {
    return await api.createHCP(hcpData);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateHCP = createAsyncThunk('hcp/updateHCP', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await api.updateHCP(id, data);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const deleteHCP = createAsyncThunk('hcp/deleteHCP', async (id, { rejectWithValue }) => {
  try {
    await api.deleteHCP(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const initialState = {
  list: [],
  selectedHCP: null,
  loading: false,
  error: null,
  actionLoading: false,
};

const hcpSlice = createSlice({
  name: 'hcp',
  initialState,
  reducers: {
    clearSelectedHCP: (state) => {
      state.selectedHCP = null;
    },
    clearHCPError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch HCPs
      .addCase(fetchHCPs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHCPs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchHCPs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch HCP By ID
      .addCase(fetchHCPById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHCPById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedHCP = action.payload;
      })
      .addCase(fetchHCPById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create HCP
      .addCase(createHCP.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createHCP.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.list.unshift(action.payload);
      })
      .addCase(createHCP.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update HCP
      .addCase(updateHCP.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateHCP.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.list = state.list.map((hcp) => (hcp.id === action.payload.id ? action.payload : hcp));
        if (state.selectedHCP && state.selectedHCP.id === action.payload.id) {
          state.selectedHCP = action.payload;
        }
      })
      .addCase(updateHCP.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete HCP
      .addCase(deleteHCP.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteHCP.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.list = state.list.filter((hcp) => hcp.id !== action.payload);
        if (state.selectedHCP && state.selectedHCP.id === action.payload) {
          state.selectedHCP = null;
        }
      })
      .addCase(deleteHCP.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedHCP, clearHCPError } = hcpSlice.actions;
export default hcpSlice.reducer;
