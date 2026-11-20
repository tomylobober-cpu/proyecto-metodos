from fastapi import APIRouter, HTTPException
from app.schemas.methods import (
    DirectInterpolationRequest,
    DirectInterpolationResponse,
    RegressionRequest,
    RegressionResponse
)
from app.services.interpolation import (
    direct_interpolation,
    least_squares_regression
)

router = APIRouter(prefix="/interpolacion", tags=["Interpolación y Ajuste de Curvas"])

@router.post("/directa", response_model=DirectInterpolationResponse, summary="Método de Interpolación Polinomial Directa")
def api_interpolacion_directa(req: DirectInterpolationRequest):
    """
    Endpoint dedicado únicamente al método de Interpolación Directa mediante matriz de Vandermonde.
    Calcula los coeficientes del polinomio exacto que pasa por los puntos y permite evaluar un valor x.
    """
    try:
        pts = [p.model_dump() for p in req.points]
        res = direct_interpolation(points=pts, eval_x=req.eval_x)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/regresion-minimos-cuadrados", response_model=RegressionResponse, summary="Método de Regresión por Mínimos Cuadrados")
def api_regresion_mc(req: RegressionRequest):
    """
    Endpoint dedicado únicamente a la Regresión por Mínimos Cuadrados (lineal o polinomial).
    Retorna la ecuación normal resuelta, R^2, coeficientes y puntos de la curva ajustada.
    """
    try:
        pts = [p.model_dump() for p in req.points]
        res = least_squares_regression(points=pts, degree=req.degree, eval_x=req.eval_x)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
