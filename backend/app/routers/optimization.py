from fastapi import APIRouter, HTTPException
from app.schemas.methods import (
    GoldenSectionUniRequest,
    GoldenSectionUniResponse,
    GoldenSectionMultiRequest,
    GoldenSectionMultiResponse
)
from app.services.optimization import (
    golden_section_univariate,
    golden_section_multivariate
)

router = APIRouter(prefix="/optimizacion", tags=["Optimización"])

@router.post("/seccion-dorada-univariada", response_model=GoldenSectionUniResponse, summary="Método de la Sección Dorada Univariada")
def api_seccion_dorada_uni(req: GoldenSectionUniRequest):
    """
    Endpoint dedicado únicamente al método de Búsqueda de la Sección Dorada Univariada.
    Permite maximización o minimización y control de tolerancia por cifras significativas.
    """
    try:
        res = golden_section_univariate(
            function_str=req.function,
            x0_in=req.x0,
            x3_in=req.x3,
            decimals=req.decimals,
            max_iter=req.max_iter,
            goal=req.goal
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/seccion-dorada-multivariada", response_model=GoldenSectionMultiResponse, summary="Método de la Sección Dorada Multivariada")
def api_seccion_dorada_multi(req: GoldenSectionMultiRequest):
    """
    Endpoint dedicado únicamente a la Búsqueda de Sección Dorada Multivariada (optimización alternada en 2D).
    """
    try:
        res = golden_section_multivariate(
            function_str=req.function,
            x_range=req.x_range,
            y_range=req.y_range,
            x_init=req.x_init,
            y_init=req.y_init,
            decimals=req.decimals,
            max_cycles=req.max_cycles,
            goal=req.goal
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
