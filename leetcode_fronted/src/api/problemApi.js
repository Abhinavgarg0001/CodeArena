import axiosClient from '../utils/axiosClient';

export const problemApi = {
  getAllProblems: () => axiosClient.get('/problem/getAllProblem'),
  
  getProblemById: (id) => axiosClient.get(`/problem/problemById/${id}`),
  
  getSolvedProblems: () => axiosClient.get('/problem/problemSolvedByUser'),
  
  getSubmissions: (problemId) => axiosClient.get(`/problem/problemSolved/${problemId}`),

  getMySubmissions: () => axiosClient.get('/problem/mySubmissions'),

  getSubmissionById: (id) => axiosClient.get(`/problem/submission/${id}`),
  
  submitCode: (problemId, code, language) => 
    axiosClient.post(`/code/submit/${problemId}`, { code, language }),
  
  runCode: (problemId, code, language) => 
    axiosClient.post(`/code/run/${problemId}`, { code, language }),

  createProblem: (data) =>
    axiosClient.post('/problem/create', data),

  updateProblem: (id, data) =>
    axiosClient.put(`/problem/update/${id}`, data),

  deleteProblem: (id) =>
    axiosClient.delete(`/problem/delete/${id}`),
};

export const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (userData) => axiosClient.post('/auth/register', userData),
  registerAdmin: (userData) => axiosClient.post('/auth/admin/register', userData),
  logout: () => axiosClient.post('/auth/logout'),
  checkAuth: () => axiosClient.get('/auth/check'),
  deleteProfile: (password) => axiosClient.delete('/auth/deleteProfile', { data: { password } }),
};