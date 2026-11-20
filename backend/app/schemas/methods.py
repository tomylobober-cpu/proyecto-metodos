from typing import List, Optional, Any, Dict, Union
from pydantic import BaseModel, Field

# Modelos base para puntos (x, y)
class Point2D(BaseModel):
    x: float
    y: float

# ==================== RAÍCES ====================
class BisectionRequest(BaseModel):
    function: str = Field(..., description="Función f(x), ej: 'x - cos(x)'")
    a: float = Field(..., description="Límite inferior del intervalo")
    b: float = Field(..., description="Límite superior del intervalo")
    tol: float = Field(default=0.5e-5, description="Tolerancia del error deseado")
    max_iter: int = Field(default=100, description="Máximo número de iteraciones")

class FalsePositionRequest(BaseModel):
    function: str = Field(..., description="Función f(x), ej: 'x - cos(x)'")
    a: float = Field(..., description="Límite inferior del intervalo")
    b: float = Field(..., description="Límite superior del intervalo")
    tol: float = Field(default=0.5e-5, description="Tolerancia del error deseado")
    max_iter: int = Field(default=100, description="Máximo número de iteraciones")

class NewtonRaphsonRequest(BaseModel):
    function: str = Field(..., description="Función f(x), ej: 'x - cos(x)'")
    derivative: Optional[str] = Field(default=None, description="Derivada f'(x). Si es None, se calcula analíticamente.")
    x0: float = Field(..., description="Aproximación inicial x0")
    tol: float = Field(default=0.5e-5, description="Tolerancia del error deseado")
    max_iter: int = Field(default=100, description="Máximo número de iteraciones")

class SecantRequest(BaseModel):
    function: str = Field(..., description="Función f(x), ej: 'x - cos(x)'")
    x_actual: float = Field(..., description="Valor inicial actual x0")
    x_anterior: float = Field(..., description="Valor inicial anterior x_prev")
    tol: float = Field(default=0.5e-5, description="Tolerancia del error deseado")
    max_iter: int = Field(default=100, description="Máximo número de iteraciones")

class RootIterationItem(BaseModel):
    iteration: int
    a: Optional[float] = None
    b: Optional[float] = None
    c: float
    f_a: Optional[float] = None
    f_b: Optional[float] = None
    f_c: Optional[float] = None
    error: Optional[float] = None

class RootResponse(BaseModel):
    method: str
    root: float
    iterations: int
    values: List[float]
    history: List[RootIterationItem]
    message: str

# ==================== OPTIMIZACIÓN ====================
class GoldenSectionUniRequest(BaseModel):
    function: str = Field(..., description="Función f(x), ej: '2*sin(x) - (x**2)/10'")
    x0: float = Field(..., description="Límite inferior inicial")
    x3: float = Field(..., description="Límite superior inicial")
    decimals: int = Field(default=5, description="Cifras significativas para tolerancia 0.5*10^-n")
    max_iter: int = Field(default=100, description="Máximo número de iteraciones")
    goal: str = Field(default="max", description="'max' para maximizar o 'min' para minimizar")

class GoldenSectionUniIterationItem(BaseModel):
    iteration: int
    x0: float
    x1: float
    x2: float
    x3: float
    f_x1: float
    f_x2: float
    opt_ant: float
    opt_act: float
    error: float

class GoldenSectionUniResponse(BaseModel):
    method: str
    optimal_x: float
    optimal_value: float
    iterations: int
    history: List[GoldenSectionUniIterationItem]
    message: str

class GoldenSectionMultiRequest(BaseModel):
    function: str = Field(default="(x-3)**2 + (y-5)**2 + 10", description="Función f(x, y), ej: '(x-3)**2 + (y-5)**2 + 10'")
    x_range: List[float] = Field(default=[0.0, 6.0], description="Rango de búsqueda en x [x0, x3]")
    y_range: List[float] = Field(default=[0.0, 10.0], description="Rango de búsqueda en y [y0, y3]")
    x_init: float = Field(default=0.0, description="Punto inicial x")
    y_init: float = Field(default=0.0, description="Punto inicial y")
    decimals: int = Field(default=5, description="Cifras significativas para tolerancia (n)")
    max_cycles: int = Field(default=50, description="Máximo número de ciclos multivariados")
    goal: str = Field(default="min", description="'min' para minimizar o 'max' para maximizar")

class GoldenSectionMultiResponse(BaseModel):
    method: str
    optimal_x: float
    optimal_y: float
    optimal_value: float
    cycles: int
    history: List[Dict[str, Any]]
    message: str

# ==================== INTEGRACIÓN ====================
class IntegrationRequest(BaseModel):
    function: Optional[str] = Field(default=None, description="Función continua f(x), ej: 'x - cos(x)'")
    a: Optional[float] = Field(default=None, description="Límite inferior de integración")
    b: Optional[float] = Field(default=None, description="Límite superior de integración")
    n: Optional[int] = Field(default=10, description="Número de subintervalos")
    points: Optional[List[Point2D]] = Field(default=None, description="Tabla de datos discretos (x, y)")

class IntegrationResponse(BaseModel):
    method: str
    integral_approx: float
    n_intervals: int
    step_h: float
    details: Dict[str, Any]
    exact_value: Optional[float] = None
    relative_error: Optional[float] = None
    message: str

# ==================== INTERPOLACIÓN Y REGRESIÓN ====================
class DirectInterpolationRequest(BaseModel):
    points: List[Point2D] = Field(..., description="Lista de puntos (x, y) conocidos")
    eval_x: Optional[float] = Field(default=None, description="Valor x opcional donde evaluar el polinomio resultante")

class DirectInterpolationResponse(BaseModel):
    method: str
    degree: int
    coefficients: List[float] = Field(..., description="Coeficientes [a_n, a_{n-1}, ..., a_0]")
    vandermonde_matrix: List[List[float]]
    polynomial_str: str
    evaluated_x: Optional[float] = None
    evaluated_y: Optional[float] = None
    curve_points: List[Point2D]
    message: str

class RegressionRequest(BaseModel):
    points: List[Point2D] = Field(..., description="Lista de puntos observados (x, y)")
    degree: int = Field(default=1, description="Grado del polinomio de regresión (1=Lineal, 2=Parabólica, etc.)")
    eval_x: Optional[float] = Field(default=None, description="Valor x opcional a evaluar")

class RegressionResponse(BaseModel):
    method: str
    degree: int
    coefficients: List[float] = Field(..., description="Coeficientes de mayor a menor grado [a_m, ..., a_0]")
    equation_str: str
    r2_score: float
    evaluated_x: Optional[float] = None
    evaluated_y: Optional[float] = None
    curve_points: List[Point2D]
    message: str
