import numpy as np
import sympy as sp
from typing import List, Dict, Any, Tuple
from app.services.evaluator import compile_function_1d

def bisection_method(function_str: str, a_in: float, b_in: float, tol: float = 0.5e-5, max_iter: int = 100) -> Dict[str, Any]:
    f, _ = compile_function_1d(function_str)
    a = float(a_in)
    b = float(b_in)
    
    f_a = float(f(a))
    f_b = float(f(b))
    
    if f_a * f_b > 0:
        raise ValueError(f"No hay cambio de signo en el intervalo [{a}, {b}]. f(a)={f_a:.6f}, f(b)={f_b:.6f}.")

    history = []
    values = []
    error = 1.0
    i = 0
    c = (a + b) / 2.0

    while error > tol and i < max_iter:
        c_ant = c
        c = (a + b) / 2.0
        values.append(float(c))
        
        # En la lógica original de integracion.py: error = abs((b-a)/b)
        # Para robustez evitamos división por cero usando |b| > 1e-15 o (|c - c_ant| / |c|)
        if abs(b) > 1e-15:
            error = abs((b - a) / b)
        else:
            error = abs(b - a)
            
        f_a_val = float(f(a))
        f_c_val = float(f(c))
        
        history.append({
            "iteration": i + 1,
            "a": float(a),
            "b": float(b),
            "c": float(c),
            "f_a": f_a_val,
            "f_b": float(f(b)),
            "f_c": f_c_val,
            "error": float(error)
        })

        if f_a_val * f_c_val < 0:
            b = c
        else:
            a = c
        i += 1

    return {
        "method": "Bisección",
        "root": float(c),
        "iterations": i,
        "values": values,
        "history": history,
        "message": f"Raíz encontrada con éxito en {i} iteraciones."
    }

def false_position_method(function_str: str, a_in: float, b_in: float, tol: float = 0.5e-5, max_iter: int = 100) -> Dict[str, Any]:
    f, _ = compile_function_1d(function_str)
    a = float(a_in)
    b = float(b_in)
    
    f_a = float(f(a))
    f_b = float(f(b))
    
    if f_a * f_b > 0:
        raise ValueError(f"No hay cambio de signo en el intervalo [{a}, {b}]. f(a)={f_a:.6f}, f(b)={f_b:.6f}.")

    history = []
    values = []
    error = 1.0
    i = 0
    c = b
    c_prev = None

    while error > tol and i < max_iter:
        f_a_val = float(f(a))
        f_b_val = float(f(b))
        
        denom = f_a_val - f_b_val
        if abs(denom) < 1e-15:
            break
            
        c = b - f_b_val * (a - b) / denom
        values.append(float(c))
        
        # En Falsa Posición, el error relativo se mide respecto a las aproximaciones sucesivas c
        if c_prev is not None and abs(c) > 1e-15:
            error = abs((c - c_prev) / c)
        elif abs(b) > 1e-15:
            error = abs((b - a) / b)
        else:
            error = abs(b - a)
            
        f_c_val = float(f(c))
        
        history.append({
            "iteration": i + 1,
            "a": float(a),
            "b": float(b),
            "c": float(c),
            "f_a": f_a_val,
            "f_b": f_b_val,
            "f_c": f_c_val,
            "error": float(error)
        })

        if abs(f_c_val) < 1e-12:
            i += 1
            break

        c_prev = c
        if f_a_val * f_c_val < 0:
            b = c
        else:
            a = c
        i += 1

    return {
        "method": "Falsa Posición",
        "root": float(c),
        "iterations": i,
        "values": values,
        "history": history,
        "message": f"Raíz encontrada con éxito en {i} iteraciones."
    }

def newton_raphson_method(function_str: str, x0_in: float, derivative_str: str = None, tol: float = 0.5e-5, max_iter: int = 100) -> Dict[str, Any]:
    f, sympy_f = compile_function_1d(function_str)
    
    if derivative_str and derivative_str.strip():
        f_prime, _ = compile_function_1d(derivative_str)
    else:
        # Derivada simbólica analítica automática con SymPy
        x_sym = sp.Symbol('x')
        sympy_df = sp.diff(sympy_f, x_sym)
        f_prime = sp.lambdify(x_sym, sympy_df, modules=['numpy', {'sin': np.sin, 'cos': np.cos, 'exp': np.exp, 'log': np.log}])

    x = float(x0_in)
    error = 1.0
    i = 0
    history = []
    values = []

    while error > tol and i < max_iter:
        fx = float(f(x))
        dfx = float(f_prime(x))
        
        if abs(dfx) < 1e-15:
            raise ZeroDivisionError(f"La derivada se anula o es casi cero en x={x:.6f} (f'(x) ≈ 0).")
            
        x_nuevo = x - fx / dfx
        
        if abs(x_nuevo) > 1e-15:
            error = abs((x_nuevo - x) / x_nuevo)
        else:
            error = abs(x_nuevo - x)
            
        history.append({
            "iteration": i + 1,
            "a": float(x),
            "b": None,
            "c": float(x_nuevo),
            "f_a": fx,
            "f_b": dfx, # Se almacena la derivada en f_b para referencia
            "f_c": float(f(x_nuevo)),
            "error": float(error)
        })
        
        x = x_nuevo
        i += 1
        values.append(float(x))

    return {
        "method": "Newton-Raphson",
        "root": float(x),
        "iterations": i,
        "values": values,
        "history": history,
        "message": f"Raíz encontrada con éxito en {i} iteraciones."
    }

def secant_method(function_str: str, x_actual_in: float, x_anterior_in: float, tol: float = 0.5e-5, max_iter: int = 100) -> Dict[str, Any]:
    f, _ = compile_function_1d(function_str)
    
    x_actual = float(x_actual_in)
    x_anterior = float(x_anterior_in)
    error = 1.0
    i = 0
    history = []
    values = []

    while error > tol and i < max_iter:
        f_act = float(f(x_actual))
        f_ant = float(f(x_anterior))
        
        denom = f_act - f_ant
        if abs(denom) < 1e-15:
            raise ZeroDivisionError(f"División por cero en el método de la secante: f(x_actual) - f(x_anterior) ≈ 0.")
            
        x_nuevo = x_actual - f_act * (x_actual - x_anterior) / denom
        
        if abs(x_nuevo) > 1e-15:
            error = abs((x_nuevo - x_actual) / x_nuevo)
        else:
            error = abs(x_nuevo - x_actual)
            
        history.append({
            "iteration": i + 1,
            "a": float(x_anterior),
            "b": float(x_actual),
            "c": float(x_nuevo),
            "f_a": f_ant,
            "f_b": f_act,
            "f_c": float(f(x_nuevo)),
            "error": float(error)
        })

        x_anterior = x_actual
        x_actual = x_nuevo
        i += 1
        values.append(float(x_actual))

    return {
        "method": "Secante",
        "root": float(x_actual),
        "iterations": i,
        "values": values,
        "history": history,
        "message": f"Raíz encontrada con éxito en {i} iteraciones."
    }
