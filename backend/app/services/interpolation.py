import numpy as np
from typing import List, Dict, Any, Optional

def direct_interpolation(points: List[Dict[str, float]], eval_x: Optional[float] = None) -> Dict[str, Any]:
    """
    Interpolación directa de polinomios usando sistema de Vandermonde:
    P(x) = a_0*x^n + a_1*x^(n-1) + ... + a_n
    Exactamente como en PROYECTO_METODOS.ipynb:
    fila.append(x[i]**( (m-1) - j ))
    """
    if len(points) < 2:
        raise ValueError("Se requieren al menos 2 puntos para interpolación.")
        
    x_vals = [float(p['x']) for p in points]
    y_vals = [float(p['y']) for p in points]
    m = len(x_vals)
    degree = m - 1
    
    # Validar que los valores de x sean distintos
    if len(set(x_vals)) != len(x_vals):
        raise ValueError("Todos los valores de x deben ser distintos para interpolación polinomial.")
        
    # Construir matriz A según celda 2 de PROYECTO_METODOS.ipynb
    A = []
    for i in range(m):
        fila = []
        for j in range(m):
            fila.append(x_vals[i] ** (degree - j))
        A.append(fila)
        
    try:
        coef = np.linalg.solve(A, y_vals)
    except np.linalg.LinAlgError:
        raise ValueError("El sistema de ecuaciones para la interpolación directa es singular.")
        
    coef_list = [float(c) for c in coef]
    
    # Construcción de string del polinomio: a_n x^n + ... + a_0
    poly_terms = []
    for idx, c in enumerate(coef_list):
        power = degree - idx
        sign = " + " if c >= 0 and idx > 0 else (" - " if c < 0 and idx > 0 else ("-" if c < 0 else ""))
        val_abs = abs(c)
        if power > 1:
            poly_terms.append(f"{sign}{val_abs:.4f}*x^{power}")
        elif power == 1:
            poly_terms.append(f"{sign}{val_abs:.4f}*x")
        else:
            poly_terms.append(f"{sign}{val_abs:.4f}")
    poly_str = "".join(poly_terms)
    
    # Generar curva interpolada densa para graficar (como en el notebook con linspace)
    min_x, max_x = min(x_vals), max(x_vals)
    margin = (max_x - min_x) * 0.1 if max_x != min_x else 1.0
    x_dense = np.linspace(min_x - margin, max_x + margin, 80)
    
    curve_points = []
    for x_s in x_dense:
        y_s = sum(coef_list[j] * (x_s ** (degree - j)) for j in range(m))
        curve_points.append({"x": float(x_s), "y": float(y_s)})
        
    # Evaluación en punto específico si se solicita
    eval_y = None
    if eval_x is not None:
        eval_y = float(sum(coef_list[j] * (float(eval_x) ** (degree - j)) for j in range(m)))

    return {
        "method": "Interpolación Polinomial Directa",
        "degree": degree,
        "coefficients": coef_list,
        "vandermonde_matrix": A,
        "polynomial_str": poly_str,
        "evaluated_x": float(eval_x) if eval_x is not None else None,
        "evaluated_y": eval_y,
        "curve_points": curve_points,
        "message": f"Polinomio de grado {degree} obtenido con {m} puntos."
    }

def least_squares_regression(points: List[Dict[str, float]], degree: int = 1, eval_x: Optional[float] = None) -> Dict[str, Any]:
    """
    Regresión por Mínimos Cuadrados para grado m (por defecto m=1 para regresión lineal,
    siguiendo las ecuaciones normales del notebook CELL 4 de PROYECTO_METODOS.ipynb y generalizado).
    """
    if len(points) <= degree:
        raise ValueError(f"Para regresión de grado {degree} se necesitan al menos {degree + 1} puntos.")
        
    x_vals = np.array([float(p['x']) for p in points])
    y_vals = np.array([float(p['y']) for p in points])
    n = len(x_vals)
    
    # Ecuaciones normales: A * coef = B
    # En PROYECTO_METODOS.ipynb para regresión lineal (grado 1):
    # A[i][j] = sum(x^(i+j)), B[i] = sum(x^i * y)
    A = []
    for i in range(degree, -1, -1):
        fila = []
        for j in range(degree, -1, -1):
            fila.append(float(np.sum(x_vals ** (i + j))))
        A.append(fila)
        
    B = []
    for i in range(degree, -1, -1):
        B.append(float(np.sum((x_vals ** i) * y_vals)))
        
    try:
        coef = np.linalg.solve(A, B)
    except np.linalg.LinAlgError:
        raise ValueError("La matriz de ecuaciones normales de mínimos cuadrados es singular.")
        
    coef_list = [float(c) for c in coef]
    
    # Coeficiente de determinación R^2
    y_pred_points = np.zeros(n)
    for idx, c in enumerate(coef_list):
        power = degree - idx
        y_pred_points += c * (x_vals ** power)
        
    ss_tot = np.sum((y_vals - np.mean(y_vals)) ** 2)
    ss_res = np.sum((y_vals - y_pred_points) ** 2)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 1e-15 else 1.0
    
    # Formatear ecuación
    eq_terms = []
    for idx, c in enumerate(coef_list):
        power = degree - idx
        sign = " + " if c >= 0 and idx > 0 else (" - " if c < 0 and idx > 0 else ("-" if c < 0 else ""))
        val_abs = abs(c)
        if power > 1:
            eq_terms.append(f"{sign}{val_abs:.4f}*x^{power}")
        elif power == 1:
            eq_terms.append(f"{sign}{val_abs:.4f}*x")
        else:
            eq_terms.append(f"{sign}{val_abs:.4f}")
    eq_str = "".join(eq_terms)
    
    # Puntos de la curva de ajuste
    min_x, max_x = np.min(x_vals), np.max(x_vals)
    margin = (max_x - min_x) * 0.1 if max_x != min_x else 1.0
    x_dense = np.linspace(min_x - margin, max_x + margin, 80)
    
    curve_points = []
    for x_s in x_dense:
        y_s = sum(coef_list[j] * (x_s ** (degree - j)) for j in range(degree + 1))
        curve_points.append({"x": float(x_s), "y": float(y_s)})
        
    eval_y = None
    if eval_x is not None:
        eval_y = float(sum(coef_list[j] * (float(eval_x) ** (degree - j)) for j in range(degree + 1)))

    return {
        "method": f"Regresión por Mínimos Cuadrados (Grado {degree})",
        "degree": degree,
        "coefficients": coef_list,
        "equation_str": eq_str,
        "r2_score": float(r2),
        "evaluated_x": float(eval_x) if eval_x is not None else None,
        "evaluated_y": eval_y,
        "curve_points": curve_points,
        "message": f"Modelo ajustado con R²={r2:.4f} sobre {n} puntos."
    }
