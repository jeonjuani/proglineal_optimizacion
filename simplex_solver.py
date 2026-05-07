import numpy as np

class SimplexSolver:
    def __init__(self, c, A, b, optimization_type='max'):
        """
        c: coeficientes de la función objetivo (lista o array)
        A: matriz de coeficientes de las restricciones (lista de listas o array)
        b: términos independientes de las restricciones (lista o array)
        optimization_type: 'max' o 'min'
        """
        self.c = np.array(c, dtype=float)
        self.A = np.array(A, dtype=float)
        self.b = np.array(b, dtype=float)
        self.opt_type = optimization_type
        
        # Convertir a maximización si es minimización
        if self.opt_type == 'min':
            self.c = -self.c
            
        self.m, self.n = self.A.shape
        self.tableau = None
        self.status = "In progress"
        self.solution = None
        self.optimal_value = None

    def build_tableau(self):
        # Crear la tabla inicial con variables de holgura
        # [ A | I | b ]
        # [ -c | 0 | 0 ]
        
        identity = np.eye(self.m)
        top = np.hstack([self.A, identity, self.b.reshape(-1, 1)])
        
        bottom = np.zeros(self.n + self.m + 1)
        bottom[:self.n] = -self.c
        
        self.tableau = np.vstack([top, bottom])

    def solve(self):
        self.build_tableau()
        
        while True:
            # Seleccionar columna pivote (entrada más negativa en la última fila)
            last_row = self.tableau[-1, :-1]
            if np.all(last_row >= -1e-10):
                self.status = "Optimal"
                break
                
            pivot_col = np.argmin(last_row)
            
            # Seleccionar fila pivote (test del cociente mínimo)
            ratios = []
            for i in range(self.m):
                val = self.tableau[i, pivot_col]
                if val > 1e-10:
                    ratios.append(self.tableau[i, -1] / val)
                else:
                    ratios.append(np.inf)
            
            if np.all(np.array(ratios) == np.inf):
                self.status = "Unbounded"
                return None
                
            pivot_row = np.argmin(ratios)
            
            # Operación de pivoteo
            self.pivot(pivot_row, pivot_col)

        self.extract_solution()
        return self.solution

    def pivot(self, row, col):
        # Normalizar fila pivote
        self.tableau[row] /= self.tableau[row, col]
        
        # Eliminar en otras filas
        for i in range(self.tableau.shape[0]):
            if i != row:
                factor = self.tableau[i, col]
                self.tableau[i] -= factor * self.tableau[row]

    def extract_solution(self):
        sol = np.zeros(self.n)
        for j in range(self.n):
            col = self.tableau[:-1, j]
            if np.count_nonzero(col == 1) == 1 and np.count_nonzero(col) == 1:
                row_idx = np.where(col == 1)[0][0]
                sol[j] = self.tableau[row_idx, -1]
        
        self.solution = sol
        self.optimal_value = self.tableau[-1, -1]
        if self.opt_type == 'min':
            self.optimal_value = -self.optimal_value

    def get_results(self):
        return {
            "status": self.status,
            "solution": self.solution.tolist() if self.solution is not None else None,
            "optimal_value": float(self.optimal_value) if self.optimal_value is not None else None,
            "variables": [f"x{i+1}" for i in range(self.n)]
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
    solver.solve()
    print(solver.get_results())
