// frontend/src/services/content/index.ts - ARCHIVO PRINCIPAL DE EXPORTACIÓN

export { CategoriesService, type ContentCategory, type ContentCategoryCreate, type ContentCategoryUpdate } from './categories';
export { VideoTypesService, type VideoType, type VideoTypeCreate, type VideoTypeUpdate, type StorageProvider } from './videoTypes';
export { PhotosService, type Photo, type PhotoCreate, type PhotoUpdate, type GalleryData, type UploadStatus } from './photos';
export { VideosService, type Video, type VideoCreate, type VideoFromYouTube, type VideoFromVimeo } from './videos';

// Re-exportar para facilidad de uso
export const ContentServices = {
  categories: CategoriesService,
  videoTypes: VideoTypesService,
  photos: PhotosService,
  videos: VideosService,
};

export default ContentServices;