import axios from 'axios';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
});

export const getTemplateInfo = async () => {
  const response = await apiClient.get('/template/info');
  return response.data;
};

export const uploadTemplate = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/template/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getStructure = async () => {
  const response = await apiClient.get('/structure');
  return response.data;
};

export const downloadFilteredDocument = async (selectedIds) => {
  const response = await apiClient.post('/generate', { selected_ids: selectedIds }, {
    responseType: 'blob',
  });
  
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'offerta.docx';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch && filenameMatch.length >= 2) {
      filename = filenameMatch[1];
    }
  }

  if (filename === 'offerta.docx') {
    const date = new Date().toISOString().split('T')[0];
    filename = `offerta_${date}.docx`;
  }
  
  return { blob: response.data, filename };
};
