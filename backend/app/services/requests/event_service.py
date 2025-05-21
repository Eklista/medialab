# app/services/requests/event_service.py
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session, joinedload

from app.models.requests.single_events import SingleEvent
from app.models.requests.recurrent_events import RecurrentEvent, EventDate
from app.models.requests.models import Request
from app.services.common.validation_service import ValidationService

class EventService:
    """
    Servicio para gestionar eventos (tanto únicos como recurrentes)
    """
    
    @staticmethod
    def get_single_event(db: Session, event_id: int) -> Optional[SingleEvent]:
        """
        Obtiene un evento único por su ID
        
        Args:
            db: Sesión SQLAlchemy
            event_id: ID del evento
            
        Returns:
            Optional[SingleEvent]: Evento o None si no se encuentra
        """
        return db.query(SingleEvent).filter(SingleEvent.id == event_id).first()
    
    @staticmethod
    def get_recurrent_event(db: Session, event_id: int) -> Optional[RecurrentEvent]:
        """
        Obtiene un evento recurrente por su ID
        
        Args:
            db: Sesión SQLAlchemy
            event_id: ID del evento
            
        Returns:
            Optional[RecurrentEvent]: Evento o None si no se encuentra
        """
        return db.query(RecurrentEvent).filter(RecurrentEvent.id == event_id).first()
    
    @staticmethod
    def get_request_event(db: Session, request_id: int) -> Dict[str, Any]:
        """
        Obtiene la información del evento asociado a una solicitud
        
        Args:
            db: Sesión SQLAlchemy
            request_id: ID de la solicitud
            
        Returns:
            Dict[str, Any]: Información del evento o diccionario vacío si no existe
        """
        request = db.query(Request).filter(Request.id == request_id).first()
        if not request:
            return {}
            
        if request.activity_type == 'single':
            event = db.query(SingleEvent).filter(SingleEvent.request_id == request_id).first()
            if not event:
                return {}
                
            return {
                "type": "single",
                "event_date": event.event_date,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "id": event.id
            }
            
        elif request.activity_type == 'recurrent':
            event = db.query(RecurrentEvent).filter(RecurrentEvent.request_id == request_id).options(
                joinedload(RecurrentEvent.event_dates)
            ).first()
            
            if not event:
                return {}
                
            return {
                "type": "recurrent",
                "start_date": event.start_date,
                "end_date": event.end_date,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "recurrence_type": event.recurrence_type,
                "recurrence_config": event.recurrence_config,
                "event_dates": [date.event_date for date in event.event_dates] if event.event_dates else [],
                "id": event.id
            }
        
        return {}
    
    @staticmethod
    def create_single_event(db: Session, request_id: int, event_data: Dict[str, Any]) -> SingleEvent:
        """
        Crea un evento único asociado a una solicitud
        
        Args:
            db: Sesión SQLAlchemy
            request_id: ID de la solicitud
            event_data: Datos del evento
            
        Returns:
            SingleEvent: Evento creado
            
        Raises:
            ValueError: Si los datos no son válidos
        """
        # Validar hora de fin
        if 'start_time' in event_data and 'end_time' in event_data:
            # Validar que la hora de fin sea posterior a la hora de inicio
            is_valid, error_msg = ValidationService.validate_time_range(
                event_data['start_time'], 
                event_data['end_time']
            )
            if not is_valid:
                raise ValueError(error_msg)
        
        # Crear evento
        event_data['request_id'] = request_id
        event = SingleEvent(**event_data)
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event
    
    @staticmethod
    def update_single_event(db: Session, event_id: int, event_data: Dict[str, Any]) -> Optional[SingleEvent]:
        """
        Actualiza un evento único
        
        Args:
            db: Sesión SQLAlchemy
            event_id: ID del evento
            event_data: Datos a actualizar
            
        Returns:
            Optional[SingleEvent]: Evento actualizado o None si no se encuentra
        """
        event = EventService.get_single_event(db, event_id)
        if not event:
            return None
            
        # Validar hora de fin si se están actualizando horas
        start_time = event_data.get('start_time', event.start_time)
        end_time = event_data.get('end_time', event.end_time)
        
        # Validar que la hora de fin sea posterior a la hora de inicio
        is_valid, error_msg = ValidationService.validate_time_range(start_time, end_time)
        if not is_valid:
            raise ValueError(error_msg)
        
        # Actualizar campos
        for key, value in event_data.items():
            setattr(event, key, value)
            
        db.commit()
        db.refresh(event)
        
        return event
    
    @staticmethod
    def delete_single_event(db: Session, event_id: int) -> bool:
        """
        Elimina un evento único
        
        Args:
            db: Sesión SQLAlchemy
            event_id: ID del evento
            
        Returns:
            bool: True si se eliminó correctamente, False si no se encontró
        """
        event = EventService.get_single_event(db, event_id)
        if not event:
            return False
            
        db.delete(event)
        db.commit()
        
        return True
    
    @staticmethod
    def calculate_event_duration_minutes(start_time: time, end_time: time) -> int:
        """
        Calcula la duración de un evento en minutos
        
        Args:
            start_time: Hora de inicio
            end_time: Hora de fin
            
        Returns:
            int: Duración en minutos
        """
        if not start_time or not end_time:
            return 0
            
        # Crear una fecha dummy para calcular la diferencia
        base_date = date.today()
        start_dt = datetime.combine(base_date, start_time)
        end_dt = datetime.combine(base_date, end_time)
        
        # Si la hora de fin es menor que la de inicio, se asume que es al día siguiente
        if end_dt < start_dt:
            end_dt += timedelta(days=1)
            
        return int((end_dt - start_dt).total_seconds() / 60)
    
    @staticmethod
    def get_events_in_date_range(db: Session, start_date: date, end_date: date) -> Dict[str, List]:
        """
        Obtiene todos los eventos en un rango de fechas
        
        Args:
            db: Sesión SQLAlchemy
            start_date: Fecha de inicio
            end_date: Fecha de fin
            
        Returns:
            Dict[str, List]: Diccionario con eventos únicos y recurrentes
        """
        # Obtener eventos únicos
        single_events = db.query(SingleEvent).join(
            Request, Request.id == SingleEvent.request_id
        ).filter(
            SingleEvent.event_date >= start_date,
            SingleEvent.event_date <= end_date,
            Request.is_processed == True
        ).all()
        
        # Obtener eventos recurrentes basado en fechas específicas
        recurrent_dates = db.query(EventDate).join(
            RecurrentEvent, RecurrentEvent.id == EventDate.recurrent_event_id
        ).join(
            Request, Request.id == RecurrentEvent.request_id
        ).filter(
            EventDate.event_date >= start_date,
            EventDate.event_date <= end_date,
            Request.is_processed == True
        ).all()
        
        # Agrupar fechas por evento recurrente
        recurrent_events = {}
        for event_date in recurrent_dates:
            event_id = event_date.recurrent_event_id
            if event_id not in recurrent_events:
                recurrent_events[event_id] = db.query(RecurrentEvent).filter(
                    RecurrentEvent.id == event_id
                ).first()
            
        # Retornar resultados
        return {
            "single_events": single_events,
            "recurrent_events": list(recurrent_events.values()),
            "event_dates": recurrent_dates
        }
    
    @staticmethod
    def validate_end_time(start_time: time, end_time: time) -> time:
        """
        Valida que la hora fin sea posterior a la hora inicio
        
        Args:
            start_time: Hora de inicio
            end_time: Hora de fin
            
        Returns:
            time: Hora de fin validada
            
        Raises:
            ValueError: Si la hora de fin no es posterior a la hora de inicio
        """
        if start_time and end_time <= start_time:
            raise ValueError("La hora de fin debe ser posterior a la hora de inicio")
        return end_time
    
    @staticmethod
    def format_event_time(event_time: time) -> str:
        """
        Formatea una hora en formato legible
        
        Args:
            event_time: Objeto time
            
        Returns:
            str: Hora formateada (ej: "14:30")
        """
        if not event_time:
            return ""
        return event_time.strftime("%H:%M")
    
    @staticmethod
    def get_week_events(db: Session, year: int, week: int) -> Dict[str, Any]:
        """
        Obtiene eventos para una semana específica
        
        Args:
            db: Sesión SQLAlchemy
            year: Año
            week: Número de semana (1-53)
            
        Returns:
            Dict[str, Any]: Eventos organizados por día
        """
        # Calcular fechas de inicio y fin de la semana
        import datetime
        start_date = datetime.datetime.strptime(f'{year}-{week}-1', '%Y-%W-%w').date()
        end_date = start_date + datetime.timedelta(days=6)
        
        # Obtener eventos
        events = EventService.get_events_in_date_range(db, start_date, end_date)
        
        # Organizar eventos por día
        days = {}
        for i in range(7):
            current_date = start_date + datetime.timedelta(days=i)
            days[current_date.strftime('%Y-%m-%d')] = []
        
        # Agregar eventos únicos
        for event in events["single_events"]:
            date_key = event.event_date.strftime('%Y-%m-%d')
            if date_key in days:
                days[date_key].append({
                    "id": event.id,
                    "type": "single",
                    "title": event.request.title if hasattr(event, 'request') else "Sin título",
                    "start_time": EventService.format_event_time(event.start_time),
                    "end_time": EventService.format_event_time(event.end_time)
                })
        
        # Agregar eventos recurrentes
        for event_date in events["event_dates"]:
            date_key = event_date.event_date.strftime('%Y-%m-%d')
            if date_key in days:
                recurrent_event = next((e for e in events["recurrent_events"] if e.id == event_date.recurrent_event_id), None)
                if recurrent_event:
                    days[date_key].append({
                        "id": recurrent_event.id,
                        "date_id": event_date.id,
                        "type": "recurrent",
                        "title": recurrent_event.request.title if hasattr(recurrent_event, 'request') else "Sin título",
                        "start_time": EventService.format_event_time(recurrent_event.start_time),
                        "end_time": EventService.format_event_time(recurrent_event.end_time)
                    })
        
        return {
            "start_date": start_date.strftime('%Y-%m-%d'),
            "end_date": end_date.strftime('%Y-%m-%d'),
            "days": days
        }