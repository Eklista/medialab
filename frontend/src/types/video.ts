// src/types/video.ts - Tipos simplificados
export interface VideoData {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration?: string;
  views?: number;
  category: string;
  faculty?: string;
  publishedAt: string;
  tags?: string[];
  
  // Video source - esto viene del backend
  videoType: 'youtube' | 'vimeo' | 's3' | 'external';
  videoUrl: string;
  videoId?: string; // Para YouTube/Vimeo
  
  // Metadatos opcionales
  instructor?: string;
  event?: string;
  location?: string;
  academicYear?: string;
}