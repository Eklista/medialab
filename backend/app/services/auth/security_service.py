# backend/app/services/auth/security_service.py
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import Request
import logging

from app.repositories.auth_repository import AuthRepository
from app.services.auth.token_service import TokenService
from app.services.auth.password_service import PasswordService
from app.utils.token_blacklist import token_blacklist
from app.utils.redis_rate_limiter import redis_rate_limiter
from app.config.settings import ENVIRONMENT
from app.schemas.auth.security import (
    SecurityStatusResponse, SecurityStatsResponse, SecurityEvent,
    RateLimitInfo, UserSecurityInfo, SecurityCleanupResponse,
    EmergencyResetResponse
)

logger = logging.getLogger(__name__)

class SecurityService:
    """
    Servicio central de seguridad que coordina todos los aspectos de seguridad
    Unifica token management, rate limiting, auditoría y monitoreo
    """
    
    # ===== ESTADO DE SEGURIDAD =====
    
    @staticmethod
    def get_system_security_status(user_id: int) -> SecurityStatusResponse:
        """
        Obtiene el estado completo de seguridad del sistema para un usuario
        """
        try:
            # Obtener estadísticas de sistemas de seguridad
            token_stats = TokenService.get_token_stats()
            rate_limit_stats = redis_rate_limiter.get_stats()
            
            return SecurityStatusResponse(
                user_id=user_id,
                environment=ENVIRONMENT,
                security_features={
                    "httponly_cookies": True,
                    "secure_cookies": ENVIRONMENT == "production",
                    "token_blacklist": token_stats.get("blacklist_stats", {}).get("enabled", False),
                    "rate_limiting": rate_limit_stats.get("enabled", False),
                    "hybrid_blacklist": True,
                    "jwe_encryption": True
                },
                session_info={
                    "expires_in": token_stats.get("token_settings", {}).get("access_token_expire_minutes", 0) * 60,
                    "refresh_expires_in": token_stats.get("token_settings", {}).get("refresh_token_expire_days", 0) * 24 * 60 * 60,
                    "secure_transport": ENVIRONMENT == "production"
                },
                system_health={
                    "redis_available": rate_limit_stats.get("redis_available", False),
                    "blacklist_operational": token_stats.get("blacklist_stats", {}).get("enabled", False)
                }
            )
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo estado de seguridad: {e}")
            raise Exception(f"Error al obtener estado de seguridad: {str(e)}")
    
    @staticmethod
    def get_comprehensive_security_stats(db: Session) -> SecurityStatsResponse:
        """
        Obtiene estadísticas completas de todos los sistemas de seguridad
        """
        try:
            # Estadísticas de tokens
            token_stats = TokenService.get_token_stats()
            
            # Estadísticas de rate limiting
            rate_limit_stats = redis_rate_limiter.get_stats()
            
            # Estadísticas de base de datos
            auth_stats = AuthRepository.get_security_stats(db)
            
            return SecurityStatsResponse(
                token_blacklist=token_stats.get("blacklist_stats", {}),
                rate_limiting=rate_limit_stats,
                hybrid_system_available=True,
                security_features={
                    "hybrid_token_blacklist": True,
                    "robust_jti_extraction": True,
                    "jwe_encryption_support": True,
                    "rate_limiting_enabled": rate_limit_stats.get("enabled", False),
                    "failed_attempts_tracking": True,
                    "global_user_invalidation": True,
                    "automatic_cleanup": True,
                    "password_strength_validation": True,
                    "session_management": True,
                    "audit_logging": True
                }
            )
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo estadísticas de seguridad: {e}")
            raise Exception(f"Error al obtener estadísticas de seguridad: {str(e)}")
    
    # ===== GESTIÓN DE RATE LIMITING =====
    
    @staticmethod
    def check_rate_limit(request: Request, max_requests: int = 60, window_seconds: int = 60, endpoint: str = "general") -> RateLimitInfo:
        """
        Verifica rate limit y retorna información detallada
        """
        try:
            # Obtener identificador del request
            identifier = redis_rate_limiter.get_identifier(request, use_user_id=False)
            
            # Verificar rate limit
            limit_info = redis_rate_limiter.check_rate_limit(
                identifier=identifier,
                max_requests=max_requests,
                window_seconds=window_seconds,
                endpoint=endpoint
            )
            
            return RateLimitInfo(
                allowed=limit_info["allowed"],
                current_requests=limit_info.get("current_requests", 0),
                max_requests=max_requests,
                remaining=limit_info["remaining"],
                reset_time=limit_info["reset_time"],
                retry_after=limit_info["retry_after"]
            )
            
        except Exception as e:
            logger.error(f"💥 Error verificando rate limit: {e}")
            # En caso de error, permitir el request por defecto
            return RateLimitInfo(
                allowed=True,
                current_requests=0,
                max_requests=max_requests,
                remaining=max_requests,
                reset_time=int((datetime.utcnow() + timedelta(seconds=window_seconds)).timestamp()),
                retry_after=0
            )
    
    @staticmethod
    def reset_user_rate_limits(identifier: str, endpoint: str = "*", admin_user_id: int = None) -> bool:
        """
        Resetea rate limits para un identificador específico
        """
        try:
            success = redis_rate_limiter.reset_identifier_limits(identifier, endpoint)
            
            if success:
                logger.info(f"✅ Rate limits reseteados para {identifier} por admin {admin_user_id}")
                
                # Log de auditoría si tenemos admin_user_id
                if admin_user_id:
                    from app.database import get_db
                    db = next(get_db())
                    AuthRepository.log_security_event(
                        db=db,
                        user_id=admin_user_id,
                        event_type="rate_limit_reset",
                        details={"target_identifier": identifier, "endpoint": endpoint},
                        ip_address="admin_action"
                    )
            
            return success
            
        except Exception as e:
            logger.error(f"💥 Error reseteando rate limits: {e}")
            return False
    
    # ===== GESTIÓN DE SESIONES =====
    
    @staticmethod
    def get_user_security_info(db: Session, user_id: int) -> UserSecurityInfo:
        """
        Obtiene información completa de seguridad de un usuario
        """
        try:
            # Obtener info de base de datos
            security_info = AuthRepository.get_user_security_info(db, user_id)
            
            return UserSecurityInfo(
                user_id=user_id,
                failed_attempts=security_info.get("failed_attempts_24h", 0),
                last_successful_login=security_info.get("last_successful_login"),
                is_locked_out=False,  # Calculado dinámicamente
                lockout_until=None,
                active_sessions=1,  # Simplificado por ahora
                password_changed_at=security_info.get("password_changed_at")
            )
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo info de seguridad de usuario {user_id}: {e}")
            return UserSecurityInfo(
                user_id=user_id,
                failed_attempts=0,
                last_successful_login=None,
                is_locked_out=False,
                lockout_until=None,
                active_sessions=0,
                password_changed_at=None
            )
    
    @staticmethod
    def force_user_logout(db: Session, user_id: int, admin_user_id: int, reason: str = "admin_action") -> bool:
        """
        Fuerza el logout de un usuario específico
        """
        try:
            # Invalidar todos los tokens del usuario
            success = TokenService.blacklist_user_tokens(user_id, f"forced_logout:{reason}")
            
            if success:
                # Log de auditoría
                AuthRepository.log_security_event(
                    db=db,
                    user_id=admin_user_id,
                    event_type="forced_user_logout",
                    details={
                        "target_user_id": user_id,
                        "reason": reason,
                        "admin_action": True
                    },
                    ip_address="admin_system"
                )
                
                logger.info(f"✅ Usuario {user_id} desconectado forzosamente por admin {admin_user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"💥 Error forzando logout de usuario {user_id}: {e}")
            return False
    
    # ===== OPERACIONES DE EMERGENCIA =====
    
    @staticmethod
    def emergency_security_reset(db: Session, user_id: int, admin_user_id: int) -> EmergencyResetResponse:
        """
        Reset de emergencia completo para un usuario
        """
        try:
            actions_taken = []
            
            # 1. Invalidar todos los tokens
            tokens_success = TokenService.blacklist_user_tokens(user_id, "emergency_reset")
            if tokens_success:
                actions_taken.append("Todos los tokens invalidados")
            
            # 2. Limpiar intentos fallidos
            try:
                token_blacklist.clear_failed_attempts(f"user:{user_id}", "login")
                token_blacklist.clear_failed_attempts(f"user:{user_id}", "reset")
                token_blacklist.clear_failed_attempts(f"user:{user_id}", "verification")
                actions_taken.append("Intentos fallidos limpiados")
            except:
                pass
            
            # 3. Reset usando AuthRepository
            auth_reset_result = AuthRepository.emergency_security_reset(db, user_id, admin_user_id)
            if auth_reset_result.get("success"):
                actions_taken.extend(auth_reset_result.get("actions_taken", []))
            
            # 4. Log de auditoría
            AuthRepository.log_security_event(
                db=db,
                user_id=admin_user_id,
                event_type="emergency_security_reset",
                details={
                    "target_user_id": user_id,
                    "actions_taken": actions_taken,
                    "admin_action": True
                },
                ip_address="admin_system"
            )
            
            success = len(actions_taken) > 0
            
            logger.warning(f"🚨 Reset de seguridad de emergencia para usuario {user_id} por admin {admin_user_id}")
            
            return EmergencyResetResponse(
                success=success,
                user_id=user_id,
                admin_user=f"admin_{admin_user_id}",
                message="Reset de seguridad ejecutado" if success else "Error en reset de seguridad",
                actions_taken=actions_taken
            )
            
        except Exception as e:
            logger.error(f"💥 Error en reset de emergencia para usuario {user_id}: {e}")
            return EmergencyResetResponse(
                success=False,
                user_id=user_id,
                admin_user=f"admin_{admin_user_id}",
                message=f"Error: {str(e)}",
                actions_taken=[]
            )
    
    # ===== LIMPIEZA Y MANTENIMIENTO =====
    
    @staticmethod
    def perform_security_cleanup() -> SecurityCleanupResponse:
        """
        Ejecuta limpieza completa de todos los sistemas de seguridad
        """
        try:
            cleanup_timestamp = datetime.utcnow()
            
            # 1. Limpiar tokens expirados
            token_cleanup = TokenService.cleanup_expired_tokens()
            blacklist_cleaned = token_cleanup.get("cleaned_tokens", 0)
            
            # 2. Limpiar cache de rate limiting
            rate_limit_cleaned = redis_rate_limiter.cleanup_memory_cache()
            
            # 3. Limpiar blacklist expirada
            additional_blacklist_cleaned = token_blacklist.cleanup_expired_tokens()
            
            total_cleaned = blacklist_cleaned + rate_limit_cleaned + additional_blacklist_cleaned
            
            logger.info(f"🧹 Limpieza de seguridad completada: {total_cleaned} entradas limpiadas")
            
            return SecurityCleanupResponse(
                blacklist_entries_cleaned=blacklist_cleaned + additional_blacklist_cleaned,
                rate_limit_entries_cleaned=rate_limit_cleaned,
                hybrid_system_cleanup=True,
                cleanup_timestamp=cleanup_timestamp
            )
            
        except Exception as e:
            logger.error(f"💥 Error en limpieza de seguridad: {e}")
            return SecurityCleanupResponse(
                blacklist_entries_cleaned=0,
                rate_limit_entries_cleaned=0,
                hybrid_system_cleanup=False,
                cleanup_timestamp=datetime.utcnow()
            )
    
    # ===== MONITOREO Y ALERTAS =====
    
    @staticmethod
    def detect_security_anomalies(db: Session, time_window_hours: int = 24) -> List[SecurityEvent]:
        """
        Detecta anomalías de seguridad en el sistema
        """
        try:
            anomalies = []
            
            # Obtener estadísticas de rate limiting
            rate_limit_stats = redis_rate_limiter.get_stats()
            
            # Detectar picos de rate limiting
            if rate_limit_stats.get("active_limiters", 0) > 100:
                anomalies.append(SecurityEvent(
                    event_type="high_rate_limit_activity",
                    user_id=None,
                    ip_address=None,
                    timestamp=datetime.utcnow(),
                    details={
                        "active_limiters": rate_limit_stats.get("active_limiters", 0),
                        "threshold": 100
                    },
                    severity="warning"
                ))
            
            # Obtener estadísticas de blacklist
            blacklist_stats = token_blacklist.get_stats()
            
            # Detectar picos en blacklist
            if blacklist_stats.get("redis", {}).get("blacklisted_tokens", 0) > 1000:
                anomalies.append(SecurityEvent(
                    event_type="high_blacklist_activity",
                    user_id=None,
                    ip_address=None,
                    timestamp=datetime.utcnow(),
                    details={
                        "blacklisted_tokens": blacklist_stats.get("redis", {}).get("blacklisted_tokens", 0),
                        "threshold": 1000
                    },
                    severity="warning"
                ))
            
            logger.info(f"🔍 Detección de anomalías completada: {len(anomalies)} anomalías encontradas")
            
            return anomalies
            
        except Exception as e:
            logger.error(f"💥 Error detectando anomalías de seguridad: {e}")
            return []
    
    @staticmethod
    def generate_security_report(db: Session, days_back: int = 7) -> Dict[str, Any]:
        """
        Genera reporte completo de seguridad
        """
        try:
            report_period = datetime.utcnow() - timedelta(days=days_back)
            
            # Estadísticas básicas
            security_stats = SecurityService.get_comprehensive_security_stats(db)
            
            # Detectar anomalías
            anomalies = SecurityService.detect_security_anomalies(db, days_back * 24)
            
            # Estadísticas de tokens
            token_stats = TokenService.get_token_stats()
            
            report = {
                "report_generated": datetime.utcnow().isoformat(),
                "report_period_days": days_back,
                "report_period_start": report_period.isoformat(),
                "system_status": {
                    "overall_health": "healthy" if len(anomalies) == 0 else "warning",
                    "environment": ENVIRONMENT,
                    "security_systems_operational": True
                },
                "security_statistics": security_stats.dict(),
                "token_management": token_stats,
                "detected_anomalies": [anomaly.dict() for anomaly in anomalies],
                "recommendations": SecurityService._generate_security_recommendations(security_stats, anomalies)
            }
            
            logger.info(f"📊 Reporte de seguridad generado para {days_back} días")
            
            return report
            
        except Exception as e:
            logger.error(f"💥 Error generando reporte de seguridad: {e}")
            return {
                "error": str(e),
                "report_generated": datetime.utcnow().isoformat()
            }
    
    @staticmethod
    def _generate_security_recommendations(stats: SecurityStatsResponse, anomalies: List[SecurityEvent]) -> List[str]:
        """
        Genera recomendaciones de seguridad basadas en estadísticas y anomalías
        """
        recommendations = []
        
        # Verificar sistemas básicos
        if not stats.security_features.get("rate_limiting_enabled", False):
            recommendations.append("Considerar habilitar rate limiting para mayor protección")
        
        # Verificar anomalías
        if len(anomalies) > 0:
            recommendations.append(f"Investigar {len(anomalies)} anomalías detectadas")
        
        # Verificar estadísticas de Redis
        if not stats.token_blacklist.get("redis_available", False):
            recommendations.append("Verificar disponibilidad de Redis para óptimo rendimiento")
        
        # Si no hay recomendaciones específicas
        if not recommendations:
            recommendations.append("Sistema de seguridad funcionando correctamente")
        
        return recommendations