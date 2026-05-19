from flask import Flask, render_template, request, jsonify
from simplex_solver_incompleto import SimplexSolver
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    try:
        data = request.get_json()

        # Obtener datos del problema
        obj_type = data.get('optimization_type', 'max')
        c = data.get('objective_function', [])
        constraints = data.get('constraints', [])

        # Procesar restricciones
        A = []
        b = []
        for const in constraints:
            A.append(const['coefficients'])
            b.append(const['rhs'])

        # Validaciones básicas
        if not c or not A or not b:
            return jsonify({"error": "Datos incompletos"}), 400

        if len(A[0]) != len(c):
            return jsonify({"error": "El número de coeficientes en las restricciones no coincide con la función objetivo"}), 400

        # Verificar que b no tenga negativos (simplex estándar requiere b >= 0)
        for i, rhs in enumerate(b):
            if rhs < 0:
                return jsonify({"error": f"El término independiente de la restricción {i+1} debe ser ≥ 0"}), 400

        # Resolver con el solver que genera los pasos del tableau
        solver = SimplexSolver(c, A, b, optimization_type=obj_type)
        results = solver.solve()

        return jsonify(results)

    except ValueError as ve:
        return jsonify({"error": f"Error de valor: {str(ve)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
