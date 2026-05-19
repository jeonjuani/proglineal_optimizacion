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

    // Canvas
    const wrap = document.createElement('div');
    wrap.className = 'canvas-wrap';
    const canvas = document.createElement('canvas');
    canvas.id = 'simplex-graph';
    canvas.style.width = '100%';
    canvas.style.borderRadius = '14px';
    wrap.appendChild(canvas);
    section.appendChild(wrap);

    // Legend
    const legend = document.createElement('div');
    legend.className = 'graph-legend';
    gd.constraints.forEach((c, i) => {
        legend.innerHTML += `<span class="legend-item">
            <span class="legend-dot" style="background:${GRAPH_COLORS[i % 6]}"></span>${c.label}
        </span>`;
    });
    legend.innerHTML += `<span class="legend-item">
        <span class="legend-dot feasible-dot"></span>Región factible
    </span>`;
    legend.innerHTML += `<span class="legend-item">
        <span class="legend-dot optimal-dot"></span>Z* (línea óptima)
    </span>`;
    section.appendChild(legend);

    // Vertex table
    section.appendChild(buildVertexTable(gd));

    // Draw after DOM is ready
    requestAnimationFrame(() => {
        const W = wrap.offsetWidth || 560;
        canvas.width  = W;
        canvas.height = Math.round(W * 0.80);
        drawCanvas(canvas, gd);
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

function drawCanvas(canvas, gd) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const mg = { t:30, r:20, b:55, l:60 };
    const pw = W - mg.l - mg.r, ph = H - mg.t - mg.b;
    const ax = gd.axis_max;
    const tx = x =>  mg.l + (x / ax) * pw;
    const ty = y =>  mg.t + ph - (y / ax) * ph;
    const gs = Math.ceil(ax / 8) || 1;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.lineWidth = 1;
    for (let v = 0; v <= ax * 1.01; v += gs) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath(); ctx.moveTo(tx(v), mg.t); ctx.lineTo(tx(v), mg.t + ph); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mg.l, ty(v)); ctx.lineTo(mg.l + pw, ty(v)); ctx.stroke();
    }

    // Feasible region fill
    if (gd.vertices.length >= 3) {
        const cx = gd.vertices.reduce((s,v) => s+v[0], 0) / gd.vertices.length;
        const cy = gd.vertices.reduce((s,v) => s+v[1], 0) / gd.vertices.length;
        const sorted = [...gd.vertices].sort((a,b) =>
            Math.atan2(a[1]-cy, a[0]-cx) - Math.atan2(b[1]-cy, b[0]-cx)
        );
        ctx.beginPath();
        ctx.moveTo(tx(sorted[0][0]), ty(sorted[0][1]));
        sorted.slice(1).forEach(v => ctx.lineTo(tx(v[0]), ty(v[1])));
        ctx.closePath();
        ctx.fillStyle = 'rgba(16,185,129,0.13)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16,185,129,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
    } else if (gd.vertices.length === 2) {
        ctx.beginPath();
        ctx.moveTo(tx(gd.vertices[0][0]), ty(gd.vertices[0][1]));
        ctx.lineTo(tx(gd.vertices[1][0]), ty(gd.vertices[1][1]));
        ctx.strokeStyle = 'rgba(16,185,129,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Constraint lines
    gd.constraints.forEach((c, i) => {
        ctx.strokeStyle = GRAPH_COLORS[i % 6];
        ctx.lineWidth = 2; ctx.setLineDash([]);
        let p1, p2;
        if (Math.abs(c.b) > 1e-10) {
            p1 = [0, c.rhs / c.b];
            p2 = [ax, (c.rhs - c.a * ax) / c.b];
        } else if (Math.abs(c.a) > 1e-10) {
            const xv = c.rhs / c.a;
            p1 = [xv, 0]; p2 = [xv, ax];
        } else return;
        ctx.beginPath();
        ctx.moveTo(tx(p1[0]), ty(p1[1]));
        ctx.lineTo(tx(p2[0]), ty(p2[1]));
        ctx.stroke();

        // Label near the line's midpoint
        const mid = [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2];
        if (mid[0] >= 0 && mid[0] <= ax && mid[1] >= 0 && mid[1] <= ax) {
            ctx.fillStyle = GRAPH_COLORS[i % 6];
            ctx.font = `${Math.max(9, Math.round(W/60))}px Outfit,sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(`C${i+1}`, tx(mid[0])+3, ty(mid[1])-5);
        }
    });

    // Objective function isoline at optimal Z
    if (gd.optimal_point) {
        const [c1, c2] = gd.obj_coefficients;
        const [x1o, x2o] = gd.optimal_point;
        const zVal = c1*x1o + c2*x2o;
        ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 5]);
        let p1, p2;
        if (Math.abs(c2) > 1e-10) {
            p1 = [0, zVal/c2]; p2 = [ax, (zVal - c1*ax)/c2];
        } else if (Math.abs(c1) > 1e-10) {
            const xv = zVal/c1; p1=[xv,0]; p2=[xv,ax];
        }
        if (p1) {
            ctx.beginPath(); ctx.moveTo(tx(p1[0]),ty(p1[1])); ctx.lineTo(tx(p2[0]),ty(p2[1])); ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tx(0),ty(0)); ctx.lineTo(tx(ax*0.97),ty(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx(0),ty(0)); ctx.lineTo(tx(0),ty(ax*0.97)); ctx.stroke();

    const fs = Math.max(10, Math.round(W/58));
    ctx.font = `${fs}px Outfit,sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';

    // X-axis ticks
    ctx.textAlign = 'center';
    for (let v = 0; v <= ax*1.01; v += gs) {
        ctx.fillText(fmtG(v), tx(v), ty(0)+18);
    }
    ctx.fillText('x₁', tx(ax*0.97)+12, ty(0)+4);

    // Y-axis ticks
    ctx.textAlign = 'right';
    for (let v = gs; v <= ax*1.01; v += gs) {
        ctx.fillText(fmtG(v), tx(0)-7, ty(v)+4);
    }
    ctx.textAlign = 'center';
    ctx.fillText('x₂', tx(0), ty(ax*0.97)-12);

    // Vertex dots
    gd.vertices.forEach((v, i) => {
        const px = tx(v[0]), py = ty(v[1]);
        ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = `${Math.max(9, Math.round(W/65))}px Outfit,sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`P${i+1}(${fmtG(v[0])},${fmtG(v[1])})`, px+8, py-5);
    });

    // Optimal point highlight
    if (gd.optimal_point) {
        const [x1o, x2o] = gd.optimal_point;
        const px = tx(x1o), py = ty(x2o);
        ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(16,185,129,0.2)'; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI*2);
        ctx.fillStyle = '#10b981'; ctx.fill();
        // Find Z* label
        const optIdx = gd.vertices.findIndex(v => Math.abs(v[0]-x1o)<1e-3 && Math.abs(v[1]-x2o)<1e-3);
        const zLabel = optIdx >= 0 ? fmtG(gd.vertex_z[optIdx]) : '';
        ctx.fillStyle = '#10b981';
        ctx.font = `bold ${Math.max(10,Math.round(W/55))}px Outfit,sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`★ Z*=${zLabel}`, px+14, py-10);
    }
}
