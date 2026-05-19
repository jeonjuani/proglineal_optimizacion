import numpy as np

class SimplexSolver:
    def __init__(self, c, A, b, optimization_type='max'):
        """
        c: coeficientes de la función objetivo (lista o array)
        A: matriz de coeficientes de las restricciones (lista de listas o array)
        b: términos independientes de las restricciones (lista o array)
        optimization_type: 'max' o 'min'
        """
        self.original_c = np.array(c, dtype=float)
        self.c = np.array(c, dtype=float)
        self.A = np.array(A, dtype=float)
        self.b = np.array(b, dtype=float)
        self.opt_type = optimization_type

        if self.opt_type == 'min':
            self.c = -self.c

        self.m, self.n = self.A.shape
        self.tableau = None
        self.status = "In progress"
        self.solution = None
        self.optimal_value = None

        # Para la visualización UI
        self.steps = []
        self.graphic_data = None
        # Nombres de variables: x1, x2... s1, s2...
        self.var_names = [f"x{i+1}" for i in range(self.n)] + [f"s{i+1}" for i in range(self.m)]
        # La base inicial contiene las variables de holgura (índices de n a n+m-1)
        self.basis = list(range(self.n, self.n + self.m))

    def build_tableau(self):
        identity = np.eye(self.m)
        top = np.hstack([self.A, identity, self.b.reshape(-1, 1)])

        bottom = np.zeros(self.n + self.m + 1)
        bottom[:self.n] = -self.c

        self.tableau = np.vstack([top, bottom])

    def record_step(self, iteration, note, entering_idx=None, leaving_idx=None,
                    pivot_row=None, pivot_col=None, ratios=None, pivot_element=None):
        """Guarda el estado actual del tableau con toda la información para la UI"""
        rows = []
        for i in range(self.m):
            ratio_val = None
            if ratios is not None and i < len(ratios):
                ratio_val = None if ratios[i] == np.inf else round(float(ratios[i]), 6)
            rows.append({
                "basis": self.var_names[self.basis[i]],
                "values": [round(v, 6) for v in self.tableau[i, :].tolist()],
                "is_pivot_row": (i == pivot_row) if pivot_row is not None else False,
                "ratio": ratio_val
            })

        z_row = {"values": [round(v, 6) for v in self.tableau[-1, :].tolist()]}
        current_z = round(float(self.tableau[-1, -1]), 6)

        self.steps.append({
            "iteration": iteration,
            "note": note,
            "entering": self.var_names[entering_idx] if entering_idx is not None else None,
            "leaving": self.var_names[self.basis[leaving_idx]] if leaving_idx is not None else None,
            "col_headers": self.var_names + ["RHS"],
            "pivot_col": pivot_col,
            "pivot_row": pivot_row,
            "pivot_element": round(float(pivot_element), 6) if pivot_element is not None else None,
            "current_z": current_z,
            "rows": rows,
            "z_row": z_row
        })

    def pivot(self, row, col):
        """Realiza la operación de pivoteo en (row, col)"""
        # Normalizar fila pivote
        self.tableau[row] = self.tableau[row] / self.tableau[row, col]
        # Eliminar en otras filas (incluyendo la fila Z)
        for i in range(self.tableau.shape[0]):
            if i != row:
                factor = self.tableau[i, col]
                self.tableau[i] -= factor * self.tableau[row]

    def extract_solution(self):
        """Extrae la solución óptima del tableau final"""
        sol = np.zeros(self.n)
        for j in range(self.n):
            col = self.tableau[:-1, j]
            if np.count_nonzero(np.abs(col - 1) < 1e-10) == 1 and np.count_nonzero(np.abs(col) > 1e-10) == 1:
                row_idx = np.where(np.abs(col - 1) < 1e-10)[0][0]
                sol[j] = self.tableau[row_idx, -1]

        self.solution = sol
        self.optimal_value = self.tableau[-1, -1]
        if self.opt_type == 'min':
            self.optimal_value = -self.optimal_value

    def solve(self):
        self.build_tableau()
        iteration = 0

        # Registrar el tableau inicial (iteración 0)
        self.record_step(
            iteration=iteration,
            note="Tableau inicial. Variables de holgura en la base.",
        )

        while True:
            iteration += 1
            last_row = self.tableau[-1, :-1]

            # Condición de parada: todos los coeficientes en la fila Z son >= 0
            if np.all(last_row >= -1e-10):
                self.status = "Optimal"
                self.extract_solution()
                self.record_step(
                    iteration=iteration,
                    note="✅ Solución óptima alcanzada. Todos los coeficientes de la fila Z son ≥ 0."
                )
                break

            # Seleccionar columna pivote (coeficiente más negativo en la fila Z)
            pivot_col = int(np.argmin(last_row))
            entering_var = self.var_names[pivot_col]

            # Calcular ratios para seleccionar fila pivote
            ratios = []
            for i in range(self.m):
                val = self.tableau[i, pivot_col]
                if val > 1e-10:
                    ratios.append(self.tableau[i, -1] / val)
                else:
                    ratios.append(np.inf)

            # Problema no acotado
            if np.all(np.array(ratios) == np.inf):
                self.status = "Unbounded"
                self.record_step(
                    iteration=iteration,
                    note="⚠️ El problema no tiene solución acotada (unbounded).",
                    entering_idx=pivot_col,
                    pivot_col=pivot_col
                )
                return self.get_results()

            pivot_row = int(np.argmin(ratios))
            leaving_var = self.var_names[self.basis[pivot_row]]

            # Registrar el estado ANTES del pivoteo (mostrando qué va a ocurrir)
            pivot_element = float(self.tableau[pivot_row, pivot_col])
            self.record_step(
                iteration=iteration,
                note=f"Entra: {entering_var} | Sale: {leaving_var} | Elemento pivote = {round(pivot_element, 4)}",
                entering_idx=pivot_col,
                leaving_idx=pivot_row,
                pivot_row=pivot_row,
                pivot_col=pivot_col,
                ratios=ratios,
                pivot_element=pivot_element
            )

            # Actualizar la base
            self.basis[pivot_row] = pivot_col

            # Realizar pivoteo
            self.pivot(pivot_row, pivot_col)

        return self.get_results()

    def _constraint_label(self, i):
        """Genera etiqueta legible de la restricción i"""
        terms = []
        for j in range(self.n):
            a = self.A[i, j]
            if abs(a) > 1e-10:
                coef = int(a) if a == int(a) else round(float(a), 4)
                terms.append(f"{coef}x{j+1}")
        rhs = self.b[i]
        rhs_str = int(rhs) if rhs == int(rhs) else round(float(rhs), 4)
        return " + ".join(terms) + f" ≤ {rhs_str}"

    def compute_graphic_data(self):
        """Calcula datos para el método gráfico (solo problemas de 2 variables)"""
        if self.n != 2:
            return None

        A, b_vec, c_orig = self.A, self.b, self.original_c

        constraints_data = [
            {"a": float(A[i,0]), "b": float(A[i,1]),
             "rhs": float(b_vec[i]), "label": self._constraint_label(i)}
            for i in range(self.m)
        ]

        # Todas las líneas frontera: restricciones + ejes (x1=0, x2=0)
        all_lines = [(float(A[i,0]), float(A[i,1]), float(b_vec[i])) for i in range(self.m)]
        all_lines += [(1.0, 0.0, 0.0), (0.0, 1.0, 0.0)]

        vertices = []
        for idx1 in range(len(all_lines)):
            for idx2 in range(idx1+1, len(all_lines)):
                a1, b1, c1 = all_lines[idx1]
                a2, b2, c2 = all_lines[idx2]
                det = a1*b2 - a2*b1
                if abs(det) < 1e-10:
                    continue
                x1 = (c1*b2 - c2*b1) / det
                x2 = (a1*c2 - a2*c1) / det
                if x1 < -1e-8 or x2 < -1e-8:
                    continue
                # Verificar todas las restricciones originales
                feasible = all(
                    A[k,0]*x1 + A[k,1]*x2 <= b_vec[k] + 1e-8
                    for k in range(self.m)
                )
                if feasible:
                    x1r, x2r = round(x1, 4), round(x2, 4)
                    if not any(abs(v[0]-x1r)<1e-4 and abs(v[1]-x2r)<1e-4 for v in vertices):
                        vertices.append([x1r, x2r])

        vertex_z = [round(float(c_orig[0]*v[0] + c_orig[1]*v[1]), 4) for v in vertices]

        # Eje máximo para la gráfica
        x_maxs = [b_vec[i]/A[i,0] for i in range(self.m) if A[i,0] > 1e-10]
        y_maxs = [b_vec[i]/A[i,1] for i in range(self.m) if A[i,1] > 1e-10]
        raw_max = max(x_maxs + y_maxs) if (x_maxs or y_maxs) else 20
        axis_max = float(raw_max * 1.25)

        return {
            "constraints": constraints_data,
            "vertices": vertices,
            "vertex_z": vertex_z,
            "optimal_point": [round(float(v), 4) for v in self.solution[:2]] if self.solution is not None else None,
            "obj_coefficients": [float(c_orig[0]), float(c_orig[1])],
            "opt_type": self.opt_type,
            "axis_max": axis_max
        }

    def get_results(self):
        """Devuelve el resultado completo, incluyendo los pasos del tableau"""
        graphic = self.compute_graphic_data() if self.n == 2 else None
        return {
            "status": self.status,
            "solution": [round(float(v), 6) for v in self.solution] if self.solution is not None else None,
            "optimal_value": round(float(self.optimal_value), 6) if self.optimal_value is not None else None,
            "variables": [f"x{i+1}" for i in range(self.n)],
            "steps": self.steps,
            "num_vars": self.n,
            "num_constraints": self.m,
            "graphic_data": graphic
        }


if __name__ == "__main__":
    # Prueba rápida
    # Max Z = 3x1 + 2x2
    # s.t.
    # 2x1 + x2 <= 18
    # 2x1 + 3x2 <= 42
    # 3x1 + x2 <= 24

    c = [3, 2]
    A = [[2, 1], [2, 3], [3, 1]]
    b = [18, 42, 24]

    solver = SimplexSolver(c, A, b)
    result = solver.solve()
    print("Status:", result["status"])
    print("Optimal Value:", result["optimal_value"])
    print("Solution:", result["solution"])
    print("Steps recorded:", len(result["steps"]))