from fastapi import APIRouter, HTTPException
from app.schemas.methods import (
    BisectionRequest,
    FalsePositionRequest,
    NewtonRaphsonRequest,
    SecantRequest,
    RootResponse
)
from app.services.roots import (
    bisection_method,
    false_position_method,
    newton_raphson_method,
    secant_method
)

router = APIRouter(prefix="/raices", tags=["Búsqueda de Raíces"])

@router.post("/biseccion", response_model=RootResponse, summary="Método de Bisección")
def api_biseccion(req: BisectionRequest):
    """
    Endpoint dedicado únicamente al método cerrado de Bisección.
    """
    try:
        res = bisection_method(
            function_str=req.function,
            a_in=req.a,
            b_in=req.b,
            tol=req.tol,
            max_iter=req.max_iter
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/falsa-posicion", response_model=RootResponse, summary="Método de la Falsa Posición")
def api_falsa_posicion(req: FalsePositionRequest):
    """
    Endpoint dedicado únicamente al método cerrado de Falsa Posición (Regula Falsi).
    """
    try:
        res = false_position_method(
            function_str=req.function,
            a_in=req.a,
            b_in=req.b,
            tol=req.tol,
            max_iter=req.max_iter
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/newton-raphson", response_model=RootResponse, summary="Método de Newton-Raphson")
def api_newton_raphson(req: NewtonRaphsonRequest):
    """
    Endpoint dedicado únicamente al método abierto de Newton-Raphson.
    """
    try:
        res = newton_raphson_method(
            function_str=req.function,
            x0_in=req.x0,
            derivative_str=req.derivative,
            tol=req.tol,
            max_iter=req.max_iter
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/secante", response_model=RootResponse, summary="Método de la Secante")
def api_secante(req: SecantRequest):
    """
    Endpoint dedicado únicamente al método abierto de la Secante.
    """
    try:
        res = secant_method(
            function_str=req.function,
            x_actual_in=req.x_actual,
            x_anterior_in=req.x_anterior,
            tol=req.tol,
            max_iter=req.max_iter
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
