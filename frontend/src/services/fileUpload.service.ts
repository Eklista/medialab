// En un nuevo archivo: fileUpload.service.ts
import apiClient, { handleApiError } from './api';

class FileUploadService {
  async uploadImage(file: File, type: 'profile' | 'banner'): Promise<string> {
    try {
      // Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // Configuración especial para FormData
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      
      // Enviar la solicitud al endpoint de subida
      const response = await apiClient.post<{url: string}>('/users/upload-image', formData, config);
      
      return response.data.url;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw new Error(handleApiError(error));
    }
  }
}

export default new FileUploadService();