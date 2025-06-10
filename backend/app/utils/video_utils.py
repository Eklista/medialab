# app/utils/video_utils.py
import re
from typing import Optional

def extract_youtube_id(url: str) -> Optional[str]:
    """Extraer ID de video de YouTube desde URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'^([a-zA-Z0-9_-]{11})$'  # ID directo
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def extract_vimeo_id(url: str) -> Optional[str]:
    """Extraer ID de video de Vimeo desde URL"""
    match = re.search(r'vimeo\.com\/(?:.*\/)?(\d+)', url)
    return match.group(1) if match else None

def get_youtube_thumbnail(video_id: str, quality: str = 'hqdefault') -> str:
    """Obtener URL de thumbnail de YouTube"""
    # Calidades disponibles: default, mqdefault, hqdefault, sddefault, maxresdefault
    return f"https://img.youtube.com/vi/{video_id}/{quality}.jpg"

def get_vimeo_thumbnail(video_id: str) -> str:
    """Obtener URL de thumbnail de Vimeo"""
    # Esto requeriría una llamada a la API de Vimeo
    return f"https://vumbnail.com/{video_id}.jpg"

def format_duration(seconds: int) -> str:
    """Formatear duración en segundos a HH:MM:SS o MM:SS"""
    if seconds < 3600:  # Menos de 1 hora
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes}:{secs:02d}"
    else:  # 1 hora o más
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        return f"{hours}:{minutes:02d}:{secs:02d}"

def parse_duration(duration_str: str) -> Optional[int]:
    """Convertir duración formateada a segundos"""
    try:
        parts = duration_str.split(':')
        if len(parts) == 2:  # MM:SS
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:  # HH:MM:SS
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    except (ValueError, IndexError):
        pass
    return None

def get_video_file_info(file_path: str) -> dict:
    """Obtener información de archivo de video (placeholder)"""
    # Aquí podrías usar ffprobe o similar para obtener metadata
    import os
    return {
        "file_size": os.path.getsize(file_path) if os.path.exists(file_path) else 0,
        "mime_type": "video/mp4",  # Detectar real
        "duration_seconds": None,
        "width": None,
        "height": None,
        "fps": None,
        "bitrate": None
    }