document.addEventListener('DOMContentLoaded', () => {
    const setupBtn = document.getElementById('setup-btn');
    const solveBtn = document.getElementById('solve-btn');
    const addConstraintBtn = document.getElementById('add-constraint-btn');
    const numVarsInput = document.getElementById('num-vars');
    const solverInputs = document.getElementById('solver-inputs');
    const objectiveContainer = document.getElementById('objective-container');
    const constraintsContainer = document.getElementById('constraints-container');
    const resultsSection = document.getElementById('results-section');
    const resultsContent = document.getElementById('results-content');

    let numVars = 2;

    setupBtn.addEventListener('click', () => {
        numVars = parseInt(numVarsInput.value);
        if (numVars < 1) return;

        generateObjectiveInputs();
        constraintsContainer.innerHTML = '';
        addConstraint(); // Add first constraint by default
        
        solverInputs.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        
        // Smooth scroll to inputs
        solverInputs.scrollIntoView({ behavior: 'smooth' });
    });

    addConstraintBtn.addEventListener('click', () => {
        addConstraint();
    });

    solveBtn.addEventListener('click', async () => {
        const data = collectFormData();
        if (!data) return;

        solveBtn.disabled = true;
        solveBtn.innerText = 'Resolviendo...';

        try {
            const response = await fetch('/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            displayResults(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al resolver el problema.');
        } finally {
            solveBtn.disabled = false;
            solveBtn.innerText = 'Resolver Problema';
        }
    });

    function generateObjectiveInputs() {
        objectiveContainer.innerHTML = '';
        for (let i = 0; i < numVars; i++) {
            const group = document.createElement('div');
            group.className = 'equation-row';
            group.innerHTML = `
                <input type="number" step="any" class="var-input obj-coef" placeholder="0" data-index="${i}">
                <span class="var-label">x<sub>${i + 1}</sub></span>
                ${i < numVars - 1 ? '<span>+</span>' : ''}
            `;
            objectiveContainer.appendChild(group);
        }
    }

    function addConstraint() {
        const row = document.createElement('div');
        row.className = 'equation-row constraint-row';
        
        let html = '';
        for (let i = 0; i < numVars; i++) {
            html += `
                <input type="number" step="any" class="var-input const-coef" placeholder="0" data-index="${i}">
                <span class="var-label">x<sub>${i + 1}</sub></span>
                ${i < numVars - 1 ? '<span>+</span>' : ''}
            `;
        }
        
        html += `
            <span style="margin: 0 10px;">&le;</span>
            <input type="number" step="any" class="var-input const-rhs" placeholder="0">
            <button class="btn-secondary remove-btn" style="padding: 0.4rem 0.8rem; margin-left: 10px;">&times;</button>
        `;
        
        row.innerHTML = html;
        constraintsContainer.appendChild(row);

        row.querySelector('.remove-btn').addEventListener('click', () => {
            row.remove();
        });
    }

    function collectFormData() {
        const optType = document.getElementById('opt-type').value;
        const objCoefs = Array.from(document.querySelectorAll('.obj-coef')).map(input => parseFloat(input.value) || 0);
        
        const constraints = [];
        const constraintRows = document.querySelectorAll('.constraint-row');
        
        for (const row of constraintRows) {
            const coefs = Array.from(row.querySelectorAll('.const-coef')).map(input => parseFloat(input.value) || 0);
            const rhs = parseFloat(row.querySelector('.const-rhs').value) || 0;
            constraints.push({ coefficients: coefs, rhs: rhs });
        }

        return {
            optimization_type: optType,
            objective_function: objCoefs,
            constraints: constraints
        };
    }

    function displayResults(data) {
        resultsSection.classList.remove('hidden');
        resultsContent.innerHTML = '';

        if (data.error) {
            resultsContent.innerHTML = `<p class="accent">Error: ${data.error}</p>`;
        } else {
            let html = `
                <div class="result-item">
                    <span>Estado:</span>
                    <span class="result-val">${data.status}</span>
                </div>
                <div class="result-item">
                    <span>Valor Óptimo (Z):</span>
                    <span class="result-val">${data.optimal_value.toFixed(4)}</span>
                </div>
                <div class="section-title" style="margin-top: 1.5rem; font-size: 1rem;">Variables de Decisión</div>
            `;

            data.variables.forEach((name, i) => {
                html += `
                    <div class="result-item">
                        <span>${name}:</span>
                        <span class="result-val">${data.solution[i].toFixed(4)}</span>
                    </div>
                `;
            });

            resultsContent.innerHTML = html;
        }

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
});
