import numpy as np
import sympy as sp
from typing import List, Dict, Any, Optional
from app.services.evaluator import compile_function_1d

def compute_exact_integral_if_possible(sympy_expr, a: float, b: float):
    x_sym = sp.Symbol('x')
    try:
        anti_deriv = sp.integrate(sympy_expr, x_sym)
        val_b = float(anti_deriv.subs(x_sym, b))
        val_a = float(anti_deriv.subs(x_sym, a))
        return val_b - val_a
    except Exception:
        return None

def trapezoid_integration(
    function_str: Optional[str] = None,
    a_in: Optional[float] = None,
    b_in: Optional[float] = None,
    n_in: Optional[int] = 10,
    points: Optional[List[Dict[str, float]]] = None
) -> Dict[str, Any]:
    """
    Integración por Trapecios individual y compuesto.
    Soporta función continua f(x) o tabla de puntos [(x0,y0), (x1,y1)...].
    """
    areas = []
    
    if points and len(points) >= 2:
        pts = sorted(points, key=lambda p: p['x'])
        n = len(pts) - 1
        h = (pts[-1]['x'] - pts[0]['x']) / n
        integral_aprox = 0.0
        
        for i in range(n):
            dx = pts[i+1]['x'] - pts[i]['x']
            area_i = dx * (pts[i]['y'] + pts[i+1]['y']) / 2.0
            integral_aprox += area_i
            areas.append(float(area_i))
            
        return {
            "method": "Regla de los Trapecios (Datos Tabulados)",
            "integral_approx": float(integral_aprox),
            "n_intervals": n,
            "step_h": float(h),
            "details": {"areas_trapecios": areas},
            "exact_value": None,
            "relative_error": None,
            "message": f"Integral calculada con {n} trapecios usando puntos discretos."
        }
        
    elif function_str and a_in is not None and b_in is not None:
        f, sympy_f = compile_function_1d(function_str)
        a = float(a_in)
        b = float(b_in)
        n = int(n_in) if n_in and n_in > 0 else 10
        h = (b - a) / n
        
        integral_aprox = 0.0
        for i in range(n):
            x_act = a + i * h
            x_sig = x_act + h
            area_i = h * (float(f(x_act)) + float(f(x_sig))) / 2.0
            integral_aprox += area_i
            areas.append(float(area_i))
            
        exact_val = compute_exact_integral_if_possible(sympy_f, a, b)
        rel_error = None
        if exact_val is not None and abs(exact_val) > 1e-15:
            rel_error = abs((exact_val - integral_aprox) / exact_val) * 100.0

        return {
            "method": "Regla de los Trapecios Compuesta",
            "integral_approx": float(integral_aprox),
            "n_intervals": n,
            "step_h": float(h),
            "details": {"areas_trapecios": areas},
            "exact_value": float(exact_val) if exact_val is not None else None,
            "relative_error": float(rel_error) if rel_error is not None else None,
            "message": f"Integral calculada con {n} trapecios."
        }
    else:
        raise ValueError("Debe proporcionar una función continua con límites (a, b) o una tabla de puntos (x, y).")

def simpson_13_integration(
    function_str: Optional[str] = None,
    a_in: Optional[float] = None,
    b_in: Optional[float] = None,
    n_in: Optional[int] = 10,
    points: Optional[List[Dict[str, float]]] = None
) -> Dict[str, Any]:
    """
    Método de integración por Simpson 1/3 compuesto.
    n debe ser par.
    """
    if points and len(points) >= 3:
        pts = sorted(points, key=lambda p: p['x'])
        n = len(pts) - 1
        if n % 2 != 0:
            raise ValueError(f"Para Simpson 1/3 el número de subintervalos debe ser PAR. Se recibieron {n} subintervalos ({len(pts)} puntos).")
        
        h = (pts[-1]['x'] - pts[0]['x']) / n
        suma_impares = sum(pts[i]['y'] for i in range(1, n, 2))
        suma_pares = sum(pts[i]['y'] for i in range(2, n, 2))
        integral_aprox = (h / 3.0) * (pts[0]['y'] + 4.0 * suma_impares + 2.0 * suma_pares + pts[-1]['y'])
        
        return {
            "method": "Simpson 1/3 Compuesto (Datos Tabulados)",
            "integral_approx": float(integral_aprox),
            "n_intervals": n,
            "step_h": float(h),
            "details": {
                "suma_impares": float(suma_impares),
                "suma_pares": float(suma_pares)
            },
            "exact_value": None,
            "relative_error": None,
            "message": f"Integral aproximada mediante Simpson 1/3 con n={n}."
        }
    elif function_str and a_in is not None and b_in is not None:
        f, sympy_f = compile_function_1d(function_str)
        a = float(a_in)
        b = float(b_in)
        n = int(n_in) if n_in and n_in > 0 else 10
        
        # Validar n par (según PROYECTO_METODOS.ipynb si n % 2 != 0: n += 1)
        if n % 2 != 0:
            n += 1
            
        h = (b - a) / n
        suma_impares = 0.0
        suma_pares = 0.0
        
        for i in range(1, n):
            x_i = a + i * h
            if i % 2 == 1:
                suma_impares += float(f(x_i))
            else:
                suma_pares += float(f(x_i))
                
        integral_aprox = (h / 3.0) * (float(f(a)) + 4.0 * suma_impares + 2.0 * suma_pares + float(f(b)))
        
        exact_val = compute_exact_integral_if_possible(sympy_f, a, b)
        rel_error = None
        if exact_val is not None and abs(exact_val) > 1e-15:
            rel_error = abs((exact_val - integral_aprox) / exact_val) * 100.0

        return {
            "method": "Simpson 1/3 Compuesto",
            "integral_approx": float(integral_aprox),
            "n_intervals": n,
            "step_h": float(h),
            "details": {
                "suma_impares": float(suma_impares),
                "suma_pares": float(suma_pares)
            },
            "exact_value": float(exact_val) if exact_val is not None else None,
            "relative_error": float(rel_error) if rel_error is not None else None,
            "message": f"Integral calculada por Simpson 1/3 con {n} subintervalos."
        }
    else:
        raise ValueError("Debe proporcionar una función continua con límites (a, b) o una tabla de puntos (x, y).")

def simpson_38_integration(
    function_str: Optional[str] = None,
    a_in: Optional[float] = None,
    b_in: Optional[float] = None,
    n_in: Optional[int] = 9,
    points: Optional[List[Dict[str, float]]] = None
) -> Dict[str, Any]:
    """
    Método de integración por Simpson 3/8 compuesto.
    n debe ser múltiplo de 3.
    """
    if points and len(points) >= 4:
        pts = sorted(points, key=lambda p: p['x'])
        n = len(pts) - 1
        if n % 3 != 0:
            raise ValueError(f"Para Simpson 3/8 el número de subintervalos debe ser MÚLTIPLO DE 3. Se recibieron {n} subintervalos.")
            
        h = (pts[-1]['x'] - pts[0]['x']) / n
        suma = pts[0]['y'] + pts[-1]['y']
        
        for i in range(1, n):
            if i % 3 == 0:
                suma += 2.0 * pts[i]['y']
            else:
                suma += 3.0 * pts[i]['y']
                
        integral_aprox = (3.0 * h / 8.0) * suma
        
        return {
            "method": "Simpson 3/8 Compuesto (Datos Tabulados)",
            "integral_approx": float(integral_aprox),
            "n_intervals": n,
            "step_h": float(h),
            "details": {"suma_ponderada": float(suma)},
            "exact_value": None,
            "relative_error": None,
            "message": f"Integral aproximada mediante Simpson 3/8 con n={n}."
        }
    elif function_str and a_in is not None and b_in is not None:
        f, sympy_f = compile_function_1d(function_str)
        a = float(a_in)
        b = float(b_in)
        n = int(n_in) if n_in and n_in > 0 else 9
        
        # Ajuste a múltiplo de 3 si no lo es (según PROYECTO_METODOS.ipynb)
        if n % 3 != 0:
            n = n + (3 - (n % 3))
            
        h = (b - a) / n
        suma = float(f(a)) + float(f(b))
        
        for i in range(1, n):
            x_i = a + i * h
            if i % 3 == 0:
                suma += 2.0 * float(f(x_i))
            else:
                suma += 3.0 * float(f(x_i))
                
        integral_aprox = (3.0 * h / 8.0) * suma
        
        exact_val = compute_exact_integral_if_possible(sympy_f, a, b)
        rel_error = None
        if exact_val is not None and abs(exact_val) > 1e-15:
            rel_error = abs((exact_val - integral_aprox) / exact_val) * 100.0

        return {
            "method": "Simpson 3/8 Compuesto",
            "integral_approx": float(integral_aprox),
            "n_intervals": n,
            "step_h": float(h),
            "details": {"suma_ponderada": float(suma)},
            "exact_value": float(exact_val) if exact_val is not None else None,
            "relative_error": float(rel_error) if rel_error is not None else None,
            "message": f"Integral calculada por Simpson 3/8 con {n} subintervalos."
        }
    else:
        raise ValueError("Debe proporcionar una función continua con límites (a, b) o una tabla de puntos (x, y).")
