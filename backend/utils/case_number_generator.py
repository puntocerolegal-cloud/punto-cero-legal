from datetime import datetime
import random
import string

def generate_case_number() -> str:
    """
    Genera un número de caso único en el formato:
    CASO-YYYY-XXXXX
    Ejemplo: CASO-2025-A3B7D
    """
    year = datetime.now().year
    random_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"CASO-{year}-{random_id}"

def generate_invoice_number() -> str:
    """
    Genera un número de factura único en el formato:
    INV-YYYY-XXXXX
    Ejemplo: INV-2025-12345
    """
    year = datetime.now().year
    random_id = ''.join(random.choices(string.digits, k=5))
    return f"INV-{year}-{random_id}"
