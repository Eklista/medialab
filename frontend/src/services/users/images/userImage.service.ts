// ===================================================================
// frontend/src/services/users/images/userImage.service.ts - 🆕 IMÁGENES
// ===================================================================
import apiClient, { handleApiError } from '../../api';

class UserImageService {
  /**
   * 📤 Sube imagen de perfil o banner
   */
  async uploadImage(file: File, type: 'profile' | 'banner'): Promise<string> {
    try {
      console.log(`📤 Subiendo imagen ${type}...`);
      
      // Validar archivo
      this.validateImageFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await apiClient.post<{url: string}>('/users/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log(`✅ Imagen ${type} subida: ${response.data.url}`);
      return response.data.url;
    } catch (error) {
      console.error(`❌ Error subiendo imagen ${type}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🖼️ Obtiene URL completa de imagen
   */
  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath || imagePath.trim() === '') return '';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseUrl = import.meta.env.MODE === 'production' 
      ? window.location.origin 
      : 'http://localhost:8000';
    
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${path}`;
  }

  /**
   * ✅ Valida archivo de imagen
   */
  private validateImageFile(file: File): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 5MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no válido. Use JPG, PNG, GIF o WebP');
    }
  }

  /**
   * 🗑️ Elimina imagen de perfil o banner
   */
  async deleteImage(type: 'profile' | 'banner'): Promise<void> {
    try {
      console.log(`🗑️ Eliminando imagen ${type}...`);
      
      await apiClient.delete(`/users/images/${type}`);
      console.log(`✅ Imagen ${type} eliminada`);
    } catch (error) {
      console.error(`❌ Error eliminando imagen ${type}:`, error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🎨 Genera avatar con iniciales
   */
  generateAvatarUrl(initials: string, size: number = 80, bgColor?: string): string {
    const color = bgColor || this.getRandomColor(initials);
    const textColor = this.getContrastColor(color);
    
    return `https://ui-avatars.com/api/?name=${initials}&size=${size}&background=${color}&color=${textColor}&bold=true`;
  }

  private getRandomColor(seed: string): string {
    const colors = ['6366f1', '8b5cf6', 'ec4899', 'ef4444', 'f97316', 'eab308', '22c55e', '06b6d4'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  private getContrastColor(hexColor: string): string {
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '000000' : 'ffffff';
  }
}

export default new UserImageService();