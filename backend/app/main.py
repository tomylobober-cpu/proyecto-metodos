from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import roots, optimization, integration, interpolation

app = FastAPI(
    title="API de Métodos Numéricos",
    description=(
        "Backend desarrollado con FastAPI y Python donde cada endpoint está dedicado "
        "únicamente a un método numérico específico (Raíces, Optimización, Integración e Interpolación)."
    ),
    version="1.0.0"
)

# Configuración de CORS para conectar sin restricciones con el frontend (Vite/React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers modulares por categoría
app.include_router(roots.router)
app.include_router(optimization.router)
app.include_router(integration.router)
app.include_router(interpolation.router)

@app.get("/", tags=["General"])
def read_root():
    return {
        "message": "Bienvenido al Backend de Métodos Numéricos con FastAPI",
        "docs_url": "/docs",
        "endpoints_disponibles": {
            "raices": [
                "POST /raices/biseccion",
                "POST /raices/falsa-posicion",
                "POST /raices/newton-raphson",
                "POST /raices/secante"
            ],
            "optimizacion": [
                "POST /optimizacion/seccion-dorada-univariada",
                "POST /optimizacion/seccion-dorada-multivariada"
            ],
            "integracion": [
                "POST /integracion/trapecio",
                "POST /integracion/simpson-13",
                "POST /integracion/simpson-38"
            ],
            "interpolacion": [
                "POST /interpolacion/directa",
                "POST /interpolacion/regresion-minimos-cuadrados"
            ]
        }
    }
