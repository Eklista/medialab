# app/services/multimedia/podcast_service.py
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.multimedia.podcasts import PodcastSeries, PodcastEpisode
from app.services.common.link_service import LinkService

class PodcastService:
    """
    Servicio para gestionar podcasts
    """
    
    @staticmethod
    def get_all_series(db: Session, skip: int = 0, limit: int = 100) -> List[PodcastSeries]:
        """
        Obtiene todas las series de podcast
        
        Args:
            db: Sesión SQLAlchemy
            skip: Registros a saltar (paginación)
            limit: Límite de registros a devolver
            
        Returns:
            List[PodcastSeries]: Lista de series
        """
        return db.query(PodcastSeries).filter(
            PodcastSeries.deleted_at == None
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_series_by_id(db: Session, series_id: int) -> Optional[PodcastSeries]:
        """
        Obtiene una serie de podcast por su ID
        
        Args:
            db: Sesión SQLAlchemy
            series_id: ID de la serie
            
        Returns:
            Optional[PodcastSeries]: Serie o None si no se encuentra
        """
        return db.query(PodcastSeries).filter(
            PodcastSeries.id == series_id,
            PodcastSeries.deleted_at == None
        ).first()
    
    @staticmethod
    def create_series(db: Session, series_data: Dict[str, Any]) -> PodcastSeries:
        """
        Crea una nueva serie de podcast
        
        Args:
            db: Sesión SQLAlchemy
            series_data: Datos de la serie
            
        Returns:
            PodcastSeries: Serie creada
        """
        series = PodcastSeries(**series_data)
        
        db.add(series)
        db.commit()
        db.refresh(series)
        
        return series
    
    @staticmethod
    def update_series(db: Session, series_id: int, series_data: Dict[str, Any]) -> Optional[PodcastSeries]:
        """
        Actualiza una serie de podcast
        
        Args:
            db: Sesión SQLAlchemy
            series_id: ID de la serie
            series_data: Datos a actualizar
            
        Returns:
            Optional[PodcastSeries]: Serie actualizada o None si no se encuentra
        """
        series = PodcastService.get_series_by_id(db, series_id)
        if not series:
            return None
            
        for key, value in series_data.items():
            setattr(series, key, value)
            
        db.commit()
        db.refresh(series)
        
        return series
    
    @staticmethod
    def delete_series(db: Session, series_id: int, deleted_by_id: Optional[int] = None) -> bool:
        """
        Marca una serie como eliminada
        
        Args:
            db: Sesión SQLAlchemy
            series_id: ID de la serie
            deleted_by_id: ID del usuario que elimina
            
        Returns:
            bool: True si se marcó como eliminada, False si no se encuentra
        """
        series = PodcastService.get_series_by_id(db, series_id)
        if not series:
            return False
            
        series.deleted_at = datetime.utcnow()
        series.deleted_by_id = deleted_by_id
        
        db.commit()
        
        return True
    
    @staticmethod
    def get_all_series_links(db: Session, series_id: int) -> List:
        """
        Obtiene todos los enlaces asociados a una serie y sus episodios
        
        Args:
            db: Sesión SQLAlchemy
            series_id: ID de la serie
            
        Returns:
            List: Lista combinada de enlaces
        """
        series = PodcastService.get_series_by_id(db, series_id)
        if not series:
            return []
            
        # Enlaces directos de la serie
        series_links = LinkService.get_entity_links(db, series)
        
        # Enlaces de todos los episodios
        episodes = db.query(PodcastEpisode).filter(
            PodcastEpisode.series_id == series_id,
            PodcastEpisode.deleted_at == None
        ).all()
        
        episode_links = []
        for episode in episodes:
            episode_links.extend(LinkService.get_entity_links(db, episode))
            
        return series_links + episode_links
    
    @staticmethod
    def get_all_episodes(db: Session, series_id: int = None) -> List[PodcastEpisode]:
        """
        Obtiene todos los episodios, opcionalmente filtrados por serie
        
        Args:
            db: Sesión SQLAlchemy
            series_id: ID de la serie para filtrar (opcional)
            
        Returns:
            List[PodcastEpisode]: Lista de episodios
        """
        query = db.query(PodcastEpisode).filter(PodcastEpisode.deleted_at == None)
        
        if series_id:
            query = query.filter(PodcastEpisode.series_id == series_id)
            
        return query.all()
    
    @staticmethod
    def get_episode_by_id(db: Session, episode_id: int) -> Optional[PodcastEpisode]:
        """
        Obtiene un episodio por su ID
        
        Args:
            db: Sesión SQLAlchemy
            episode_id: ID del episodio
            
        Returns:
            Optional[PodcastEpisode]: Episodio o None si no se encuentra
        """
        return db.query(PodcastEpisode).filter(
            PodcastEpisode.id == episode_id,
            PodcastEpisode.deleted_at == None
        ).first()
    
    @staticmethod
    def create_episode(db: Session, episode_data: Dict[str, Any]) -> PodcastEpisode:
        """
        Crea un nuevo episodio
        
        Args:
            db: Sesión SQLAlchemy
            episode_data: Datos del episodio
            
        Returns:
            PodcastEpisode: Episodio creado
        """
        episode = PodcastEpisode(**episode_data)
        
        db.add(episode)
        db.commit()
        db.refresh(episode)
        
        return episode
    
    @staticmethod
    def update_episode(db: Session, episode_id: int, episode_data: Dict[str, Any]) -> Optional[PodcastEpisode]:
        """
        Actualiza un episodio
        
        Args:
            db: Sesión SQLAlchemy
            episode_id: ID del episodio
            episode_data: Datos a actualizar
            
        Returns:
            Optional[PodcastEpisode]: Episodio actualizado o None si no se encuentra
        """
        episode = PodcastService.get_episode_by_id(db, episode_id)
        if not episode:
            return None
            
        for key, value in episode_data.items():
            setattr(episode, key, value)
            
        db.commit()
        db.refresh(episode)
        
        return episode
    
    @staticmethod
    def delete_episode(db: Session, episode_id: int, deleted_by_id: Optional[int] = None) -> bool:
        """
        Marca un episodio como eliminado
        
        Args:
            db: Sesión SQLAlchemy
            episode_id: ID del episodio
            deleted_by_id: ID del usuario que elimina
            
        Returns:
            bool: True si se marcó como eliminado, False si no se encuentra
        """
        episode = PodcastService.get_episode_by_id(db, episode_id)
        if not episode:
            return False
            
        episode.deleted_at = datetime.utcnow()
        episode.deleted_by_id = deleted_by_id
        
        db.commit()
        
        return True