from fastapi import APIRouter, HTTPException
from app.schemas.methods import (
    IntegrationRequest,
    IntegrationResponse
)
from app.services.integration import (
    trapezoid_integration,
    simpson_13_integration,
    simpson_38_integration
)

router = APIRouter(prefix="/integracion", tags=["Integración Numérica"])

@router.post("/trapecio", response_model=IntegrationResponse, summary="Método del Trapecio (Simple y Compuesto)")
def api_trapecio(req: IntegrationRequest):
    """
    Endpoint dedicado únicamente al método de Integración por Regla de los Trapecios.
    Acepta tanto funciones continuas f(x) con límites (a, b) como datos tabulados (puntos discretos).
    """
    try:
        pts = [p.model_dump() for p in req.points] if req.points else None
        res = trapezoid_integration(
            function_str=req.function,
            a_in=req.a,
            b_in=req.b,
            n_in=req.n,
            points=pts
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simpson-13", response_model=IntegrationResponse, summary="Método de Simpson 1/3 Compuesto")
def api_simpson_13(req: IntegrationRequest):
    """
    Endpoint dedicado únicamente a la regla de integración de Simpson 1/3 compuesta.
    Requiere un número par de subintervalos n (o número impar de puntos en tabla).
    """
    try:
        pts = [p.model_dump() for p in req.points] if req.points else None
        res = simpson_13_integration(
            function_str=req.function,
            a_in=req.a,
            b_in=req.b,
            n_in=req.n,
            points=pts
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simpson-38", response_model=IntegrationResponse, summary="Método de Simpson 3/8 Compuesto")
def api_simpson_38(req: IntegrationRequest):
    """
    Endpoint dedicado únicamente a la regla de integración de Simpson 3/8 compuesta.
    Requiere que el número de subintervalos n sea múltiplo de 3.
    """
    try:
        pts = [p.model_dump() for p in req.points] if req.points else None
        res = simpson_38_integration(
            function_str=req.function,
            a_in=req.a,
            b_in=req.b,
            n_in=req.n,
            points=pts
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
