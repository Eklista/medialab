#!/usr/bin/env python3
"""
Script para extraer JTI de tu token JWE actual
"""
import sys
import os
import hashlib
from jose import jwe, jwt

# Tu token JWE
token_jwe = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..V4ViDfL5EsVXAC4x.ctWKTsi7-IjpKK-90ctjATVu1h0xwMcImaQWFDcT6vTHYpJpS4HcYV7-X9MMJz80Fj3umR4A9iuwoaR98B1LvQaYcpEz0DmiTDbnIw8Sh6JGmv8xJ1B-SEvVv5tR8q_qTA4K730iNxg2C7t1dUVnd9zUNRrMY_H9h38SJyVPox2GhGskmMKamHwz4-WJM9BVPwKoLF6TIAhAjOxKmIfPM6anDtPdTcH5xrBTuG5nDcbPwJ1tU09JiwGqQUY7uqrxnlFS5IFricQLLKLUTeNs7Q2qhs-4Td3nXCtDlqBoz0fV5ImRpWKw8vR5lpFnTlfhAxbePBpjno3FWjvFG-OHZ2HqoUOe_u5U4IdZogaKjP2QBNL1bbE07vKKs_5icQWXi1DlTWBbHYWPjrEK_mOFPv0.gnHOhwfIA-n0yyurxK3zFQ"

# Tu SECRET_KEY (usar la del .env)
SECRET_KEY = "aUgkMhDGJGsS9TTGFinsLhtF69gOq9au1zEaCzGtKKQ"

try:
    print("🔍 EXTRAYENDO JTI DEL TOKEN JWE")
    print("=" * 40)
    
    # Preparar clave de desencriptación
    encryption_key = hashlib.sha256(SECRET_KEY.encode()).digest()
    
    # Desencriptar JWE
    print("1. Desencriptando token JWE...")
    decrypted_bytes = jwe.decrypt(token_jwe.encode(), encryption_key)
    jwt_token = decrypted_bytes.decode()
    print(f"   JWT desencriptado: {jwt_token[:50]}...")
    
    # Extraer payload sin verificar
    print("2. Extrayendo JTI...")
    unverified_payload = jwt.get_unverified_claims(jwt_token)
    jti = unverified_payload.get("jti")
    
    print(f"✅ JTI extraído: {jti}")
    print("")
    
    # Generar SQL para blacklist
    print("🔧 SQL PARA BLACKLIST:")
    print("=" * 40)
    sql = f"""INSERT INTO token_blacklist (token_id, user_id, token_type, expires_at, reason) 
VALUES ('{jti}', 1, 'access', DATE_ADD(NOW(), INTERVAL 1 HOUR), 'browser_test');"""
    
    print(sql)
    print("")
    
    # Comando completo
    print("🚀 COMANDO COMPLETO:")
    print("=" * 40)
    print(f'docker exec -i medialab_db_1 mysql -u root -prootpassword medialab_db -e "{sql}"')
    print("")
    
    print("📋 PASOS SIGUIENTES:")
    print("1. Ejecutar el comando SQL arriba")
    print("2. Refrescar tu navegador")
    print("3. Deberías ser deslogueado automáticamente")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Verificar que SECRET_KEY sea correcta")