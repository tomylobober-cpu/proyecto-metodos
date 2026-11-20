import numpy as np
from typing import List, Dict, Any
from app.services.evaluator import compile_function_1d, compile_function_2d

def golden_section_univariate(
    function_str: str,
    x0_in: float,
    x3_in: float,
    decimals: int = 5,
    max_iter: int = 100,
    goal: str = "max"
) -> Dict[str, Any]:
    f, _ = compile_function_1d(function_str)
    
    x0 = float(x0_in)
    x3 = float(x3_in)
    
    R = ((5.0**0.5) - 1.0) / 2.0
    d = (x3 - x0) * R
    x1 = x3 - d
    x2 = x0 + d
    
    error_deseado = 0.5 * (10.0 ** (-decimals))
    opt_ant = 0.0
    opt_act = float(x1)
    
    # Error relativo inicial como en el cuaderno:
    error = abs((opt_act - opt_ant) / opt_act) if abs(opt_act) > 1e-15 else 1.0
    i = 0
    history = []
    
    # Determinar condición de comparación según objetivo (maximizar o minimizar)
    is_max = (goal.lower() == "max")

    while error > error_deseado and i < max_iter:
        i += 1
        opt_ant = opt_act
        
        f1 = float(f(x1))
        f2 = float(f(x2))
        
        # Maximizar: si f(x1) > f(x2) descartamos la derecha
        # Minimizar: si f(x1) < f(x2) descartamos la derecha
        condition = (f1 > f2) if is_max else (f1 < f2)
        
        if condition:
            x3 = x2
            x2 = x1
            d = (x3 - x0) * R
            x1 = x3 - d
            opt_act = float(f(x1))
            best_x = x1
        else:
            x0 = x1
            x1 = x2
            d = (x3 - x0) * R
            x2 = x0 + d
            opt_act = float(f(x2))
            best_x = x2
            
        error = abs((opt_act - opt_ant) / opt_act) if abs(opt_act) > 1e-15 else abs(opt_act - opt_ant)
        
        history.append({
            "iteration": i,
            "x0": float(x0),
            "x1": float(x1),
            "x2": float(x2),
            "x3": float(x3),
            "f_x1": float(f1),
            "f_x2": float(f2),
            "opt_ant": float(opt_ant),
            "opt_act": float(opt_act),
            "error": float(error)
        })

    return {
        "method": f"Sección Dorada Univariada ({'Maximización' if is_max else 'Minimización'})",
        "optimal_x": float(best_x),
        "optimal_value": float(opt_act),
        "iterations": i,
        "history": history,
        "message": f"Óptimo encontrado en {i} iteraciones."
    }

def golden_section_multivariate(
    function_str: str = "(x-3)**2 + (y-5)**2 + 10",
    x_range: List[float] = [0.0, 6.0],
    y_range: List[float] = [0.0, 10.0],
    x_init: float = 0.0,
    y_init: float = 0.0,
    decimals: int = 5,
    max_cycles: int = 50,
    goal: str = "min"
) -> Dict[str, Any]:
    """
    Método de Sección Dorada Multivariada (optimización alternada por coordenadas 2D)
    siguiendo la lógica de SDM.ipynb.
    """
    if not function_str or not function_str.strip():
        function_str = "(x-3)**2 + (y-5)**2 + 10"

    f, _ = compile_function_2d(function_str)
    
    R = ((5.0**0.5) - 1.0) / 2.0
    error_deseado = 0.5 * (10.0 ** (-decimals))
    
    x_opt = float(x_init)
    y_opt = float(y_init)
    
    error_multivariado = 1.0
    ciclos = 0
    history = []
    
    is_min = (goal.lower() == "min")

    while error_multivariado > error_deseado and ciclos < max_cycles:
        ciclos += 1
        x_ciclo_ant = x_opt
        y_ciclo_ant = y_opt
        
        # --- BUCLE 1: PROBLEMA UNIVARIADO X (manteniendo y_opt constante) ---
        x0, x3 = float(x_range[0]), float(x_range[1])
        d = (x3 - x0) * R
        x1 = x3 - d
        x2 = x0 + d
        
        error_x = 1.0
        iters_x = 0
        while error_x > error_deseado and iters_x < 100:
            iters_x += 1
            x_opt_ant = x_opt
            
            f1 = float(f(x1, y_opt))
            f2 = float(f(x2, y_opt))
            
            # En SDM.ipynb: if t(x1, y_opt) < t(x2, y_opt) para MINIMIZAR
            cond = (f1 < f2) if is_min else (f1 > f2)
            if cond:
                x3 = x2
                x2 = x1
                d = (x3 - x0) * R
                x1 = x3 - d
                x_opt = x1
            else:
                x0 = x1
                x1 = x2
                d = (x3 - x0) * R
                x2 = x0 + d
                x_opt = x2
                
            error_x = abs((x_opt - x_opt_ant) / x_opt) if abs(x_opt) > 1e-15 else abs(x_opt - x_opt_ant)

        # --- BUCLE 2: PROBLEMA UNIVARIADO Y (manteniendo nuevo x_opt constante) ---
        y0, y3 = float(y_range[0]), float(y_range[1])
        d = (y3 - y0) * R
        y1 = y3 - d
        y2 = y0 + d
        
        error_y = 1.0
        iters_y = 0
        while error_y > error_deseado and iters_y < 100:
            iters_y += 1
            y_opt_ant = y_opt
            
            f1 = float(f(x_opt, y1))
            f2 = float(f(x_opt, y2))
            
            # En SDM.ipynb: if t(x_opt, y1) < t(x_opt, y2) para MINIMIZAR
            cond = (f1 < f2) if is_min else (f1 > f2)
            if cond:
                y3 = y2
                y2 = y1
                d = (y3 - y0) * R
                y1 = y3 - d
                y_opt = y1
            else:
                y0 = y1
                y1 = y2
                d = (y3 - y0) * R
                y2 = y0 + d
                y_opt = y2
                
            error_y = abs((y_opt - y_opt_ant) / y_opt) if abs(y_opt) > 1e-15 else abs(y_opt - y_opt_ant)

        # --- CÁLCULO DEL ERROR MULTIVARIADO ---
        err_multi_x = abs((x_opt - x_ciclo_ant) / x_opt) if abs(x_opt) > 1e-15 else abs(x_opt - x_ciclo_ant)
        err_multi_y = abs((y_opt - y_ciclo_ant) / y_opt) if abs(y_opt) > 1e-15 else abs(y_opt - y_ciclo_ant)
        error_multivariado = max(err_multi_x, err_multi_y)
        
        val_opt = float(f(x_opt, y_opt))
        history.append({
            "cycle": ciclos,
            "x_opt": float(x_opt),
            "y_opt": float(y_opt),
            "f_xy": float(val_opt),
            "z_opt": float(val_opt),
            "err_x": float(err_multi_x),
            "err_y": float(err_multi_y),
            "error_multivariado": float(error_multivariado),
            "iters_x": iters_x,
            "iters_y": iters_y
        })

    return {
        "method": f"Sección Dorada Multivariada ({'Minimización' if is_min else 'Maximización'})",
        "optimal_x": float(x_opt),
        "optimal_y": float(y_opt),
        "optimal_value": float(f(x_opt, y_opt)),
        "cycles": ciclos,
        "history": history,
        "message": f"Óptimo final -> x: {x_opt:.6f}, y: {y_opt:.6f}, z: {float(f(x_opt, y_opt)):.6f} (Convergencia en {ciclos} ciclos)"
    }
