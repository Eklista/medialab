import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from app.config.settings import DATABASE_URL
from app.models.base import Base

"""""

Importar todos los modelos aquí para que Alembic los reconozca

"""""

# Modelos base y asociaciones
from app.models.base import Base
from app.models.associations import user_roles, role_permissions

# Modelos de autenticación
from app.models.auth.users import User
from app.models.auth.roles import Role
from app.models.auth.permissions import Permission

# Modelos de organización
from app.models.organization.areas import Area
from app.models.organization.departments import Department, DepartmentType
from app.models.organization.services import Service, SubService
from app.models.organization.service_templates import ServiceTemplate, template_services, template_subservices
from app.models.organization.institutional_users import InstitutionalUser

# Modelos comunes
from app.models.common.workflow import Status, WorkItem, StatusHistory
from app.models.common.metadata import Priority, Tag, TagAssignment, ActivityType
from app.models.common.platforms import Platform
from app.models.common.attachments import Attachment
from app.models.common.email_config import SmtpConfiguration, EmailTemplate

# Modelos de comunicación
from app.models.communications.links import Link
from app.models.communications.comments import Comment

# Modelos de educación
from app.models.education.academic import Career, Course, CourseClass
from app.models.education.academic_periods import AcademicPeriod
from app.models.education.professors import Professor

# Modelos de multimedia
from app.models.multimedia.podcasts import PodcastSeries, PodcastEpisode

# Modelos de proyectos
from app.models.projects.models import Project, Task

# Modelos de seguridad
from app.models.security.two_factor import TwoFactorMethod, UserTwoFactor
from app.models.security.audit_log import AuditLog

# Modelos de solicitudes (requests)
from app.models.requests.models import Request
from app.models.requests.associations import request_services, request_sub_services
from app.models.requests.single_events import SingleEvent
from app.models.requests.recurrent_events import RecurrentEvent, EventDate
from app.models.requests.podcast_requests import PodcastRequest, PodcastModerator, PodcastEpisode as PodcastRequestEpisode, PodcastGuest
from app.models.requests.course_requests import CourseRequest, CourseItem, CourseRecordingDate

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)

# set your url here or import from a config
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()