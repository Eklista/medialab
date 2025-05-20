# app/models/requests/recurrent_events.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Time, JSON, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship, validates
from datetime import datetime, timedelta, date

from app.models.base import Base
from app.models.common.entity_mixin import EntityMixin

class RecurrentEvent(Base, EntityMixin):
    """
    Detalles para una actividad recurrente
    """
    __tablename__ = 'recurrent_events'
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey('requests.id'), nullable=False, unique=True)
    
    # Periodo de recurrencia
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Configuración de recurrencia
    recurrence_type = Column(String(50), nullable=False)  # 'daily', 'weekly', 'monthly', 'manual'
    recurrence_config = Column(JSON, nullable=True)  # Almacena patrones específicos (días semana, etc)
    
    # Relaciones
    request = relationship("Request", back_populates="recurrent_event")
    event_dates = relationship("EventDate", back_populates="recurrent_event", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_recurrent_event_request', 'request_id'),
        Index('idx_recurrent_event_start_date', 'start_date'),
        Index('idx_recurrent_event_end_date', 'end_date'),
    )

    @property
    def tasks(self):
        """Obtiene las tareas asociadas a esta actividad"""
        from sqlalchemy.orm import object_session
        from app.models.projects.models import Task
        
        session = object_session(self)
        if not session:
            return []
        
        entity_type = self.__tablename__
        if entity_type.endswith('s'):
            entity_type = entity_type[:-1]
        
        return Task.get_for_activity(session, entity_type, self.id)
    
    @validates('recurrence_type')
    def validate_recurrence_type(self, key, value):
        valid_types = ['daily', 'weekly', 'monthly', 'manual']
        if value not in valid_types:
            raise ValueError(f"El tipo de recurrencia debe ser uno de: {', '.join(valid_types)}")
        return value
    
    @validates('end_date')
    def validate_end_date(self, key, value):
        if hasattr(self, 'start_date') and self.start_date and value < self.start_date:
            raise ValueError("La fecha de fin debe ser posterior o igual a la fecha de inicio")
        return value
    
    @validates('end_time')
    def validate_end_time(self, key, value):
        if hasattr(self, 'start_time') and self.start_time and value <= self.start_time:
            raise ValueError("La hora de fin debe ser posterior a la hora de inicio")
        return value
    
    def set_weekly_config(self, days_of_week):
        """
        Configura la recurrencia semanal con los días de la semana seleccionados
        
        Args:
            days_of_week (list): Lista de días de la semana ['monday', 'tuesday', etc.]
        """
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        days = [day for day in days_of_week if day in valid_days]
        self.recurrence_config = {'type': 'weekly', 'days': days}
    
    def set_monthly_config(self, by_week=None, by_day=None):
        """
        Configura la recurrencia mensual
        
        Args:
            by_week (dict): Configuración por semana {'week': 'first', 'days': ['monday']}
            by_day (int): Día específico del mes (1-31)
        """
        if by_week:
            valid_weeks = ['first', 'second', 'third', 'fourth', 'last']
            week = by_week.get('week', '')
            days = by_week.get('days', [])
            
            if week in valid_weeks and days:
                self.recurrence_config = {'type': 'monthly_week', 'week': week, 'days': days}
        elif by_day:
            day = int(by_day)
            if 1 <= day <= 31:
                self.recurrence_config = {'type': 'monthly_day', 'day': day}
    
    def set_manual_dates(self, dates):
        """
        Configura fechas específicas manualmente
        
        Args:
            dates (list): Lista de fechas en formato ISO ('YYYY-MM-DD')
        """
        self.recurrence_config = {'type': 'manual', 'dates': dates}
    
    def get_recurrence_details(self):
        """
        Retorna detalles de la recurrencia en formato legible
        
        Returns:
            dict: Información sobre la recurrencia
        """
        if not self.recurrence_config:
            return {'type': self.recurrence_type, 'details': 'No configurado'}
            
        if self.recurrence_type == 'daily':
            return {'type': 'daily', 'details': 'Todos los días'}
            
        if self.recurrence_type == 'weekly' and 'days' in self.recurrence_config:
            days = self.recurrence_config['days']
            day_names = {
                'monday': 'Lunes',
                'tuesday': 'Martes',
                'wednesday': 'Miércoles',
                'thursday': 'Jueves',
                'friday': 'Viernes',
                'saturday': 'Sábado',
                'sunday': 'Domingo'
            }
            day_list = [day_names.get(day, day) for day in days]
            return {'type': 'weekly', 'details': 'Cada semana los días: ' + ', '.join(day_list), 'days': days}
            
        if self.recurrence_type == 'monthly':
            if 'type' in self.recurrence_config:
                if self.recurrence_config['type'] == 'monthly_day' and 'day' in self.recurrence_config:
                    day = self.recurrence_config['day']
                    return {'type': 'monthly_day', 'details': f'El día {day} de cada mes', 'day': day}
                    
                if self.recurrence_config['type'] == 'monthly_week' and 'week' in self.recurrence_config and 'days' in self.recurrence_config:
                    week = self.recurrence_config['week']
                    days = self.recurrence_config['days']
                    day_names = {
                        'monday': 'Lunes',
                        'tuesday': 'Martes',
                        'wednesday': 'Miércoles',
                        'thursday': 'Jueves',
                        'friday': 'Viernes',
                        'saturday': 'Sábado',
                        'sunday': 'Domingo'
                    }
                    week_names = {
                        'first': 'primera',
                        'second': 'segunda',
                        'third': 'tercera',
                        'fourth': 'cuarta',
                        'last': 'última'
                    }
                    week_name = week_names.get(week, week)
                    day_list = [day_names.get(day, day) for day in days]
                    return {
                        'type': 'monthly_week',
                        'details': f'La {week_name} semana del mes, los días: {", ".join(day_list)}',
                        'week': week,
                        'days': days
                    }
        
        if self.recurrence_type == 'manual' and 'dates' in self.recurrence_config:
            dates = self.recurrence_config['dates']
            return {'type': 'manual', 'details': f'{len(dates)} fechas específicas', 'dates': dates}
            
        return {'type': self.recurrence_type, 'details': str(self.recurrence_config)}
    
    def generate_dates(self):
        """
        Genera todas las fechas de eventos basadas en la configuración de recurrencia
        
        Returns:
            list: Lista de objetos datetime.date para los eventos
        """
        if not self.start_date or not self.end_date:
            return []
            
        result = []
        
        # Caso de fechas manuales
        if self.recurrence_type == 'manual' and self.recurrence_config and 'dates' in self.recurrence_config:
            for date_str in self.recurrence_config['dates']:
                try:
                    event_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    if self.start_date <= event_date <= self.end_date:
                        result.append(event_date)
                except ValueError:
                    pass
            return result
            
        # Caso de recurrencia diaria
        if self.recurrence_type == 'daily':
            current = self.start_date
            while current <= self.end_date:
                result.append(current)
                current = current + timedelta(days=1)
            return result
            
        # Caso de recurrencia semanal
        if self.recurrence_type == 'weekly' and self.recurrence_config and 'days' in self.recurrence_config:
            weekday_map = {
                'monday': 0,
                'tuesday': 1,
                'wednesday': 2,
                'thursday': 3,
                'friday': 4,
                'saturday': 5,
                'sunday': 6
            }
            
            selected_weekdays = []
            for day in self.recurrence_config['days']:
                if day in weekday_map:
                    selected_weekdays.append(weekday_map[day])
            
            if not selected_weekdays:
                return []
                
            current = self.start_date
            while current <= self.end_date:
                if current.weekday() in selected_weekdays:
                    result.append(current)
                current = current + timedelta(days=1)
            return result
            
        # Caso de recurrencia mensual
        if self.recurrence_type == 'monthly' and self.recurrence_config:
            if 'type' in self.recurrence_config:
                # Por día del mes
                if self.recurrence_config['type'] == 'monthly_day' and 'day' in self.recurrence_config:
                    day = int(self.recurrence_config['day'])
                    
                    current_year = self.start_date.year
                    current_month = self.start_date.month
                    
                    while True:
                        # Verificar si el día existe en este mes
                        last_day = (date(current_year, current_month + 1, 1) if current_month < 12 else date(current_year + 1, 1, 1)) - timedelta(days=1)
                        
                        if day <= last_day.day:
                            current = date(current_year, current_month, day)
                            if current >= self.start_date and current <= self.end_date:
                                result.append(current)
                        
                        # Avanzar al siguiente mes
                        current_month += 1
                        if current_month > 12:
                            current_month = 1
                            current_year += 1
                            
                        # Verificar si hemos pasado la fecha de fin
                        if date(current_year, current_month, 1) > self.end_date:
                            break
                            
                # Por semana y día de la semana
                if self.recurrence_config['type'] == 'monthly_week':
                    week = self.recurrence_config.get('week')
                    days = self.recurrence_config.get('days', [])
                    
                    if not week or not days:
                        return []
                        
                    weekday_map = {
                        'monday': 0,
                        'tuesday': 1,
                        'wednesday': 2,
                        'thursday': 3,
                        'friday': 4,
                        'saturday': 5,
                        'sunday': 6
                    }
                    
                    selected_weekdays = []
                    for day in days:
                        if day in weekday_map:
                            selected_weekdays.append(weekday_map[day])
                    
                    if not selected_weekdays:
                        return []
                        
                    current_year = self.start_date.year
                    current_month = self.start_date.month
                    
                    while True:
                        # Calcular las fechas para la semana seleccionada
                        month_start = date(current_year, current_month, 1)
                        
                        if week in ['first', 'second', 'third', 'fourth']:
                            week_num = {'first': 0, 'second': 1, 'third': 2, 'fourth': 3}[week]
                            
                            # Para cada día de la semana seleccionado
                            for weekday in selected_weekdays:
                                # Calcular el primer día de ese tipo en el mes
                                days_to_add = (weekday - month_start.weekday()) % 7
                                first_occurrence = month_start + timedelta(days=days_to_add)
                                
                                # Añadir semanas según corresponda
                                event_date = first_occurrence + timedelta(days=7 * week_num)
                                
                                if event_date.month == current_month and self.start_date <= event_date <= self.end_date:
                                    result.append(event_date)
                        
                        elif week == 'last':
                            # Último día del mes
                            next_month = current_month + 1 if current_month < 12 else 1
                            next_year = current_year if current_month < 12 else current_year + 1
                            month_end = date(next_year, next_month, 1) - timedelta(days=1)
                            
                            # Para cada día de la semana seleccionado
                            for weekday in selected_weekdays:
                                # Calcular el último día de ese tipo en el mes
                                days_to_subtract = (month_end.weekday() - weekday) % 7
                                event_date = month_end - timedelta(days=days_to_subtract)
                                
                                if event_date.month == current_month and self.start_date <= event_date <= self.end_date:
                                    result.append(event_date)
                        
                        # Avanzar al siguiente mes
                        current_month += 1
                        if current_month > 12:
                            current_month = 1
                            current_year += 1
                            
                        # Verificar si hemos pasado la fecha de fin
                        if date(current_year, current_month, 1) > self.end_date:
                            break
                    
        return sorted(result)
    
    def create_event_dates(self, session):
        """
        Crea entradas en la tabla EventDate para todas las fechas generadas
        
        Args:
            session (Session): Sesión SQLAlchemy
            
        Returns:
            list: Lista de objetos EventDate creados
        """
        # Eliminar fechas existentes
        session.query(EventDate).filter(EventDate.recurrent_event_id == self.id).delete()
        
        # Generar nuevas fechas
        dates = self.generate_dates()
        result = []
        
        for event_date in dates:
            event_date_obj = EventDate(
                recurrent_event_id=self.id,
                event_date=event_date
            )
            session.add(event_date_obj)
            result.append(event_date_obj)
            
        return result
    
    def get_duration_minutes(self):
        """
        Calcula la duración del evento en minutos
        
        Returns:
            int: Duración en minutos
        """
        if not self.start_time or not self.end_time:
            return 0
            
        # Crear una fecha dummy para hacer el cálculo
        base_date = datetime.now().date()
        start_dt = datetime.combine(base_date, self.start_time)
        end_dt = datetime.combine(base_date, self.end_time)
        
        # Si la hora de fin es menor que la de inicio, asumimos que es al día siguiente
        if end_dt < start_dt:
            end_dt = end_dt + timedelta(days=1)
            
        return int((end_dt - start_dt).total_seconds() / 60)
    
    def __repr__(self):
        return f"<RecurrentEvent(id={self.id}, type={self.recurrence_type})>"


class EventDate(Base):
    """
    Fechas específicas para eventos recurrentes
    """
    __tablename__ = 'event_dates'
    
    id = Column(Integer, primary_key=True, index=True)
    recurrent_event_id = Column(Integer, ForeignKey('recurrent_events.id'), nullable=False)
    event_date = Column(Date, nullable=False)
    
    # Relaciones
    recurrent_event = relationship("RecurrentEvent", back_populates="event_dates")
    
    # Índices
    __table_args__ = (
        Index('idx_event_dates_event', 'recurrent_event_id'),
        Index('idx_event_dates_date', 'event_date'),
        UniqueConstraint('recurrent_event_id', 'event_date', name='uix_event_date')
    )
    
    def __repr__(self):
        return f"<EventDate(id={self.id}, date={self.event_date})>"