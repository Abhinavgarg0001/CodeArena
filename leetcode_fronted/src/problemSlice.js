import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { problemApi } from './api/problemApi';

export const fetchAllProblems = createAsyncThunk(
  'problems/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await problemApi.getAllProblems();
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      // Backend returns 404 when the DB is empty — treat as empty list
      if (error.response?.status === 404) {
        return [];
      }
      return rejectWithValue(error.response?.data || 'Failed to fetch problems');
    }
  }
);

export const fetchProblemById = createAsyncThunk(
  'problems/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await problemApi.getProblemById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch problem');
    }
  }
);

export const fetchSolvedProblems = createAsyncThunk(
  'problems/fetchSolved',
  async (_, { rejectWithValue }) => {
    try {
      const response = await problemApi.getSolvedProblems();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch solved problems');
    }
  }
);

export const fetchSubmissions = createAsyncThunk(
  'problems/fetchSubmissions',
  async (problemId, { rejectWithValue }) => {
    try {
      const response = await problemApi.getSubmissions(problemId);
      // Backend returns a plain string when there are no submissions
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch submissions');
    }
  }
);

export const fetchMySubmissions = createAsyncThunk(
  'problems/fetchMySubmissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await problemApi.getMySubmissions();
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch submissions');
    }
  }
);

export const fetchSubmissionById = createAsyncThunk(
  'problems/fetchSubmissionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await problemApi.getSubmissionById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch submission');
    }
  }
);

export const submitCode = createAsyncThunk(
  'problems/submitCode',
  async ({ problemId, code, language }, { rejectWithValue }) => {
    try {
      const response = await problemApi.submitCode(problemId, code, language);
      return { message: response.data, problemId };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Submission failed');
    }
  }
);

export const runCode = createAsyncThunk(
  'problems/runCode',
  async ({ problemId, code, language }, { rejectWithValue }) => {
    try {
      const response = await problemApi.runCode(problemId, code, language);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Run failed');
    }
  }
);

const serializeAdminError = (error) => {
  const data = error.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.message || data || error.message || 'Operation failed';
};

export const createProblem = createAsyncThunk(
  'problems/createProblem',
  async (problemData, { rejectWithValue }) => {
    try {
      const response = await problemApi.createProblem(problemData);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeAdminError(error));
    }
  }
);

export const updateProblem = createAsyncThunk(
  'problems/updateProblem',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await problemApi.updateProblem(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeAdminError(error));
    }
  }
);

export const deleteProblem = createAsyncThunk(
  'problems/deleteProblem',
  async (id, { rejectWithValue }) => {
    try {
      const response = await problemApi.deleteProblem(id);
      return { message: response.data, id };
    } catch (error) {
      return rejectWithValue(serializeAdminError(error));
    }
  }
);

const problemSlice = createSlice({
  name: 'problems',
  initialState: {
    list: [],
    currentProblem: null,
    currentSubmission: null,
    solvedProblems: [],
    submissions: [],
    loading: false,
    error: null,
    submitLoading: false,
    runLoading: false,
    runResult: null,
    submitResult: null,
    adminLoading: false,
    adminError: null,
    adminMessage: null,
  },
  reducers: {
    clearCurrentProblem: (state) => {
      state.currentProblem = null;
    },
    clearCurrentSubmission: (state) => {
      state.currentSubmission = null;
    },
    clearRunResult: (state) => {
      state.runResult = null;
    },
    clearSubmitResult: (state) => {
      state.submitResult = null;
    },
    clearAdminStatus: (state) => {
      state.adminError = null;
      state.adminMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Problems
      .addCase(fetchAllProblems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProblems.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Problem By ID
      .addCase(fetchProblemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProblemById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProblem = action.payload;
      })
      .addCase(fetchProblemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Solved Problems
      .addCase(fetchSolvedProblems.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSolvedProblems.fulfilled, (state, action) => {
        state.loading = false;
        state.solvedProblems = action.payload;
      })
      .addCase(fetchSolvedProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Submissions
      .addCase(fetchSubmissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload;
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Submission By ID (detail page)
      .addCase(fetchSubmissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentSubmission = null;
      })
      .addCase(fetchSubmissionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubmission = action.payload;
      })
      .addCase(fetchSubmissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch My Submissions (all problems)
      .addCase(fetchMySubmissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMySubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload;
      })
      .addCase(fetchMySubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit Code
      .addCase(submitCode.pending, (state) => {
        state.submitLoading = true;
        state.submitResult = null;
      })
      .addCase(submitCode.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.submitResult = action.payload;
      })
      .addCase(submitCode.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitResult = { error: action.payload };
      })
      // Run Code
      .addCase(runCode.pending, (state) => {
        state.runLoading = true;
        state.runResult = null;
      })
      .addCase(runCode.fulfilled, (state, action) => {
        state.runLoading = false;
        state.runResult = action.payload;
      })
      .addCase(runCode.rejected, (state, action) => {
        state.runLoading = false;
        state.runResult = { error: action.payload };
      })
      // Create Problem (admin)
      .addCase(createProblem.pending, (state) => {
        state.adminLoading = true;
        state.adminError = null;
        state.adminMessage = null;
      })
      .addCase(createProblem.fulfilled, (state, action) => {
        state.adminLoading = false;
        state.adminMessage = typeof action.payload === 'string' ? action.payload : 'Problem created successfully';
      })
      .addCase(createProblem.rejected, (state, action) => {
        state.adminLoading = false;
        state.adminError = action.payload;
      })
      // Update Problem (admin)
      .addCase(updateProblem.pending, (state) => {
        state.adminLoading = true;
        state.adminError = null;
        state.adminMessage = null;
      })
      .addCase(updateProblem.fulfilled, (state, action) => {
        state.adminLoading = false;
        state.adminMessage = typeof action.payload === 'string' ? action.payload : 'Problem updated successfully';
      })
      .addCase(updateProblem.rejected, (state, action) => {
        state.adminLoading = false;
        state.adminError = action.payload;
      })
      // Delete Problem (admin)
      .addCase(deleteProblem.pending, (state) => {
        state.adminLoading = true;
        state.adminError = null;
        state.adminMessage = null;
      })
      .addCase(deleteProblem.fulfilled, (state, action) => {
        state.adminLoading = false;
        state.adminMessage = typeof action.payload.message === 'string' ? action.payload.message : 'Problem deleted successfully';
        state.list = state.list.filter((p) => p._id !== action.payload.id);
      })
      .addCase(deleteProblem.rejected, (state, action) => {
        state.adminLoading = false;
        state.adminError = action.payload;
      });
  },
});

export const { clearCurrentProblem, clearCurrentSubmission, clearRunResult, clearSubmitResult, clearAdminStatus } = problemSlice.actions;
export default problemSlice.reducer;