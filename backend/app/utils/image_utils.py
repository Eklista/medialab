# app/utils/image_utils.py
import os
from typing import Dict, Any, Optional
from PIL import Image
import logging

logger = logging.getLogger(__name__)

def get_image_info(file_path: str) -> Dict[str, Any]:
    """Obtener información de una imagen"""
    try:
        if not os.path.exists(file_path):
            return {}
        
        # Información básica del archivo
        file_size = os.path.getsize(file_path)
        
        # Información de la imagen con PIL
        with Image.open(file_path) as img:
            width, height = img.size
            format_name = img.format
            mode = img.mode
        
        # Determinar MIME type
        mime_types = {
            'JPEG': 'image/jpeg',
            'PNG': 'image/png',
            'GIF': 'image/gif',
            'WEBP': 'image/webp',
            'BMP': 'image/bmp',
            'TIFF': 'image/tiff'
        }
       
        mime_type = mime_types.get(format_name, 'image/unknown')
        
        return {
            "file_size": file_size,
            "width": width,
            "height": height,
            "format": format_name,
            "mode": mode,
            "mime_type": mime_type
        }
    
    except Exception as e:
        logger.error(f"Error obteniendo info de imagen {file_path}: {e}")
        return {}

def generate_thumbnail(file_path: str, size: tuple = (300, 300), quality: int = 85) -> Optional[str]:
   """Generar thumbnail de una imagen"""
   try:
       if not os.path.exists(file_path):
           return None
       
       # Crear ruta para thumbnail
       directory = os.path.dirname(file_path)
       filename = os.path.basename(file_path)
       name, ext = os.path.splitext(filename)
       thumbnail_path = os.path.join(directory, f"{name}_thumb{ext}")
       
       with Image.open(file_path) as img:
           # Mantener proporción
           img.thumbnail(size, Image.Resampling.LANCZOS)
           img.save(thumbnail_path, quality=quality, optimize=True)
       
       return thumbnail_path
   
   except Exception as e:
       logger.error(f"Error generando thumbnail para {file_path}: {e}")
       return None

def resize_image(file_path: str, max_width: int = 800, max_height: int = 600, quality: int = 85) -> Optional[str]:
   """Redimensionar imagen manteniendo proporción"""
   try:
       if not os.path.exists(file_path):
           return None
       
       # Crear ruta para imagen redimensionada
       directory = os.path.dirname(file_path)
       filename = os.path.basename(file_path)
       name, ext = os.path.splitext(filename)
       resized_path = os.path.join(directory, f"{name}_medium{ext}")
       
       with Image.open(file_path) as img:
           # Calcular nuevo tamaño manteniendo proporción
           width, height = img.size
           
           if width <= max_width and height <= max_height:
               # La imagen ya es del tamaño correcto
               return file_path
           
           ratio = min(max_width / width, max_height / height)
           new_size = (int(width * ratio), int(height * ratio))
           
           resized_img = img.resize(new_size, Image.Resampling.LANCZOS)
           resized_img.save(resized_path, quality=quality, optimize=True)
       
       return resized_path
   
   except Exception as e:
       logger.error(f"Error redimensionando imagen {file_path}: {e}")
       return None

def validate_image_file(file_path: str, max_size_mb: int = 10) -> Dict[str, Any]:
   """Validar archivo de imagen"""
   validation = {
       "is_valid": False,
       "errors": [],
       "warnings": [],
       "info": {}
   }
   
   try:
       # Verificar que existe
       if not os.path.exists(file_path):
           validation["errors"].append("Archivo no encontrado")
           return validation
       
       # Verificar tamaño
       file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
       if file_size_mb > max_size_mb:
           validation["errors"].append(f"Archivo muy grande: {file_size_mb:.1f}MB (máximo {max_size_mb}MB)")
       
       # Verificar que es una imagen válida
       with Image.open(file_path) as img:
           width, height = img.size
           format_name = img.format
           
           # Formatos permitidos
           allowed_formats = ['JPEG', 'PNG', 'GIF', 'WEBP', 'BMP']
           if format_name not in allowed_formats:
               validation["errors"].append(f"Formato no permitido: {format_name}")
           
           # Dimensiones mínimas
           min_width, min_height = 100, 100
           if width < min_width or height < min_height:
               validation["errors"].append(f"Dimensiones muy pequeñas: {width}x{height} (mínimo {min_width}x{min_height})")
           
           # Dimensiones máximas
           max_width, max_height = 10000, 10000
           if width > max_width or height > max_height:
               validation["warnings"].append(f"Dimensiones muy grandes: {width}x{height} (se redimensionará)")
           
           validation["info"] = {
               "width": width,
               "height": height,
               "format": format_name,
               "size_mb": file_size_mb
           }
       
       # Si no hay errores, es válida
       validation["is_valid"] = len(validation["errors"]) == 0
       
   except Exception as e:
       validation["errors"].append(f"Error validando imagen: {str(e)}")
   
   return validation

def create_image_variants(file_path: str) -> Dict[str, str]:
   """Crear variantes de una imagen (thumbnail, medium, etc.)"""
   variants = {
       "original": file_path,
       "thumbnail": None,
       "medium": None
   }
   
   try:
       # Generar thumbnail
       thumbnail_path = generate_thumbnail(file_path, size=(300, 300))
       if thumbnail_path:
           variants["thumbnail"] = thumbnail_path
       
       # Generar versión media
       medium_path = resize_image(file_path, max_width=800, max_height=600)
       if medium_path:
           variants["medium"] = medium_path
       
   except Exception as e:
       logger.error(f"Error creando variantes de imagen: {e}")
   
   return variants

def optimize_image(file_path: str, quality: int = 85, progressive: bool = True) -> bool:
   """Optimizar imagen para web"""
   try:
       with Image.open(file_path) as img:
           # Convertir a RGB si es necesario
           if img.mode in ('RGBA', 'P'):
               img = img.convert('RGB')
           
           # Guardar optimizada
           img.save(file_path, 'JPEG', quality=quality, progressive=progressive, optimize=True)
       
       return True
   
   except Exception as e:
       logger.error(f"Error optimizando imagen {file_path}: {e}")
       return False

def get_image_colors(file_path: str, num_colors: int = 5) -> List[str]:
   """Extraer colores dominantes de una imagen"""
   try:
       with Image.open(file_path) as img:
           # Redimensionar para análisis más rápido
           img = img.resize((150, 150))
           
           # Convertir a RGB
           if img.mode != 'RGB':
               img = img.convert('RGB')
           
           # Obtener colores usando quantize
           img = img.quantize(colors=num_colors)
           colors = img.getpalette()
           
           # Convertir a hex
           hex_colors = []
           for i in range(0, len(colors[:num_colors*3]), 3):
               r, g, b = colors[i:i+3]
               hex_color = f"#{r:02x}{g:02x}{b:02x}"
               hex_colors.append(hex_color)
           
           return hex_colors
   
   except Exception as e:
       logger.error(f"Error extrayendo colores de {file_path}: {e}")
       return []