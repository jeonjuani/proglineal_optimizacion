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
    const graphPanel = document.getElementById('graph-panel');
    const graphWrapper = document.getElementById('graph-wrapper');

    let numVars = 2;

    // ─── Setup ───────────────────────────────────────────────────────────────
    setupBtn.addEventListener('click', () => {
        numVars = parseInt(numVarsInput.value);
        if (numVars < 1) return;

        generateObjectiveInputs();
        constraintsContainer.innerHTML = '';
        addConstraint();

        solverInputs.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        solverInputs.scrollIntoView({ behavior: 'smooth' });
    });

    addConstraintBtn.addEventListener('click', () => addConstraint());

    // ─── Solve ────────────────────────────────────────────────────────────────
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

    // ─── Generate Objective Inputs ────────────────────────────────────────────
    function generateObjectiveInputs() {
        let html = '';
        for (let i = 0; i < numVars; i++) {
            html += `
                <span class="coef-group">
                    <input type="number" step="any" class="var-input obj-coef" placeholder="0" data-index="${i}">
                    <span class="var-label">x<sub>${i + 1}</sub></span>
                </span>
                ${i < numVars - 1 ? '<span class="eq-op">+</span>' : ''}
            `;
        }
        objectiveContainer.innerHTML = html;
    }

    // ─── Add Constraint Row ───────────────────────────────────────────────────
    function addConstraint() {
        const row = document.createElement('div');
        row.className = 'equation-row constraint-row';

        let html = '';
        for (let i = 0; i < numVars; i++) {
            html += `
                <span class="coef-group">
                    <input type="number" step="any" class="var-input const-coef" placeholder="0" data-index="${i}">
                    <span class="var-label">x<sub>${i + 1}</sub></span>
                </span>
                ${i < numVars - 1 ? '<span class="eq-op">+</span>' : ''}
            `;
        }

        html += `
            <span class="eq-op eq-op--rel">&le;</span>
            <input type="number" step="any" class="var-input const-rhs" placeholder="0">
            <button type="button" class="btn-secondary remove-btn" aria-label="Eliminar restricción">&times;</button>
        `;

        row.innerHTML = html;
        constraintsContainer.appendChild(row);
        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
    }

    // ─── Collect Form Data ────────────────────────────────────────────────────
    function collectFormData() {
        const optType = document.getElementById('opt-type').value;
        const objCoefs = Array.from(document.querySelectorAll('.obj-coef')).map(i => parseFloat(i.value) || 0);

        const constraints = [];
        for (const row of document.querySelectorAll('.constraint-row')) {
            const coefs = Array.from(row.querySelectorAll('.const-coef')).map(i => parseFloat(i.value) || 0);
            const rhs = parseFloat(row.querySelector('.const-rhs').value) || 0;
            constraints.push({ coefficients: coefs, rhs });
        }

        if (constraints.length === 0) {
            alert('Agrega al menos una restricción.');
            return null;
        }

        return { optimization_type: optType, objective_function: objCoefs, constraints };
    }

    // ─── Display Results ──────────────────────────────────────────────────────
    function displayResults(data) {
        resultsSection.classList.remove('hidden');
        resultsContent.innerHTML = '';

        if (data.error) {
            resultsContent.innerHTML = `<p class="error-msg">⚠️ ${data.error}</p>`;
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Summary cards
        const statusIcon = data.status === 'Optimal' ? '✅' : data.status === 'Unbounded' ? '⚠️' : '❌';
        let html = `
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-label">Estado</div>
                    <div class="summary-value">${statusIcon} ${data.status}</div>
                </div>
                <div class="summary-card highlight">
                    <div class="summary-label">Valor Óptimo (Z)</div>
                    <div class="summary-value">${data.optimal_value !== null ? data.optimal_value.toFixed(4) : '—'}</div>
                </div>
            </div>
        `;

        // Decision variables
        if (data.solution) {
            html += `<div class="section-title" style="margin-top:1.5rem;font-size:1rem;">Variables de Decisión</div>
                     <div class="vars-grid">`;
            data.variables.forEach((name, i) => {
                html += `
                    <div class="var-card">
                        <span class="var-name">${name}</span>
                        <span class="var-val">${data.solution[i].toFixed(4)}</span>
                    </div>`;
            });
            html += `</div>`;
        }

        resultsContent.innerHTML = html;

        // Tableau steps slider
        if (data.steps && data.steps.length > 0) {
            const sliderSection = buildTableauSlider(data.steps);
            resultsContent.appendChild(sliderSection);
        }

        // Add Sensitivity Analysis tables
        if (data.sensitivity_analysis) {
            const sensitivitySection = buildSensitivitySection(data.sensitivity_analysis);
            if (sensitivitySection) {
                resultsContent.appendChild(sensitivitySection);
            }
        }

        if (data.graphic_data) {
            graphPanel.classList.remove('hidden');
            graphWrapper.innerHTML = '';
            graphWrapper.appendChild(buildGraphSection(data.graphic_data));
        } else {
            graphPanel.classList.add('hidden');
            graphWrapper.innerHTML = '';
        }

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // ─── Build Sensitivity Section ────────────────────────────────────────────
    function buildSensitivitySection(sa) {
        if (!sa || !sa.variables || !sa.constraints) return null;

        const wrap = document.createElement('div');
        wrap.className = 'sensitivity-section';

        const title = document.createElement('div');
        title.className = 'section-title';
        title.style.marginTop = '2rem';
        title.textContent = '🔍 Análisis de Sensibilidad';
        wrap.appendChild(title);

        const fmtBound = (val) => (val === null || val === undefined) ? '∞' : formatNum(val);

        // 1. Variables Table
        const varTitle = document.createElement('div');
        varTitle.style.cssText = 'font-weight: 600; margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--text-primary);';
        varTitle.textContent = 'Variables de Decisión';
        wrap.appendChild(varTitle);

        const varTableWrapper = document.createElement('div');
        varTableWrapper.className = 'tableau-table-wrapper compact-table-wrapper';
        varTableWrapper.style.marginBottom = '1.5rem';

        const varTable = document.createElement('table');
        varTable.className = 'simplex-table compact-table';
        varTable.innerHTML = `
            <thead>
                <tr>
                    <th style="text-align:left">Variable</th>
                    <th>Valor Final</th>
                    <th>Costo Reducido</th>
                    <th>Coef. Objetivo</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                </tr>
            </thead>
            <tbody>
                ${sa.variables.map(v => `
                    <tr>
                        <td style="text-align:left" class="basis-cell">${v.name}</td>
                        <td>${formatNum(v.final_value)}</td>
                        <td>${formatNum(v.reduced_cost)}</td>
                        <td>${formatNum(v.objective_coefficient)}</td>
                        <td>${fmtBound(v.min)}</td>
                        <td>${fmtBound(v.max)}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        varTableWrapper.appendChild(varTable);
        wrap.appendChild(varTableWrapper);

        // 2. Constraints Table
        const constTitle = document.createElement('div');
        constTitle.style.cssText = 'font-weight: 600; margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--text-primary);';
        constTitle.textContent = 'Restricciones';
        wrap.appendChild(constTitle);

        const constTableWrapper = document.createElement('div');
        constTableWrapper.className = 'tableau-table-wrapper compact-table-wrapper';

        const constTable = document.createElement('table');
        constTable.className = 'simplex-table compact-table';
        constTable.innerHTML = `
            <thead>
                <tr>
                    <th style="text-align:left">Restricción</th>
                    <th>Valor Final (LHS)</th>
                    <th>Precio Sombra</th>
                    <th>Lado Derecho (RHS)</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                </tr>
            </thead>
            <tbody>
                ${sa.constraints.map(c => `
                    <tr>
                        <td style="text-align:left" class="basis-cell">${c.name}</td>
                        <td>${formatNum(c.final_value)}</td>
                        <td>${formatNum(c.shadow_price)}</td>
                        <td>${formatNum(c.rhs)}</td>
                        <td>${fmtBound(c.min)}</td>
                        <td>${fmtBound(c.max)}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        constTableWrapper.appendChild(constTable);
        wrap.appendChild(constTableWrapper);

        return wrap;
    }

    // ─── Tableau Slider ───────────────────────────────────────────────────────
    function buildTableauSlider(steps) {
        const wrapper = document.createElement('div');
        wrapper.className = 'tableau-section';

        const title = document.createElement('div');
        title.className = 'section-title';
        title.style.marginTop = '2rem';
        title.textContent = `Proceso Simplex — ${steps.length} iteración${steps.length !== 1 ? 'es' : ''}`;
        wrapper.appendChild(title);

        // Progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'slider-progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'slider-progress-fill';
        progressBar.appendChild(progressFill);
        wrapper.appendChild(progressBar);

        // Slider track (clip wrapper prevents overflow bleed)
        const trackOuter = document.createElement('div');
        trackOuter.className = 'tableau-track-outer';

        const track = document.createElement('div');
        track.className = 'tableau-track';

        steps.forEach((step, idx) => {
            const slide = document.createElement('div');
            slide.className = 'tableau-slide';
            slide.appendChild(buildTableauCard(step, idx, steps.length));
            track.appendChild(slide);
        });

        trackOuter.appendChild(track);
        wrapper.appendChild(trackOuter);

        // Navigation controls
        const controls = document.createElement('div');
        controls.className = 'slider-controls';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn-secondary slider-btn';
        prevBtn.id = 'slider-prev';
        prevBtn.innerHTML = '&#8592; Anterior';

        const stepInfo = document.createElement('div');
        stepInfo.className = 'step-indicator';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn-secondary slider-btn';
        nextBtn.id = 'slider-next';
        nextBtn.innerHTML = 'Siguiente &#8594;';

        controls.appendChild(prevBtn);
        controls.appendChild(stepInfo);
        controls.appendChild(nextBtn);
        wrapper.appendChild(controls);

        // Dot indicators
        const dots = document.createElement('div');
        dots.className = 'slider-dots';
        steps.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Iteración ${i}`);
            dots.appendChild(dot);
        });
        wrapper.appendChild(dots);

        // State
        let current = 0;

        function updateSlider(newIdx) {
            current = newIdx;
            const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;
            progressFill.style.width = `${pct}%`;
            track.style.transform = `translateX(-${current * 100}%)`;
            stepInfo.textContent = `Iteración ${steps[current].iteration} de ${steps[steps.length - 1].iteration}`;
            prevBtn.disabled = current === 0;
            nextBtn.disabled = current === steps.length - 1;
            dots.querySelectorAll('.slider-dot').forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });
        }

        prevBtn.addEventListener('click', () => { if (current > 0) updateSlider(current - 1); });
        nextBtn.addEventListener('click', () => { if (current < steps.length - 1) updateSlider(current + 1); });
        dots.querySelectorAll('.slider-dot').forEach((dot, i) => {
            dot.addEventListener('click', () => updateSlider(i));
        });

        // Touch/swipe support
        let touchStartX = 0;
        track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
                if (diff > 0 && current < steps.length - 1) updateSlider(current + 1);
                else if (diff < 0 && current > 0) updateSlider(current - 1);
            }
        });

        // Keyboard navigation
        wrapper.setAttribute('tabindex', '0');
        wrapper.addEventListener('keydown', e => {
            if (e.key === 'ArrowRight' && current < steps.length - 1) updateSlider(current + 1);
            if (e.key === 'ArrowLeft' && current > 0) updateSlider(current - 1);
        });

        updateSlider(0);
        return wrapper;
    }

    // ─── Build Single Tableau Card ────────────────────────────────────────────
    function buildTableauCard(step, slideIdx, totalSlides) {
        const card = document.createElement('div');
        card.className = 'tableau-card';

        // Header
        const header = document.createElement('div');
        header.className = 'tableau-header';

        const iterBadge = document.createElement('span');
        iterBadge.className = 'iter-badge';
        iterBadge.textContent = slideIdx === 0 ? 'Inicial' : `Iter. ${step.iteration}`;

        const noteEl = document.createElement('span');
        noteEl.className = 'tableau-note';
        noteEl.textContent = step.note;

        header.appendChild(iterBadge);
        header.appendChild(noteEl);
        card.appendChild(header);

        // Entering / Leaving info
        if (step.entering || step.leaving) {
            const varInfo = document.createElement('div');
            varInfo.className = 'var-info-row';
            if (step.entering) {
                varInfo.innerHTML += `<span class="tag entering">↑ Entra: <strong>${step.entering}</strong></span>`;
            }
            if (step.leaving) {
                varInfo.innerHTML += `<span class="tag leaving">↓ Sale: <strong>${step.leaving}</strong></span>`;
            }
            card.appendChild(varInfo);
        }

        // Table wrapper (scrollable)
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'tableau-table-wrapper';

        const table = document.createElement('table');
        table.className = 'simplex-table';

        // Header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th class="basis-col">Base</th>';
        step.col_headers.forEach((h, ci) => {
            const th = document.createElement('th');
            th.textContent = h;
            if (ci === step.pivot_col) th.className = 'col-pivot';
            headerRow.appendChild(th);
        });
        // Ratio column (only if there are ratios)
        const hasRatios = step.rows.some(r => r.ratio !== null && r.ratio !== undefined);
        if (hasRatios) {
            const ratioTh = document.createElement('th');
            ratioTh.textContent = 'θ (ratio)';
            ratioTh.className = 'ratio-col';
            headerRow.appendChild(ratioTh);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body rows
        const tbody = document.createElement('tbody');
        step.rows.forEach((row, ri) => {
            const tr = document.createElement('tr');
            if (row.is_pivot_row) tr.className = 'pivot-row';

            const basisTd = document.createElement('td');
            basisTd.className = 'basis-cell';
            basisTd.textContent = row.basis;
            tr.appendChild(basisTd);

            row.values.forEach((val, ci) => {
                const td = document.createElement('td');
                td.textContent = formatNum(val);
                if (ci === step.pivot_col) td.className = 'col-pivot';
                if (ci === step.pivot_col && row.is_pivot_row) td.className = 'pivot-cell';
                tr.appendChild(td);
            });

            if (hasRatios) {
                const ratioTd = document.createElement('td');
                ratioTd.className = 'ratio-col';
                ratioTd.textContent = (row.ratio !== null && row.ratio !== undefined) ? formatNum(row.ratio) : '—';
                if (row.is_pivot_row && row.ratio !== null) ratioTd.className += ' min-ratio';
                tr.appendChild(ratioTd);
            }

            tbody.appendChild(tr);
        });

        // Z row
        const zTr = document.createElement('tr');
        zTr.className = 'z-row';
        const zLabel = document.createElement('td');
        zLabel.className = 'basis-cell';
        zLabel.textContent = 'Z';
        zTr.appendChild(zLabel);
        step.z_row.values.forEach((val, ci) => {
            const td = document.createElement('td');
            td.textContent = formatNum(val);
            const isRHS = ci === step.z_row.values.length - 1;
            if (ci === step.pivot_col) {
                td.className = 'col-pivot';
            } else if (isRHS) {
                td.style.color = '#10b981';
                td.style.fontWeight = '700';
            } else if (val < -1e-10) {
                td.className = 'z-negative';   // can still improve
            } else if (val > 1e-10) {
                td.className = 'z-positive';   // penalizes — non-basic
            }
            zTr.appendChild(td);
        });
        if (hasRatios) {
            zTr.appendChild(document.createElement('td'));
        }
        tbody.appendChild(zTr);

        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        card.appendChild(tableWrapper);

        // Row operations panel (shown when there's a pivot)
        if (step.pivot_row !== null && step.pivot_row !== undefined && step.pivot_element !== null) {
            const opsDiv = document.createElement('div');
            opsDiv.className = 'row-ops-panel';
            const pe = step.pivot_element;
            let opsHtml = `<div class="row-ops-title">Operaciones de fila:</div>`;
            opsHtml += `<div class="row-op">R<sub>${step.pivot_row+1}</sub> &larr; R<sub>${step.pivot_row+1}</sub> &divide; ${formatNum(pe)}</div>`;
            step.rows.forEach((row, ri) => {
                if (ri === step.pivot_row) return;
                const factor = row.values[step.pivot_col];
                if (Math.abs(factor) > 1e-10) {
                    const sign = factor > 0 ? '&minus;' : '+';
                    opsHtml += `<div class="row-op">R<sub>${ri+1}</sub> &larr; R<sub>${ri+1}</sub> ${sign} ${formatNum(Math.abs(factor))} &times; R<sub>${step.pivot_row+1}</sub></div>`;
                }
            });
            const zFactor = step.z_row.values[step.pivot_col];
            if (Math.abs(zFactor) > 1e-10) {
                const sign = zFactor > 0 ? '&minus;' : '+';
                opsHtml += `<div class="row-op">R<sub>Z</sub> &larr; R<sub>Z</sub> ${sign} ${formatNum(Math.abs(zFactor))} &times; R<sub>${step.pivot_row+1}</sub></div>`;
            }
            opsDiv.innerHTML = opsHtml;
            card.appendChild(opsDiv);
        }

        // Current Z value badge
        const zBadge = document.createElement('div');
        zBadge.className = 'z-badge';
        zBadge.textContent = `Valor de Z en esta iteración: ${formatNum(step.current_z)}`;
        card.appendChild(zBadge);

        return card;
    }

    // ─── Format number helper ──────────────────────────────────────────────────
    function formatNum(v) {
        if (v === null || v === undefined) return '—';
        const n = Number(v);
        if (Number.isInteger(n)) return n.toString();
        // Show up to 4 decimal places, strip trailing zeros
        return parseFloat(n.toFixed(4)).toString();
    }
});
