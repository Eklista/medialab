# app/services/requests/recurrence_service.py
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.requests.recurrent_events import RecurrentEvent, EventDate

class RecurrenceService:
    """
    Servicio para gestionar la lógica de recurrencia de eventos
    """
    
    @staticmethod
    def generate_dates(recurrent_event: RecurrentEvent) -> List[date]:
        """
        Genera todas las fechas de eventos basadas en la configuración de recurrencia
        
        Args:
            recurrent_event: Instancia de RecurrentEvent
            
        Returns:
            List[date]: Lista de objetos datetime.date para los eventos
        """
        if not recurrent_event.start_date or not recurrent_event.end_date:
            return []
            
        result = []
        
        # Caso de fechas manuales
        if recurrent_event.recurrence_type == 'manual' and recurrent_event.recurrence_config and 'dates' in recurrent_event.recurrence_config:
            for date_str in recurrent_event.recurrence_config['dates']:
                try:
                    event_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    if recurrent_event.start_date <= event_date <= recurrent_event.end_date:
                        result.append(event_date)
                except ValueError:
                    pass
            return result
            
        # Implementación del resto de la lógica que estaba en el método original...
        # [código omitido por brevedad]
        
        return sorted(result)
    
    @staticmethod
    def create_event_dates(db: Session, recurrent_event: RecurrentEvent) -> List[EventDate]:
        """
        Crea entradas en la tabla EventDate para todas las fechas generadas
        
        Args:
            db: Sesión SQLAlchemy
            recurrent_event: Instancia de RecurrentEvent
            
        Returns:
            list: Lista de objetos EventDate creados
        """
        # Eliminar fechas existentes
        db.query(EventDate).filter(EventDate.recurrent_event_id == recurrent_event.id).delete()
        
        # Generar nuevas fechas
        dates = RecurrenceService.generate_dates(recurrent_event)
        result = []
        
        for event_date in dates:
            event_date_obj = EventDate(
                recurrent_event_id=recurrent_event.id,
                event_date=event_date
            )
            db.add(event_date_obj)
            result.append(event_date_obj)
            
        return result
    
    @staticmethod
    def set_weekly_config(recurrent_event: RecurrentEvent, days_of_week: List[str]) -> None:
        """
        Configura la recurrencia semanal con los días de la semana seleccionados
        
        Args:
            recurrent_event: Instancia de RecurrentEvent
            days_of_week: Lista de días de la semana ['monday', 'tuesday', etc.]
        """
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        days = [day for day in days_of_week if day in valid_days]
        recurrent_event.recurrence_config = {'type': 'weekly', 'days': days}
    
    @staticmethod
    def set_monthly_config(recurrent_event: RecurrentEvent, by_week=None, by_day=None) -> None:
        """
        Configura la recurrencia mensual
        
        Args:
            recurrent_event: Instancia de RecurrentEvent
            by_week: Configuración por semana {'week': 'first', 'days': ['monday']}
            by_day: Día específico del mes (1-31)
        """
        if by_week:
            valid_weeks = ['first', 'second', 'third', 'fourth', 'last']
            week = by_week.get('week', '')
            days = by_week.get('days', [])
            
            if week in valid_weeks and days:
                recurrent_event.recurrence_config = {'type': 'monthly_week', 'week': week, 'days': days}
        elif by_day:
            day = int(by_day)
            if 1 <= day <= 31:
                recurrent_event.recurrence_config = {'type': 'monthly_day', 'day': day}
    
    @staticmethod
    def set_manual_dates(recurrent_event: RecurrentEvent, dates: List[str]) -> None:
        """
        Configura fechas específicas manualmente
        
        Args:
            recurrent_event: Instancia de RecurrentEvent
            dates: Lista de fechas en formato ISO ('YYYY-MM-DD')
        """
        recurrent_event.recurrence_config = {'type': 'manual', 'dates': dates}
    
    @staticmethod
    def get_recurrence_details(recurrent_event: RecurrentEvent) -> Dict[str, Any]:
        """
        Retorna detalles de la recurrencia en formato legible
        
        Args:
            recurrent_event: Instancia de RecurrentEvent
            
        Returns:
            dict: Información sobre la recurrencia
        """
        # Implementación del método original...
        # [código omitido por brevedad]
        
        return {'type': recurrent_event.recurrence_type, 'details': 'No configurado'}
    
    @staticmethod
    def get_duration_minutes(start_time: datetime, end_time: datetime) -> int:
        """
        Calcula la duración en minutos entre dos horas
        
        Args:
            start_time: Hora de inicio
            end_time: Hora de fin
            
        Returns:
            int: Duración en minutos
        """
        if not start_time or not end_time:
            return 0
            
        # Crear una fecha dummy para hacer el cálculo
        base_date = datetime.now().date()
        start_dt = datetime.combine(base_date, start_time.time() if isinstance(start_time, datetime) else start_time)
        end_dt = datetime.combine(base_date, end_time.time() if isinstance(end_time, datetime) else end_time)
        
        # Si la hora de fin es menor que la de inicio, asumimos que es al día siguiente
        if end_dt < start_dt:
            end_dt = end_dt + timedelta(days=1)
            
        return int((end_dt - start_dt).total_seconds() / 60)

    @staticmethod
    def validate_recurrence_type(value: str) -> str:
        """
        Valida que el tipo de recurrencia sea válido
        """
        valid_types = ['daily', 'weekly', 'monthly', 'manual']
        if value not in valid_types:
            raise ValueError(f"El tipo de recurrencia debe ser uno de: {', '.join(valid_types)}")
        return value

    @staticmethod
    def validate_end_date(start_date: date, end_date: date) -> date:
        """
        Valida que la fecha fin sea posterior a la fecha inicio
        """
        if start_date and end_date < start_date:
            raise ValueError("La fecha de fin debe ser posterior o igual a la fecha de inicio")
        return end_date

    @staticmethod
    def validate_end_time(start_time: time, end_time: time) -> time:
        """
        Valida que la hora fin sea posterior a la hora inicio
        """
        if start_time and end_time <= start_time:
            raise ValueError("La hora de fin debe ser posterior a la hora de inicio")
        return end_time