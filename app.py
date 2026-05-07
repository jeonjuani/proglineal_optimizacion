from flask import Flask, render_template, request, jsonify
from simplex_solver import SimplexSolver
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
            
        # Resolver
        solver = SimplexSolver(c, A, b, optimization_type=obj_type)
        solver.solve()
        results = solver.get_results()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
