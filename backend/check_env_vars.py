import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

keys = ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'JWT_SECRET', 'SECRET_KEY', 'MONGO_URL']
for k in keys:
    v = os.environ.get(k)
    if v is None:
        print(f"{k}=NO EXISTE")
    elif v == '':
        print(f"{k}=VACÍA")
    else:
        print(f"{k}=EXISTE (len={len(v)})")