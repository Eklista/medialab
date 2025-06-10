# app/utils/advanced_image_processor.py - VERSIÓN CORREGIDA
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional, Tuple
from PIL import Image, ImageOps
import logging
from pathlib import Path
from app.config.settings import settings

logger = logging.getLogger(__name__)

class AdvancedImageProcessor:
    """
    Procesador avanzado de imágenes para subida masiva
    Convierte automáticamente a WebP y genera múltiples tamaños
    """
    
    # Configuración de tamaños estándar
    SIZE_CONFIG = {
        'thumbnail': 300,     # Para previews y cards
        'small': 600,         # Para grids responsivos
        'medium': 1200,       # Vista principal
        'large': 1920,        # Full HD para lightbox
        # Original se mantiene como respaldo
    }
    
    # Calidad por tamaño
    QUALITY_CONFIG = {
        'thumbnail': 85,      # Menor calidad para thumbnails
        'small': 85,
        'medium': 90,         # Mayor calidad para vista principal
        'large': 95,          # Máxima calidad para zoom
        'original': 95
    }
    
    def __init__(self, upload_dir: Optional[str] = None):
        """Inicializar processor con directorio configurado"""
        # Usar directorio configurado o el default
        if upload_dir:
            self.upload_dir = Path(upload_dir)
        else:
            self.upload_dir = settings.upload_photos_path
        
        # Asegurar que existen los directorios
        settings.ensure_upload_dirs()
        
        # Crear subdirectorios por tamaño si no existen
        for size_name in self.SIZE_CONFIG.keys():
            (self.upload_dir / size_name).mkdir(exist_ok=True)
        (self.upload_dir / "original").mkdir(exist_ok=True)
        
        logger.info(f"📁 ImageProcessor usando: {self.upload_dir}")
    
    def get_url_for_file(self, file_path: str, size: str = "medium") -> str:
        """
        Convertir ruta de archivo a URL pública
        """
        try:
            # Convertir ruta absoluta a relativa desde uploads
            rel_path = Path(file_path).relative_to(settings.upload_base_path)
            return f"{settings.current_static_url}/uploads/{rel_path}"
        except ValueError:
            # Fallback si no puede convertir
            filename = Path(file_path).name
            return f"{settings.current_static_url}/uploads/photos/{size}/{filename}"

    def process_single_image(
        self, 
        image_path: str, 
        output_filename: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Procesar una sola imagen y generar todas las variantes
        """
        try:
            # Abrir imagen original
            with Image.open(image_path) as img:
                # Convertir a RGB si es necesario (para WebP)
                if img.mode in ('RGBA', 'P', 'LA'):
                    # Crear fondo blanco para transparencias
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Aplicar corrección de orientación EXIF
                img = ImageOps.exif_transpose(img)
                
                # Generar nombre de archivo si no se proporciona
                if not output_filename:
                    base_name = Path(image_path).stem
                    import time
                    output_filename = f"{base_name}_{int(time.time())}"
                
                variants = {}
                
                # Guardar original en WebP
                original_path = self.upload_dir / "original" / f"{output_filename}.webp"
                img.save(
                    original_path, 
                    'WEBP', 
                    quality=self.QUALITY_CONFIG['original'],
                    optimize=True,
                    method=6  # Mejor compresión
                )
                variants['original'] = str(original_path)
                
                # Generar variantes por tamaño
                for size_name, max_size in self.SIZE_CONFIG.items():
                    variant_path = self.upload_dir / size_name / f"{output_filename}.webp"
                    
                    # Redimensionar manteniendo proporción
                    variant_img = self._resize_image(img, max_size)
                    
                    # Guardar variante
                    variant_img.save(
                        variant_path,
                        'WEBP',
                        quality=self.QUALITY_CONFIG[size_name],
                        optimize=True,
                        method=6
                    )
                    variants[size_name] = str(variant_path)
                
                logger.info(f"✅ Imagen procesada: {output_filename} ({len(variants)} variantes)")
                return variants
                
        except Exception as e:
            logger.error(f"❌ Error procesando imagen {image_path}: {e}")
            return {}

    def _resize_image(self, img: Image.Image, max_size: int) -> Image.Image:
        """
        Redimensionar imagen manteniendo proporción
        """
        # Obtener dimensiones actuales
        width, height = img.size
        
        # Si la imagen es más pequeña que el tamaño objetivo, no redimensionar
        if max(width, height) <= max_size:
            return img.copy()
        
        # Calcular nuevas dimensiones manteniendo proporción
        if width > height:
            new_width = max_size
            new_height = int((height * max_size) / width)
        else:
            new_height = max_size
            new_width = int((width * max_size) / height)
        
        # Redimensionar con alta calidad
        return img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    async def process_bulk_images(
        self, 
        image_paths: List[str], 
        max_workers: int = 4
    ) -> List[Dict[str, str]]:
        """
        Procesar múltiples imágenes en paralelo
        """
        logger.info(f"🚀 Iniciando procesamiento masivo: {len(image_paths)} imágenes")
        
        loop = asyncio.get_event_loop()
        results = []
        
        # Procesar en lotes para no sobrecargar el sistema
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Crear tareas para todas las imágenes
            tasks = [
                loop.run_in_executor(
                    executor, 
                    self.process_single_image, 
                    image_path
                ) 
                for image_path in image_paths
            ]
            
            # Ejecutar todas las tareas
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filtrar resultados exitosos
        successful_results = [
            result for result in results 
            if isinstance(result, dict) and result
        ]
        
        logger.info(f"✅ Procesamiento completado: {len(successful_results)}/{len(image_paths)} exitosas")
        return successful_results

    def get_image_info(self, image_path: str) -> Dict[str, any]:
        """
        Obtener información detallada de una imagen
        """
        try:
            with Image.open(image_path) as img:
                return {
                    "width": img.width,
                    "height": img.height,
                    "format": img.format,
                    "mode": img.mode,
                    "file_size": os.path.getsize(image_path),
                    "has_transparency": img.mode in ('RGBA', 'LA', 'P'),
                    "aspect_ratio": round(img.width / img.height, 2)
                }
        except Exception as e:
            logger.error(f"Error obteniendo info de {image_path}: {e}")
            return {}

    def cleanup_temp_files(self, file_paths: List[str]):
        """
        Limpiar archivos temporales después del procesamiento
        """
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.debug(f"🗑️ Archivo temporal eliminado: {file_path}")
            except Exception as e:
                logger.warning(f"⚠️ No se pudo eliminar {file_path}: {e}")

# Funciones de utilidad
def validate_image_formats(file_paths: List[str]) -> Tuple[List[str], List[str]]:
    """
    Validar formatos de imagen soportados
    """
    supported_formats = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
    valid_files = []
    invalid_files = []
    
    for file_path in file_paths:
        ext = Path(file_path).suffix.lower()
        if ext in supported_formats:
            valid_files.append(file_path)
        else:
            invalid_files.append(file_path)
    
    return valid_files, invalid_files

def estimate_processing_time(num_images: int, avg_file_size_mb: float = 3) -> str:
    """
    Estimar tiempo de procesamiento
    """
    # Estimación basada en experiencia: ~2-5 segundos por imagen dependiendo del tamaño
    base_time = 2 if avg_file_size_mb < 2 else 4
    total_seconds = num_images * base_time
    
    if total_seconds < 60:
        return f"{total_seconds} segundos"
    elif total_seconds < 3600:
        return f"{total_seconds // 60} minutos"
    else:
        return f"{total_seconds // 3600}h {(total_seconds % 3600) // 60}m"

# Ejemplo de uso
async def example_bulk_processing():
    """
    Ejemplo de cómo usar el procesador para subida masiva
    """
    processor = AdvancedImageProcessor()
    
    # Lista de imágenes a procesar
    image_paths = [
        "/tmp/photo1.jpg",
        "/tmp/photo2.png", 
        "/tmp/photo3.jpeg"
    ]
    
    # Validar formatos
    valid_images, invalid_images = validate_image_formats(image_paths)
    if invalid_images:
        logger.warning(f"⚠️ Archivos con formato no soportado: {invalid_images}")
    
    # Estimar tiempo
    estimated_time = estimate_processing_time(len(valid_images))
    logger.info(f"⏱️ Tiempo estimado de procesamiento: {estimated_time}")
    
    # Procesar imágenes
    results = await processor.process_bulk_images(valid_images, max_workers=4)
    
    # Limpiar archivos temporales si es necesario
    # processor.cleanup_temp_files(image_paths)
    
    return results