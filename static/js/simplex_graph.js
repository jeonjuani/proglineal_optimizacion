// simplex_graph.js — Graphical method visualization for 2-variable LP problems

const GRAPH_COLORS = ['#f59e0b','#3b82f6','#a855f7','#ec4899','#06b6d4','#f97316'];

function fmtG(v) {
    if (v === null || v === undefined) return '—';
    const n = Number(v);
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(4)).toString();
}

function buildGraphSection(gd) {
    const section = document.createElement('div');
    section.className = 'graph-section';

    const title = document.createElement('div');
    title.className = 'section-title';
    title.style.marginTop = '2rem';
    title.textContent = '📊 Método Gráfico';
    section.appendChild(title);

    const graphSteps = gd.constraints.length + 3;

    const graphState = {
        activeStep: 0,
        selectedLine: null,
        playing: false,
        timer: null
    };

    const graphGrid = document.createElement('div');
    graphGrid.className = 'graph-grid';

    const graphArea = document.createElement('div');
    graphArea.className = 'graph-area';

    const infoPanel = document.createElement('aside');
    infoPanel.className = 'graph-info-panel';

    const controls = document.createElement('div');
    controls.className = 'graph-controls';

    const stepBox = document.createElement('div');
    stepBox.className = 'graph-stepbox';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn-secondary';
    prevBtn.textContent = '← Anterior';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn-secondary';
    nextBtn.textContent = 'Siguiente →';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'btn-secondary';
    playBtn.textContent = 'Reproducir';

    const stageLabel = document.createElement('div');
    stageLabel.className = 'graph-step-label';

    stepBox.appendChild(prevBtn);
    stepBox.appendChild(stageLabel);
    stepBox.appendChild(nextBtn);
    controls.appendChild(stepBox);
    controls.appendChild(playBtn);

    graphArea.appendChild(controls);

    const wrap = document.createElement('div');
    wrap.className = 'canvas-wrap';
    const canvas = document.createElement('canvas');
    canvas.id = 'simplex-graph';
    canvas.style.borderRadius = '14px';
    wrap.appendChild(canvas);
    graphArea.appendChild(wrap);

    const stepDesc = document.createElement('div');
    stepDesc.className = 'graph-step-desc';
    infoPanel.appendChild(stepDesc);

    const filterRow = document.createElement('div');
    filterRow.className = 'graph-filter-row';
    const filterLabel = document.createElement('span');
    filterLabel.className = 'graph-filter-label';
    filterLabel.textContent = 'Seleccionar línea:';
    filterRow.appendChild(filterLabel);

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'graph-filter-btn active';
    allBtn.textContent = 'Todas';
    filterRow.appendChild(allBtn);

    const lineButtons = gd.constraints.map((c, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'legend-btn';
        btn.textContent = `C${i + 1}`;
        btn.addEventListener('click', () => {
            graphState.selectedLine = graphState.selectedLine === i ? null : i;
            updateGraph();
        });
        filterRow.appendChild(btn);
        return btn;
    });
    infoPanel.appendChild(filterRow);

    const legend = document.createElement('div');
    legend.className = 'graph-legend';

    const feasibleItem = document.createElement('span');
    feasibleItem.className = 'legend-item';
    feasibleItem.innerHTML = `<span class="legend-dot feasible-dot"></span>Región factible`;
    legend.appendChild(feasibleItem);

    const optimalItem = document.createElement('span');
    optimalItem.className = 'legend-item';
    optimalItem.innerHTML = `<span class="legend-dot optimal-dot"></span>Z* (línea óptima)`;
    legend.appendChild(optimalItem);

    gd.constraints.forEach((c, i) => {
        const item = document.createElement('span');
        item.className = 'legend-item';
        item.innerHTML = `<span class="legend-dot" style="background:${GRAPH_COLORS[i % 6]}"></span>${c.label}`;
        legend.appendChild(item);
    });
    infoPanel.appendChild(legend);
    infoPanel.appendChild(buildGraphSummary(gd));
    infoPanel.appendChild(buildVertexTable(gd));
    graphGrid.appendChild(graphArea);
    graphGrid.appendChild(infoPanel);
    section.appendChild(graphGrid);

    function getStageText(stepIndex) {
        if (stepIndex === 0) {
            return `Paso 0: Ejes y cuadrícula`;
        }
        if (stepIndex <= gd.constraints.length) {
            return `Paso ${stepIndex}: agregar ${gd.constraints[stepIndex - 1].label}`;
        }
        if (stepIndex === gd.constraints.length + 1) {
            return `Paso ${stepIndex}: región factible`;
        }
        return `Paso ${stepIndex}: línea objetivo y solución óptima`;
    }

    function getDescText() {
        if (graphState.selectedLine !== null) {
            return `Se destaca la restricción ${gd.constraints[graphState.selectedLine].label} para analizar su comportamiento individual.`;
        }
        if (graphState.activeStep === 0) {
            return `Iniciamos con los ejes y la cuadrícula, para entender el área de análisis.`;
        }
        if (graphState.activeStep <= gd.constraints.length) {
            return `Añadimos progresivamente la restricción ${gd.constraints[graphState.activeStep - 1].label} y observamos su efecto.`;
        }
        if (graphState.activeStep === gd.constraints.length + 1) {
            return `Se muestra la región factible completa generada por todas las restricciones.`;
        }
        return `Finalmente aparece la línea objetivo y se marca la solución óptima.`;
    }

    function setPlaying(value) {
        graphState.playing = value;
        playBtn.textContent = value ? 'Pausar' : 'Reproducir';
        if (value) {
            graphState.timer = setInterval(() => {
                if (graphState.activeStep < graphSteps - 1) {
                    graphState.activeStep += 1;
                    updateGraph();
                } else {
                    setPlaying(false);
                }
            }, 1400);
        } else {
            clearInterval(graphState.timer);
            graphState.timer = null;
        }
    }

    function updateGraph() {
        const maxStep = graphSteps - 1;
        prevBtn.disabled = graphState.activeStep === 0;
        nextBtn.disabled = graphState.activeStep === maxStep;
        stageLabel.textContent = getStageText(graphState.activeStep);
        stepDesc.textContent = getDescText();

        allBtn.classList.toggle('active', graphState.selectedLine === null);
        lineButtons.forEach((btn, index) => {
            btn.classList.toggle('active', graphState.selectedLine === index);
        });

        drawCanvas(canvas, gd, {
            activeStep: graphState.activeStep,
            selectedLine: graphState.selectedLine
        });
    }

    prevBtn.addEventListener('click', () => {
        if (graphState.activeStep > 0) {
            graphState.activeStep -= 1;
            updateGraph();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (graphState.activeStep < graphSteps - 1) {
            graphState.activeStep += 1;
            updateGraph();
        }
    });

    playBtn.addEventListener('click', () => {
        setPlaying(!graphState.playing);
    });

    allBtn.addEventListener('click', () => {
        graphState.selectedLine = null;
        updateGraph();
    });

    function buildGraphSummary(gd) {
        const wrap = document.createElement('div');
        wrap.className = 'graph-summary-grid';

        const objectiveCard = document.createElement('div');
        objectiveCard.className = 'graph-summary-card';
        objectiveCard.innerHTML = `
            <div class="summary-label">Función objetivo</div>
            <div class="summary-value">Z = ${fmtG(gd.obj_coefficients[0])}x₁ + ${fmtG(gd.obj_coefficients[1])}x₂</div>
        `;
        wrap.appendChild(objectiveCard);

        const lineCard = document.createElement('div');
        lineCard.className = 'graph-summary-card';
        lineCard.innerHTML = `
            <div class="summary-label">Restricciones</div>
            <div class="summary-value">${gd.constraints.length} líneas + ejes</div>
        `;
        wrap.appendChild(lineCard);

        const vertexCard = document.createElement('div');
        vertexCard.className = 'graph-summary-card';
        vertexCard.innerHTML = `
            <div class="summary-label">Vértices factibles</div>
            <div class="summary-value">${gd.vertices.length}</div>
        `;
        wrap.appendChild(vertexCard);

        const optimalCard = document.createElement('div');
        optimalCard.className = 'graph-summary-card';
        optimalCard.innerHTML = `
            <div class="summary-label">Óptimo estimado</div>
            <div class="summary-value">${gd.optimal_point ? `(${fmtG(gd.optimal_point[0])}, ${fmtG(gd.optimal_point[1])})` : 'N/A'}</div>
        `;
        wrap.appendChild(optimalCard);

        return wrap;
    }

    requestAnimationFrame(() => {
        const W = Math.max(300, Math.min(wrap.offsetWidth || 500, 700));
        canvas.width = W;
        canvas.height = Math.round(W * 13 / 20);
        updateGraph();
    });

    window.addEventListener('resize', () => {
        const W = Math.max(300, Math.min(wrap.offsetWidth || 500, 700));
        canvas.width = W;
        canvas.height = Math.round(W * 13 / 20);
        updateGraph();
    });

    return section;
}

function buildVertexTable(gd) {
    const wrap = document.createElement('div');
    wrap.className = 'vertex-table-wrap';

    const hdr = document.createElement('div');
    hdr.className = 'section-title';
    hdr.style.cssText = 'font-size:1rem;margin-top:1.5rem';
    hdr.textContent = 'Vértices de la Región Factible';
    wrap.appendChild(hdr);

    const tbl = document.createElement('table');
    tbl.className = 'simplex-table';
    tbl.innerHTML = `<thead><tr>
        <th style="text-align:left">Punto</th>
        <th>x₁</th><th>x₂</th>
        <th>Z = f(x₁, x₂)</th>
        <th>¿Óptimo?</th>
    </tr></thead>`;

    const tbody = document.createElement('tbody');
    const opt = gd.optimal_point;
    gd.vertices.forEach((v, i) => {
        const isOpt = opt && Math.abs(v[0]-opt[0]) < 1e-3 && Math.abs(v[1]-opt[1]) < 1e-3;
        const tr = document.createElement('tr');
        if (isOpt) tr.className = 'optimal-row';
        tr.innerHTML = `
            <td class="basis-cell">P${i+1} (${fmtG(v[0])}, ${fmtG(v[1])})</td>
            <td>${fmtG(v[0])}</td>
            <td>${fmtG(v[1])}</td>
            <td class="${isOpt ? 'result-val' : ''}">${fmtG(gd.vertex_z[i])}</td>
            <td>${isOpt ? '★ Óptimo' : ''}</td>`;
        tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);
    return wrap;
}

function drawCanvas(canvas, gd, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const mg = { t: 30, r: 20, b: 55, l: 60 };
    const pw = W - mg.l - mg.r, ph = H - mg.t - mg.b;
    const ax = gd.axis_max;
    const tx = x => mg.l + (x / ax) * pw;
    const ty = y => mg.t + ph - (y / ax) * ph;
    const gs = Math.ceil(ax / 8) || 1;
        const activeStep = Number.isInteger(opts.activeStep) ? opts.activeStep : graphSteps - 1;
        const selectedLine = opts.selectedLine !== null && opts.selectedLine !== undefined ? opts.selectedLine : null;

        const showConstraintCount = selectedLine !== null
            ? gd.constraints.length
            : Math.max(0, Math.min(activeStep, gd.constraints.length));
        const showFeasible = selectedLine === null && activeStep >= gd.constraints.length + 1;
        const showObjective = selectedLine === null && activeStep >= gd.constraints.length + 2;

        // Background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.lineWidth = 1;
        const gridColor = 'rgba(15, 23, 42, 0.08)';
        for (let v = 0; v <= ax * 1.01; v += gs) {
            ctx.strokeStyle = gridColor;
            ctx.beginPath(); ctx.moveTo(tx(v), mg.t); ctx.lineTo(tx(v), mg.t + ph); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(mg.l, ty(v)); ctx.lineTo(mg.l + pw, ty(v)); ctx.stroke();
        }

        if (showFeasible && gd.vertices.length >= 3) {
            const cx = gd.vertices.reduce((s, v) => s + v[0], 0) / gd.vertices.length;
            const cy = gd.vertices.reduce((s, v) => s + v[1], 0) / gd.vertices.length;
            const sorted = [...gd.vertices].sort((a, b) =>
                Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)
            );
            ctx.beginPath();
            ctx.moveTo(tx(sorted[0][0]), ty(sorted[0][1]));
            sorted.slice(1).forEach(v => ctx.lineTo(tx(v[0]), ty(v[1])));
            ctx.closePath();
            ctx.fillStyle = 'rgba(16,185,129,0.12)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(16,185,129,0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        gd.constraints.forEach((c, i) => {
            if (selectedLine !== null && i !== selectedLine) return;
            if (selectedLine === null && i >= showConstraintCount) return;

            const isSelected = selectedLine === i;
            const isEquality = c.type === '=';
            ctx.strokeStyle = GRAPH_COLORS[i % 6];
            ctx.lineWidth = isSelected ? 3.5 : (isEquality ? 2.5 : 2);
            ctx.setLineDash(isSelected ? [6, 4] : (isEquality ? [] : []));
            let p1, p2;
            if (Math.abs(c.b) > 1e-10) {
                p1 = [0, c.rhs / c.b];
                p2 = [ax, (c.rhs - c.a * ax) / c.b];
            } else if (Math.abs(c.a) > 1e-10) {
                const xv = c.rhs / c.a;
                p1 = [xv, 0]; p2 = [xv, ax];
            } else {
                return;
            }
            ctx.beginPath();
            ctx.moveTo(tx(p1[0]), ty(p1[1]));
            ctx.lineTo(tx(p2[0]), ty(p2[1]));
            ctx.stroke();

            // Show constraint type label (≤, ≥, =)
            const typeSymbol = c.type === '<=' ? '≤' : c.type === '>=' ? '≥' : '=';
            const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
            if (mid[0] >= 0 && mid[0] <= ax && mid[1] >= 0 && mid[1] <= ax) {
                ctx.fillStyle = GRAPH_COLORS[i % 6];
                ctx.font = `${Math.max(9, Math.round(W / 60))}px Outfit,sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText(`C${i + 1} (${typeSymbol})`, tx(mid[0]) + 3, ty(mid[1]) - 5);
            }
        });

        if (showObjective && gd.optimal_point) {
            const [c1, c2] = gd.obj_coefficients;
            const [x1o, x2o] = gd.optimal_point;
            const zVal = c1 * x1o + c2 * x2o;
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 5]);
            let p1, p2;
            if (Math.abs(c2) > 1e-10) {
                p1 = [0, zVal / c2];
                p2 = [ax, (zVal - c1 * ax) / c2];
            } else if (Math.abs(c1) > 1e-10) {
                const xv = zVal / c1;
                p1 = [xv, 0]; p2 = [xv, ax];
            }
            if (p1) {
                ctx.beginPath(); ctx.moveTo(tx(p1[0]), ty(p1[1])); ctx.lineTo(tx(p2[0]), ty(p2[1])); ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tx(0), ty(0)); ctx.lineTo(tx(ax * 0.97), ty(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx(0), ty(0)); ctx.lineTo(tx(0), ty(ax * 0.97)); ctx.stroke();

        const fs = Math.max(10, Math.round(W / 58));
        ctx.font = `${fs}px Outfit,sans-serif`;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';

        ctx.textAlign = 'center';
        for (let v = 0; v <= ax * 1.01; v += gs) {
            ctx.fillText(fmtG(v), tx(v), ty(0) + 18);
        }
        ctx.fillText('x₁', tx(ax * 0.97) + 12, ty(0) + 4);

        ctx.textAlign = 'right';
        for (let v = gs; v <= ax * 1.01; v += gs) {
            ctx.fillText(fmtG(v), tx(0) - 7, ty(v) + 4);
        }
        ctx.textAlign = 'center';
        ctx.fillText('x₂', tx(0), ty(ax * 0.97) - 12);

        if (showFeasible || showObjective || activeStep > 0) {
            gd.vertices.forEach((v, i) => {
                const px = tx(v[0]), py = ty(v[1]);
                ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2);
                ctx.fillStyle = '#0f172a'; ctx.fill();
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.font = `${Math.max(9, Math.round(W / 65))}px Outfit,sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText(`P${i + 1}(${fmtG(v[0])},${fmtG(v[1])})`, px + 8, py - 5);
            });
        }

        if (showObjective && gd.optimal_point) {
            const [x1o, x2o] = gd.optimal_point;
            const px = tx(x1o), py = ty(x2o);
            const [c1, c2] = gd.obj_coefficients;
            const zVal = c1 * x1o + c2 * x2o;
            ctx.font = `bold ${Math.max(10, Math.round(W / 55))}px Outfit,sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillStyle = '#16a34a';
            ctx.fillText(`★ Z*=${fmtG(zVal)}`, px + 14, py - 10);
        }
}
