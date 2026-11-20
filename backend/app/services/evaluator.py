import re
import numpy as np
import sympy as sp

# Diccionario seguro para lambdify
SAFE_MODULES = [
    'numpy',
    {
        'sin': np.sin,
        'cos': np.cos,
        'tan': np.tan,
        'exp': np.exp,
        'log': np.log,
        'sqrt': np.sqrt,
        'pi': np.pi,
        'e': np.e,
        'asin': np.arcsin,
        'acos': np.arccos,
        'atan': np.arctan,
        'sinh': np.sinh,
        'cosh': np.cosh,
        'tanh': np.tanh
    }
]

def preprocess_expression(expr_str: str) -> str:
    """
    Convierte expresiones comunes de usuario a formato válido de Sympy/Python.
    Ej: ^ -> **, 2x -> 2*x, ln -> log, cos(x) -> cos(x)
    """
    s = expr_str.strip()
    s = s.replace('^', '**')
    # Reemplazar ln( con log(
    s = re.sub(r'\bln\(', 'log(', s)
    # Soporte para multiplicación implícita (ej. 2x -> 2*x, 3(x) -> 3*(x))
    s = re.sub(r'(\d)([a-zA-Z\(])', r'\1*\2', s)
    s = re.sub(r'(\))([a-zA-Z\d\(])', r'\1*\2', s)
    return s

def compile_function_1d(expr_str: str, var_name: str = 'x'):
    """
    Retorna una función callable f(x) y la expresión Sympy.
    """
    cleaned = preprocess_expression(expr_str)
    x = sp.Symbol(var_name)
    try:
        sympy_expr = sp.sympify(cleaned)
    except Exception as e:
        raise ValueError(f"Expresión matemática inválida '{expr_str}': {str(e)}")
    
    func = sp.lambdify(x, sympy_expr, modules=SAFE_MODULES)
    return func, sympy_expr

def compile_function_2d(expr_str: str, var1: str = 'x', var2: str = 'y'):
    """
    Retorna una función callable f(x, y) y la expresión Sympy.
    """
    cleaned = preprocess_expression(expr_str)
    x = sp.Symbol(var1)
    y = sp.Symbol(var2)
    try:
        sympy_expr = sp.sympify(cleaned)
    except Exception as e:
        raise ValueError(f"Expresión matemática inválida '{expr_str}': {str(e)}")
    
    func = sp.lambdify((x, y), sympy_expr, modules=SAFE_MODULES)
    return func, sympy_expr
