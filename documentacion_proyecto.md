# Informe Técnico: Aplicativo Interactivo para la Resolución y Análisis de Programación Lineal (Simplex Optimizer Pro)

**Autores:** [Nombres de los integrantes del equipo]  
**Fecha:** Junio 2026  
**Curso:** Optimización / Programación Lineal  

---

## 1. Descripción del Programa y del Problema de Diseño

### 1.1. Contextualización del Problema
La programación lineal (PL) es un modelo matemático de optimización determinista utilizado para maximizar o minimizar una función objetivo lineal sujeta a un conjunto de restricciones lineales de igualdad o desigualdad. Su campo de aplicación es sumamente amplio en la ingeniería, economía, logística y gestión de operaciones, donde la asignación eficiente de recursos limitados (mano de obra, materias primas, tiempo de máquina, presupuesto) determina la viabilidad y competitividad de una organización.

El diseño del aplicativo **"Simplex Optimizer Pro"** surge bajo la necesidad de proveer una herramienta didáctica e interactiva de nivel profesional que no solo actúe como un motor de resolución ("caja negra"), sino que proporcione visibilidad completa de las operaciones subyacentes del algoritmo Simplex paso a paso, visualice geométricamente la región factible y las líneas de nivel (para problemas bidimensionales), y genere reportes post-óptimos de análisis de sensibilidad idénticos en estructura y rigurosidad a los producidos por herramientas comerciales como Microsoft Excel Solver.

### 1.2. Propósito y Alcance del Software
El programa ha sido diseñado como un aplicativo web interactivo y auto-contenido capaz de resolver cualquier problema de optimización lineal formulado en su forma básica (con restricciones en formato estándar preliminar $\le$ y variables no negativas). El aplicativo satisface los siguientes objetivos de diseño:
*   **Flexibilidad Dimensional:** Resolución de problemas con $n$ variables de decisión y $m$ restricciones.
*   **Visibilidad Didáctica (Tableros Paso a Paso):** Desglose iterativo mostrando la transición de cada Tableau Simplex, identificando explícitamente variables entrantes, salientes, elemento pivote, ratios de factibilidad y las ecuaciones Gauss-Jordan ejecutadas.
*   **Interactividad Gráfica (2 Variables):** Generación automática del método gráfico interactivo en formato Canvas, mostrando dinámicamente la construcción de restricciones, delimitación del polígono de la región factible y el desplazamiento de la función objetivo.
*   **Análisis de Sensibilidad de Grado Comercial:** Generación de tablas analíticas que calculan precios sombra, costos reducidos, rangos de variación permisibles (aumento/disminución) para coeficientes objetivos ($c_j$) y límites de recursos ($b_i$) garantizando estabilidad óptima y de factibilidad.

---

## 2. Tecnologías y Arquitectura del Sistema

La aplicación adopta una arquitectura cliente-servidor desacoplada, moderna y liviana, diseñada para ejecutarse localmente o en la nube sin dependencias complejas:
*   **Backend (Motor de Optimización):** Desarrollado en **Python 3**. Utiliza el micro-framework **Flask** para exponer servicios web de tipo API REST y la librería **NumPy** para operaciones de álgebra lineal computacional de alta precisión (pivoteo de matrices y resolución de sistemas lineales para análisis de sensibilidad).
*   **Frontend (Interfaz de Usuario):** Construido usando estándares web modernos. El diseño estilístico implementa **CSS3 nativo** bajo una estética visual *Glassmorphic* (gradientes fluidos, efectos de desenfoque de fondo y tipografía moderna *Outfit*). La lógica cliente en **JavaScript ES6** gestiona la entrada dinámica de datos, realiza peticiones asíncronas (fetch) y renderiza interactivamente los tableros Simplex.
*   **Módulo de Visualización Gráfica:** Utiliza la API de **Canvas HTML5** para el trazado de gráficos bidimensionales vectoriales, animando en tiempo real las restricciones del problema lineal.

---

## 3. Descripción Detallada de las Operaciones Matemáticas y Algorítmicas

El aplicativo realiza el procesamiento de un problema de programación lineal a través de cuatro etapas lógicas bien diferenciadas.

### 3.1. Estandarización: de la Forma Básica a la Forma Aumentada

El usuario ingresa el problema en su **forma básica**, definiendo la función objetivo y las restricciones, que ahora pueden ser de tipo $\le$, $\ge$, o $=$:

$$\text{Maximizar (o Minimizar) } Z = \sum_{j=1}^n c_j x_j$$
$$\text{Sujeto a restricciones del tipo: } \sum_{j=1}^n a_{ij} x_j \le b_i \quad \text{o} \quad \ge b_i \quad \text{o} \quad = b_i$$
$$x_j \ge 0, \quad \forall j=1,\dots,n$$

A partir de esa entrada, el programa construye automáticamente la **forma aumentada** del problema introduciendo variables auxiliares según el tipo de restricción:

1.  **Para restricciones $\le$**: Introduce una **variable de holgura** $s_i \ge 0$, convirtiendo la desigualdad en igualdad:
    $$\sum_{j=1}^n a_{ij} x_j + s_i = b_i$$
2.  **Para restricciones $\ge$**: Introduce una **variable de exceso** $e_i \ge 0$ (con coeficiente $-1$) y una **variable artificial** $a_i \ge 0$ (con coeficiente $+1$):
    $$\sum_{j=1}^n a_{ij} x_j - e_i + a_i = b_i$$
3.  **Para restricciones $=$**: Introduce únicamente una **variable artificial** $a_i \ge 0$:
    $$\sum_{j=1}^n a_{ij} x_j + a_i = b_i$$

Para manejar las variables artificiales, el motor matemático implementa el **Método de la Gran M (Big-M)**. Se asigna una penalización muy grande ($-M$ en maximización) a cada variable artificial en la función objetivo, forzando a que estas variables salgan de la base para alcanzar la optimalidad. Si al finalizar el algoritmo alguna variable artificial permanece en la base con un valor positivo, el aplicativo declara el problema como **infactible**.

Con la forma aumentada establecida, el programa organiza todos los coeficientes en el **Tableau Simplex inicial**. La base inicial estará conformada por las variables de holgura (para restricciones $\le$) y las variables artificiales (para restricciones $\ge$ y $=$):

| Base | $x_1 \dots x_n$ | $s_1 \dots s_k$ | $e_1 \dots e_p$ | $a_1 \dots a_q$ | RHS |
|:----:|:---------------:|:---------------:|:---------------:|:---------------:|:---:|
| $s/a$| $a_{i1} \dots a_{in}$ | $1 \dots 0$ | $0 \dots -1$ | $0 \dots 1$ | $b_i$ |
| $Z$  | $-c_1 \dots -c_n$ | $0 \dots 0$ | $0 \dots 0$ | $M \dots M$ | $0$ |

*(Previo a la primera iteración, la fila Z se ajusta mediante operaciones elementales para que los costos reducidos de las variables artificiales básicas sean cero).*

*Nota:* Si el tipo de optimización es **minimización** ($\text{Min } Z$), el motor la convierte a maximización multiplicando los coeficientes de la función objetivo por $-1$ (es decir, $\text{Max } Z' = -Z$), lo que equivale a trabajar con $c'_j = -c_j$. El valor óptimo reportado se devuelve al signo original al final.

### 3.2. Ciclo del Algoritmo Simplex Primal y Operaciones de Pivoteo
El motor matemático ejecuta recursivamente las iteraciones simplex aplicando los siguientes criterios algebraicos:

1.  **Evaluación de Optimalidad:** Se examinan los elementos de la última fila (fila de costos relativos $Z$). Si todos los coeficientes correspondientes a variables de decisión y holgura son no-negativos ($\ge 0$ para maximización con la convención de signos del Tableau), la solución actual es **óptima** y el ciclo termina.
2.  **Selección de la Variable Entrante (Criterio del Gradiente):** Se identifica la variable no básica con el coeficiente más negativo en la fila $Z$:
    $$\text{Columna Pivote } c = \arg\min_{j} \{ \bar{c}_j \mid \bar{c}_j < 0 \}$$
    Esta variable ingresa a la base ya que ofrece la mayor tasa de mejora unitaria en el valor de la función objetivo.
3.  **Selección de la Variable Saliente (Prueba del Cociente Mínimo):** Para garantizar que las variables básicas sigan siendo no-negativas (factibilidad de la solución), se evalúan los ratios de los términos del lado derecho (RHS) sobre los coeficientes estrictamente positivos de la columna pivote:
    $$\text{Ratios } \theta_i = \frac{\text{RHS}_i}{a_{ic}}, \quad \forall i \text{ tal que } a_{ic} > 0$$
    La fila pivote $r$ se elige como aquella con el menor ratio estrictamente positivo:
    $$\text{Fila Pivote } r = \arg\min_{i} \{ \theta_i \}$$
    La variable básica correspondiente a la fila $r$ sale de la base. Si todos los elementos en la columna pivote son menores o iguales a cero ($a_{ic} \le 0, \, \forall i$), los ratios son infinitos, lo que indica que la región factible es abierta en esa dirección y el problema es **no acotado (unbounded)**.
4.  **Operación de Pivoteo Gauss-Jordan:** El elemento de intersección $a_{rc}$ se define como el elemento pivote. Para introducir la nueva variable entrante en la base y eliminarla de las demás restricciones, se realizan operaciones elementales por fila:
    *   **Normalización de la fila pivote:** $R_r \leftarrow R_r \, / \, a_{rc}$
    *   **Eliminación en filas restantes ($i \neq r$):** $R_i \leftarrow R_i - a_{ic} R_r$
    *   **Eliminación en la fila Z:** $R_Z \leftarrow R_Z - \bar{c}_c R_r$
5.  **Actualización de la Base:** Se reemplaza el índice de la variable básica saliente por el de la entrante en la lista de base.

### 3.3. Algoritmo de Geometría y Método Gráfico
Cuando el problema contiene exactamente dos variables de decisión ($n=2$), el aplicativo activa el panel gráfico 2D. Las operaciones analíticas implementadas para dibujar la solución geométrica son:

1.  **Cálculo de Intersecciones Frontera:** Se calculan las coordenadas de intersección mutua de todas las líneas que delimitan el problema. Estas líneas incluyen:
    *   Las rectas frontera de las restricciones: $a_{i1} x_1 + a_{i2} x_2 = b_i$
    *   Los ejes coordenados de no negatividad: $x_1 = 0$ y $x_2 = 0$
    El sistema resuelve analíticamente los determinantes para cada par de rectas. Si las rectas no son paralelas, obtiene un punto potencial $(x_1, x_2)$.
2.  **Filtrado de Vértices Factibles:** Para cada punto de intersección calculado, el software verifica si satisface simultáneamente todas las restricciones originales del problema:
    $$a_{k1} x_1 + a_{k2} x_2 \le b_k + \epsilon, \quad \forall k=1,\dots,m$$
    $$x_1 \ge -\epsilon, \quad x_2 \ge -\epsilon$$
    donde $\epsilon = 10^{-8}$ es una tolerancia de precisión numérica. Los puntos válidos constituyen los vértices del polígono convexo de la región factible.
3.  **Ordenamiento y Trazado de la Región Factible:** Para pintar la región factible en el Canvas usando `ctx.fill()`, los vértices válidos deben ordenarse angularmente. El software calcula el centro geométrico (centroide) del conjunto de puntos y ordena los vértices según su ángulo polar respecto a este centroide ($\theta = \text{atan2}(y - y_c, x - x_c)$), delimitando el contorno del polígono.
4.  **Línea del Objetivo y Óptimo:** Se dibuja la recta de nivel correspondiente a la función objetivo que pasa por el punto óptimo hallado ($c_1 x_1 + c_2 x_2 = Z^*$).
5.  **Animación por Pasos:** La interfaz reproduce de manera secuencial el agregado de cada restricción, el sombreado de la región factible resultante, y finalmente el corrimiento del vector de ganancia y la línea de contorno de Z.

---

## 4. Algoritmos Computacionales del Análisis de Sensibilidad

El análisis de sensibilidad o post-óptimo evalúa cómo afectan las variaciones en los parámetros del problema (coeficientes de la función objetivo o disponibilidad de recursos en RHS) a la solución óptima obtenida, sin tener que volver a resolver el problema completo desde cero.

### 4.1. Precios Sombra (Shadow Prices) y Costos Reducidos (Reduced Costs)
*   **Precios Sombra:** Representan la tasa de cambio en el valor óptimo de Z por unidad de incremento en el lado derecho de la restricción $i$ ($b_i$). Matemáticamente, corresponden a los multiplicadores simplex asociados a la base óptima:
    $$y^* = c_B^T B^{-1}$$
    Donde $B^{-1}$ es la matriz inversa de la base óptima (que se encuentra directamente en las columnas del tableau final correspondientes a las variables de holgura iniciales) y $c_B$ es el vector de coeficientes objetivos de las variables básicas actuales.
*   **Costos Reducidos:** Representan la penalización en el valor de Z por cada unidad que se fuerce la entrada de una variable no básica $x_j$. Coinciden con los coeficientes finales en la fila $Z$ del tableau óptimo. Si una variable es básica, su costo reducido es obligatoriamente $0$.

### 4.2. Rangos de Variación Permisible para Coeficientes Objetivos ($c_j$)
Si se modifica el coeficiente objetivo de una variable básica $x_j$ por un delta $\Delta$ ($c_{j}' = c_j + \Delta$), los coeficientes de la fila $Z$ en las variables no básicas se ven afectados de manera lineal. Para preservar la optimalidad de la base, el vector de costos reducidos modificados debe permanecer no-negativo.
Sea $p$ el índice de la fila del tableau óptimo asociada a la variable básica $x_j$. Para cada variable no básica $k$:
$$\bar{c}_k(\Delta) = r_k + \Delta \, y_{pk} \ge 0$$
Donde $r_k$ es el costo reducido final de la variable no básica $k$, y $y_{pk}$ es el coeficiente en la fila $p$ y columna $k$ del tableau óptimo.
El aplicativo calcula por separado los límites analizando el signo del coeficiente:
*   Si $y_{pk} > 0$, entonces $\Delta \ge -r_k \, / \, y_{pk}$ (límite inferior para la variación).
*   Si $y_{pk} < 0$, entonces $\Delta \le -r_k \, / \, y_{pk}$ (límite superior para la variación).

Tomando los límites más restrictivos de todos los no básicos $k$, el aplicativo calcula los deltas máximos permitidos:
$$\Delta_{min} = \max_k \left\{ \frac{-r_k}{y_{pk}} \ \middle|\ y_{pk} > 0 \right\}$$
$$\Delta_{max} = \min_k \left\{ \frac{-r_k}{y_{pk}} \ \middle|\ y_{pk} < 0 \right\}$$

Finalmente, los rangos de optimalidad para el coeficiente objetivo son:
*   Para maximización: $c_{j,\min} = c_{j,\text{orig}} + \Delta_{min}$ y $c_{j,\max} = c_{j,\text{orig}} + \Delta_{max}$
*   Para minimización (donde el solver opera sobre $-Z$): $c_{j,\min} = c_{j,\text{orig}} - \Delta_{max}$ y $c_{j,\max} = c_{j,\text{orig}} - \Delta_{min}$

Para variables no básicas, el coeficiente original de la función objetivo puede reducirse de forma ilimitada (límite inferior $-\infty$ en maximización) y puede incrementarse hasta el valor de su costo reducido ($c_j + r_j$) antes de que resulte beneficioso introducirla a la base.

### 4.3. Rangos de Variación Permisible para Lados Derechos ($b_i$)
Cuando se modifica el recurso o RHS de una restricción $i$ por un delta $\delta$ ($b_{i}' = b_i + \delta$), la factibilidad del problema se mantiene siempre que la base de variables siga siendo no-negativa:
$$x_{B}' = B^{-1}(b + \delta e_i) = x_B + \delta S_i \ge 0$$
Donde $S_i$ es la columna de la inversa de la base $B^{-1}$ asociada a la variable de holgura $s_i$ (disponible directamente en la columna $n+i$ de la matriz del tableau óptimo).
Para cada fila $j$ correspondiente a una variable básica, se evalúa:
$$r_j + \delta s_{ji} \ge 0$$
Donde $r_j$ es el valor óptimo actual del RHS en la fila $j$, y $s_{ji}$ es el coeficiente en el tableau óptimo en la fila $j$ y columna de la holgura $s_i$.
El aplicativo calcula los deltas límites:
*   Si $s_{ji} > 0$, entonces $\delta \ge -r_j \, / \, s_{ji}$ (aporta al límite inferior).
*   Si $s_{ji} < 0$, entonces $\delta \le -r_j \, / \, s_{ji}$ (aporta al límite superior).

De este modo:
$$\delta_{min} = \max_j \left\{ \frac{-r_j}{s_{ji}} \ \middle|\  s_{ji} > 0 \right\}$$
$$\delta_{max} = \min_j \left\{ \frac{-r_j}{s_{ji}} \ \middle|\  s_{ji} < 0 \right\}$$

El rango de factibilidad del lado derecho para el recurso $i$ se establece como:
$$b_{i,\min} = b_{i,\text{orig}} + \delta_{min}$$
$$b_{i,\max} = b_{i,\text{orig}} + \delta_{max}$$

Si no hay coeficientes que limiten superior o inferiormente, el software asigna el valor $\infty$ o $-\infty$ correspondientemente.

---

## 5. Guía de Interacción y Uso del Aplicativo

El flujo operativo dentro de **Simplex Optimizer Pro** consta de los siguientes pasos sencillos:

1.  **Configuración de Variables y Tipo de Optimización:**
    El usuario ingresa el número inicial de variables del problema (ej. 2 para visualización gráfica, o más para Simplex regular) y selecciona si desea **Maximizar** o **Minimizar** la función objetivo. Luego hace clic en "Configurar".
2.  **Ingreso de Coeficientes de la Ecuación Objetivo:**
    Se despliega dinámicamente un formulario horizontal donde el usuario ingresa los coeficientes numéricos $c_j$ correspondientes a la función de rendimiento.
3.  **Definición de Restricciones Dinámicas:**
    Se muestra la primera restricción en formato lineal. El aplicativo permite ingresar coeficientes reales $a_{ij}$, seleccionar el tipo de relación mediante un menú desplegable ($\le$, $\ge$, $=$) y el recurso límite RHS ($b_i$). El botón "Añadir Restricción" crea dinámicamente nuevas filas en el formulario.
4.  **Visualización del Desglose Simplex Paso a Paso:**
    Tras oprimir "Resolver Problema", la interfaz procesa los datos y renderiza un carrusel dinámico interactivo:
    *   **Carrusel de Iteraciones:** El usuario puede navegar mediante botones "Anterior/Siguiente", gestos táctiles o flechas del teclado a través de los tableros.
    *   **Fila/Columna de Pivoteo Destacada:** En cada iteración se sombrea con colores la variable entrante (columna), la variable saliente (fila) y el elemento pivote en la intersección (resaltado en verde).
    *   **Operaciones de Fila Declaradas:** Se muestra el detalle analítico de cómo se transformaron las filas para esa iteración (ej. $R_1 \leftarrow R_1 - 2 \times R_2$).
    *   **Valor Actual del Objetivo:** Un indicador muestra el avance progresivo de $Z$ en cada vértice del simplex.
5.  **Interpretación del Método Gráfico Animado:**
    En problemas bidimensionales, la aplicación renderiza el Canvas dinámico. Los botones permiten reproducir paso a paso la construcción de los límites, sombrear la región factible y trazar la línea de iso-ganancia en su intersección óptima. Un listado resume las coordenadas y el valor de Z en todos los vértices.
6.  **Lectura del Análisis de Sensibilidad:**
    Al pie de la pantalla se despliegan dos tablas de análisis post-óptimo que resumen:
    *   **Tabla de Variables:** Nombre, Valor Final obtenido, Costo Reducido, Coeficiente Objetivo Original, y los límites Mínimo y Máximo de su coeficiente objetivo que mantienen la base óptima.
    *   **Tabla de Restricciones:** Identificador, Valor Final del recurso utilizado (LHS), Precio Sombra (Shadow Price), Lado Derecho Original (RHS), y los límites Mínimo y Máximo de variación de recursos que mantienen la base factible.

---

## 6. Conclusiones y Evaluación Académica

La implementación de **Simplex Optimizer Pro** demuestra cómo las herramientas de software pueden potenciar sustancialmente el aprendizaje de conceptos abstractos de optimización lineal y análisis post-óptimo. La integración de los pasos iterativos detallados del Simplex, la visualización geométrica del método gráfico y el desglose de sensibilidad de nivel empresarial provee a los estudiantes una comprensión integral del comportamiento de los modelos matemáticos ante cambios en el entorno de toma de decisiones.

El aplicativo cumple a cabalidad con todos los requisitos funcionales de diseño del curso, ofreciendo un entorno intuitivo, rápido y de alta precisión matemática gracias a la robustez del álgebra matricial de NumPy y la interactividad web avanzada de JavaScript ES6.
