# test_websocket.py - Script para probar la conexión WebSocket
"""
🧪 SCRIPT DE TESTING WEBSOCKET
Prueba la conexión WebSocket para diagnosticar problemas
"""

import asyncio
import websockets
import json
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_websocket_connection():
    """
    Prueba la conexión WebSocket básica
    """
    uri = "ws://localhost:8000/ws/test"  # Usar endpoint de testing
    
    try:
        logger.info(f"🔌 Intentando conectar a: {uri}")
        
        async with websockets.connect(uri) as websocket:
            logger.info("✅ Conexión WebSocket establecida exitosamente")
            
            # Enviar mensaje de prueba
            test_message = {
                "type": "test",
                "data": {
                    "message": "Hola desde script de testing",
                    "timestamp": "2025-05-29T17:00:00Z"
                }
            }
            
            await websocket.send(json.dumps(test_message))
            logger.info("📤 Mensaje de prueba enviado")
            
            # Esperar respuesta por 10 segundos
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                response_data = json.loads(response)
                logger.info(f"📨 Respuesta recibida: {response_data}")
                
                # Enviar ping
                ping_message = {
                    "type": "ping",
                    "data": {"timestamp": "test"}
                }
                
                await websocket.send(json.dumps(ping_message))
                logger.info("🏓 Ping enviado")
                
                # Esperar pong
                pong_response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                pong_data = json.loads(pong_response)
                logger.info(f"🏓 Pong recibido: {pong_data}")
                
                return True
                
            except asyncio.TimeoutError:
                logger.warning("⏰ Timeout esperando respuesta del servidor")
                return False
                
    except websockets.exceptions.InvalidStatusCode as e:
        logger.error(f"❌ Error de código de estado: {e}")
        logger.error(f"   Código: {e.status_code}")
        logger.error(f"   Headers: {e.response_headers}")
        return False
        
    except websockets.exceptions.ConnectionClosedError as e:
        logger.error(f"❌ Conexión cerrada: {e}")
        logger.error(f"   Código: {e.code}")
        logger.error(f"   Razón: {e.reason}")
        return False
        
    except Exception as e:
        logger.error(f"💥 Error inesperado: {e}")
        return False

async def test_with_user_id():
    """
    Prueba la conexión con user_id
    """
    uri = "ws://localhost:8000/ws/?user_id=1"
    
    try:
        logger.info(f"🔌 Probando conexión con user_id: {uri}")
        
        async with websockets.connect(uri) as websocket:
            logger.info("✅ Conexión con user_id establecida")
            
            # Esperar mensaje de bienvenida
            welcome = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            welcome_data = json.loads(welcome)
            logger.info(f"🎉 Mensaje de bienvenida: {welcome_data}")
            
            return True
            
    except Exception as e:
        logger.error(f"💥 Error con user_id: {e}")
        return False

async def test_websocket_endpoints():
    """
    Prueba diferentes endpoints WebSocket
    """
    endpoints = [
        "ws://localhost:8000/ws/test",
        "ws://localhost:8000/ws/?user_id=1", 
        "ws://localhost:8000/ws/secure"
    ]
    
    results = {}
    
    for endpoint in endpoints:
        logger.info(f"\n🧪 Probando endpoint: {endpoint}")
        
        try:
            async with websockets.connect(endpoint) as websocket:
                logger.info(f"✅ {endpoint} - CONECTADO")
                
                # Intentar recibir mensaje de bienvenida
                try:
                    welcome = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                    logger.info(f"📨 Mensaje recibido: {welcome[:100]}...")
                    results[endpoint] = "SUCCESS"
                except asyncio.TimeoutError:
                    logger.info("⏰ No se recibió mensaje de bienvenida (normal)")
                    results[endpoint] = "SUCCESS_NO_WELCOME"
                    
        except websockets.exceptions.InvalidStatusCode as e:
            logger.error(f"❌ {endpoint} - ERROR {e.status_code}")
            results[endpoint] = f"ERROR_{e.status_code}"
            
        except Exception as e:
            logger.error(f"💥 {endpoint} - ERROR: {e}")
            results[endpoint] = f"ERROR: {str(e)}"
    
    return results

async def main():
    """
    Función principal de testing
    """
    logger.info("🚀 Iniciando tests de WebSocket")
    logger.info("=" * 50)
    
    # Test 1: Conexión básica
    logger.info("\n1️⃣ Test de conexión básica")
    basic_result = await test_websocket_connection()
    logger.info(f"Resultado: {'✅ ÉXITO' if basic_result else '❌ FALLO'}")
    
    # Test 2: Conexión con user_id
    logger.info("\n2️⃣ Test de conexión con user_id")
    userid_result = await test_with_user_id()
    logger.info(f"Resultado: {'✅ ÉXITO' if userid_result else '❌ FALLO'}")
    
    # Test 3: Múltiples endpoints
    logger.info("\n3️⃣ Test de múltiples endpoints")
    endpoints_results = await test_websocket_endpoints()
    
    logger.info("\n📊 RESUMEN DE RESULTADOS:")
    logger.info("=" * 50)
    logger.info(f"Conexión básica: {'✅' if basic_result else '❌'}")
    logger.info(f"Conexión con user_id: {'✅' if userid_result else '❌'}")
    
    logger.info("\nEndpoints probados:")
    for endpoint, result in endpoints_results.items():
        status = "✅" if "SUCCESS" in result else "❌"
        logger.info(f"{status} {endpoint}: {result}")
    
    # Diagnóstico
    logger.info("\n🔍 DIAGNÓSTICO:")
    if basic_result and userid_result:
        logger.info("✅ WebSocket funcionando correctamente")
    elif not basic_result and not userid_result:
        logger.info("❌ WebSocket no está funcionando - revisar backend")
        logger.info("💡 Sugerencias:")
        logger.info("   - Verificar que el servidor esté ejecutándose")
        logger.info("   - Revisar logs del backend")
        logger.info("   - Verificar configuración WebSocket")
    else:
        logger.info("⚠️ Funcionamiento parcial - revisar configuración")

if __name__ == "__main__":
    asyncio.run(main())