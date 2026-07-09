# DEPENDENCY GRAPH
## Punto Cero System OS — Backend

### Runtime Tree

```
Python 3.11.9
│
├── uvicorn 0.29.0 [requirements.txt line 5]
│   ├── click >=7.0
│   ├── h11 >=0.8
│   ├── httptools* 0.8.0          # [standard] extras
│   ├── uvloop*                   # [standard] Linux only
│   └── websockets* 16.0          # [standard] extras
│
├── fastapi 0.110.1 [requirements.txt line 4]
│   ├── starlette 0.37.2          # pinned via fastapi dep
│   │   └── anyio >=3.4.0
│   │       └── idna >=2.8
│   ├── pydantic >=1.7.4,<3.0.0
│   │   └── pydantic-core
│   │   └── annotated-types >=0.6.0
│   │   └── typing-inspection >=0.4.2
│   └── typing-extensions >=4.8.0
│
├── motor 3.4.0 [requirements.txt line 10]
│   └── pymongo 4.7.2
│       └── dnspython >=1.16.0
│
├── python-jose 3.3.0 [requirements.txt line 23]
│   └── cryptography*             # [cryptography] extras
│       └── cffi
│   └── ecdsa >=0.13
│   └── pyasn1
│   └── rsa >=3.0
│
├── passlib 1.7.4 [requirements.txt line 21]
│   └── bcrypt 4.0.1 [requirements.txt line 22]
│
├── httpx 0.27.2 [requirements.txt line 26]
│   └── httpcore 1.0.9
│       └── certifi
│       └── h11
│   └── sniffio
│
├── anthropic 0.69.0 [requirements.txt line 30]
│   └── httpx (shared)
│   └── pydantic (shared)
│   └── jiter >=0.4.0
│
├── slowapi 0.1.10 [requirements.txt line 7]
│   └── limits >=2.3
│       └── Deprecated >=1.2
│       └── packaging >=21
│
├── bleach 6.4.0 [requirements.txt line 15]
│   └── webencodings
│
└── python-dotenv 1.0.1 [requirements.txt line 18]
```

### Uvicorn Standard Extras
- `httptools` — HTTP request parsing (performance)
- `websockets` — WebSocket support (not used directly)
- `uvloop` — Event loop optimization (Linux only, no-op on Windows)

### Critical Compatibility Constraints

| Constraint | Source | Compatible? |
|-----------|--------|-------------|
| fastapi[email]==0.110.1 | requirements.txt | ✅ |
| starlette==0.37.2 | fastapi needs >=0.37.2,<0.38 | ✅ |
| pydantic>=2.7.4 | requirements.txt | ✅ (2.13.4) |
| uvicorn[standard]==0.29.0 | requirements.txt | ✅ |

### FastAPI `@app.lifespan` Deprecation Timeline

| FastAPI Version | `@app.lifespan` decorator | `lifespan=` param | Status |
|----------------|--------------------------|-------------------|--------|
| 0.92.0 | ❌ No | ❌ No | Old |
| 0.93.0 (Jun 2023) | ✅ Yes | ❌ No | Compatible |
| 0.100.0 (Aug 2023) | ✅ Yes | ❌ No | Compatible |
| 0.110.0 (Jul 2024) | ❌ Deprecated | ✅ Yes | Current |
| 0.110.1 | ❌ Deprecated | ✅ Yes | INSTALLED |
| 0.115.0+ | ❌ Removed | ✅ Yes | Newer |

**Conclusion:** The code (server.py:153) was written for fastapi 0.93–0.109.x. The installed version 0.110.1 removed the `@app.lifespan` decorator.