"""
Test script para probar envío de correo vía Resend API
"""
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(backend_dir / '.env')

from utils.notifier import send_email_account_created

async def test_welcome_email():
    """Prueba el envío de correo de bienvenida usando Resend API"""
    
    print("=" * 80)
    print("PRUEBA DE ENVÍO DE CORREO - RESEND API")
    print("=" * 80)
    
    # Check configuration - allow override via command line args
    resend_key = os.environ.get("RESEND_API_KEY")
    resend_from = os.environ.get("RESEND_FROM")
    
    # If not in env, check command line args
    if not resend_key and len(sys.argv) > 1:
        resend_key = sys.argv[1]
    if not resend_from and len(sys.argv) > 2:
        resend_from = sys.argv[2]
    
    print("\n📋 CONFIGURACIÓN:")
    print(f"  RESEND_API_KEY: {'✅ Configurada' if resend_key else '❌ No configurada'}")
    if resend_key:
        print(f"    Key (primeros 10 chars): {resend_key[:10]}...")
    print(f"  RESEND_FROM: {resend_from or '❌ No configurada'}")
    print(f"  SMTP_HOST: {os.environ.get('SMTP_HOST', 'No configurado')}")
    
    if not resend_key:
        print("\n❌ ERROR: RESEND_API_KEY no está configurada")
        print("\n   OPCIONES:")
        print("   1. Configura RESEND_API_KEY en el archivo .env")
        print("   2. Pasa la API key como argumento:")
        print("      python test_resend_email.py <API_KEY> [RESEND_FROM]")
        print("\n   Ejemplo:")
        print("      python test_resend_email.py re_123456789 abc-123 no-reply@puntocerolegal.com")
        return
    
    # Test data
    test_email = "darwin@puntocerolegal.com"
    test_name = "Dr. Darwin Gomez"
    test_password = "TestPass2025!"
    test_expires = datetime.utcnow()
    test_firm = "Punto Cero Legal"
    
    print(f"\n📧 DATOS DE PRUEBA:")
    print(f"  Destinatario: {test_email}")
    print(f"  Nombre: {test_name}")
    print(f"  Firma: {test_firm}")
    print(f"  Contraseña temporal: {test_password}")
    
    print("\n" + "=" * 80)
    print("ENVIANDO CORREO...")
    print("=" * 80 + "\n")
    
    try:
        # Send email using the actual function
        result = send_email_account_created(
            to_email=test_email,
            full_name=test_name,
            temp_password=test_password,
            expires_at=test_expires,
            firm_name=test_firm
        )
        
        print("\n" + "=" * 80)
        print("RESULTADO DEL ENVÍO:")
        print("=" * 80)
        print(f"  Canal: {result.get('channel')}")
        print(f"  Enviado: {result.get('sent')}")
        print(f"  Proveedor: {result.get('provider', 'N/A')}")
        print(f"  ID Proveedor: {result.get('provider_id', 'N/A')}")
        print(f"  Email Trace ID: {result.get('email_trace_id', 'N/A')}")
        
        if result.get('sent'):
            print("\n✅ CORREO ENVIADO EXITOSAMENTE")
            print(f"   Revisa la bandeja de entrada de {test_email}")
            print(f"   ID de seguimiento: {result.get('provider_id')}")
        else:
            print("\n❌ ERROR EN EL ENVÍO")
            print(f"   Razón: {result.get('reason', 'Desconocida')}")
            print(f"   Fase de fallo: {result.get('failure_phase', 'N/A')}")
            print(f"   Código SMTP: {result.get('smtp_code', 'N/A')}")
            
        # Print full result for debugging
        print("\n📊 RESULTADO COMPLETO (JSON):")
        import json
        print(json.dumps(result, indent=2, default=str))
        
    except Exception as e:
        print(f"\n❌ EXCEPCIÓN DURANTE EL ENVÍO:")
        print(f"   Tipo: {type(e).__name__}")
        print(f"   Mensaje: {str(e)}")
        import traceback
        print("\n📋 STACK TRACE:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_welcome_email())