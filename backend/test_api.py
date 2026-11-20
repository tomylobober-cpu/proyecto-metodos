import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("Iniciando pruebas de los endpoints de Métodos Numéricos...\n")

    # 1. Bisección
    res = client.post("/raices/biseccion", json={
        "function": "x - cos(x)",
        "a": -4.0,
        "b": 3.0,
        "tol": 0.5e-5
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Bisección] Raíz:", round(data["root"], 6), f"(Iteraciones: {data['iterations']})")

    # 2. Falsa Posición
    res = client.post("/raices/falsa-posicion", json={
        "function": "x - cos(x)",
        "a": -4.0,
        "b": 3.0,
        "tol": 0.5e-5
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Falsa Posición] Raíz:", round(data["root"], 6), f"(Iteraciones: {data['iterations']})")

    # 3. Newton Raphson
    res = client.post("/raices/newton-raphson", json={
        "function": "x - cos(x)",
        "derivative": "1 + sin(x)",
        "x0": 3.0,
        "tol": 0.5e-5
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Newton-Raphson] Raíz:", round(data["root"], 6), f"(Iteraciones: {data['iterations']})")

    # 4. Secante
    res = client.post("/raices/secante", json={
        "function": "x - cos(x)",
        "x_actual": 3.0,
        "x_anterior": 3.5,
        "tol": 0.5e-5
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Secante] Raíz:", round(data["root"], 6), f"(Iteraciones: {data['iterations']})")

    # 5. Sección Dorada Univariada
    res = client.post("/optimizacion/seccion-dorada-univariada", json={
        "function": "2*sin(x) - (x**2)/10",
        "x0": 0.0,
        "x3": 4.0,
        "decimals": 5,
        "goal": "max"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Sección Dorada Univariada] Óptimo x:", round(data["optimal_x"], 5), "f(x):", round(data["optimal_value"], 5))

    # 6. Sección Dorada Multivariada (SDM.ipynb)
    res = client.post("/optimizacion/seccion-dorada-multivariada", json={
        "function": "(x-3)**2 + (y-5)**2 + 10",
        "x_range": [0.0, 6.0],
        "y_range": [0.0, 10.0],
        "x_init": 0.0,
        "y_init": 0.0,
        "decimals": 5,
        "goal": "min"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Sección Dorada Multivariada] (x, y):", (round(data["optimal_x"], 4), round(data["optimal_y"], 4)), "f(x,y):", round(data["optimal_value"], 4), f"(Ciclos: {data['cycles']})")

    # 7. Integración Trapecios
    res = client.post("/integracion/trapecio", json={
        "function": "x - cos(x)",
        "a": 0.0,
        "b": 3.0,
        "n": 10
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Trapecio] Integral:", round(data["integral_approx"], 6), "Error %:", round(data["relative_error"], 4) if data["relative_error"] else "N/A")

    # 8. Integración Simpson 1/3
    res = client.post("/integracion/simpson-13", json={
        "function": "x - cos(x)",
        "a": 0.0,
        "b": 3.0,
        "n": 10
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Simpson 1/3] Integral:", round(data["integral_approx"], 6), "Error %:", round(data["relative_error"], 4) if data["relative_error"] else "N/A")

    # 9. Integración Simpson 3/8
    res = client.post("/integracion/simpson-38", json={
        "function": "x - cos(x)",
        "a": 0.0,
        "b": 3.0,
        "n": 9
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Simpson 3/8] Integral:", round(data["integral_approx"], 6), "Error %:", round(data["relative_error"], 4) if data["relative_error"] else "N/A")

    # 10. Interpolación Directa
    res = client.post("/interpolacion/directa", json={
        "points": [{"x": 3.0, "y": 4.0}, {"x": 4.0, "y": 5.0}, {"x": 5.0, "y": 3.0}],
        "eval_x": 4.5
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Interpolación Directa] Polinomio:", data["polynomial_str"], "P(4.5):", data["evaluated_y"])

    # 11. Regresión por Mínimos Cuadrados
    res = client.post("/interpolacion/regresion-minimos-cuadrados", json={
        "points": [
            {"x": 1, "y": 0.5}, {"x": 2, "y": 2.5}, {"x": 3, "y": 2.0},
            {"x": 4, "y": 4.0}, {"x": 5, "y": 3.5}, {"x": 6, "y": 6.0}, {"x": 7, "y": 5.5}
        ],
        "degree": 1,
        "eval_x": 8.0
    })
    assert res.status_code == 200, res.text
    data = res.json()
    print("✅ [Regresión Mínimos Cuadrados] Recta:", data["equation_str"], "R²:", round(data["r2_score"], 4))

    print("\n🎉 ¡TODOS LOS ENDPOINTS FUNCIONAN Y PASARON LAS PRUEBAS EXITOSAMENTE!")

if __name__ == "__main__":
    test_endpoints()
