
let personas = [];
let idCnt = 0;

function agregarPersona() {
    const id = ++idCnt;
    personas.push({ id, nombre: '', cedula: '', vinculacion: 'independiente', riesgo: 'I', bruto: 3000000, actividades: '' });
    renderPersonas();
}

function eliminarPersona(id) {
    personas = personas.filter(p => p.id !== id);
    renderPersonas();
}

function upd(id, campo, val) {
    const p = personas.find(p => p.id === id);
    if (p) p[campo] = campo === 'bruto' ? parseFloat(val) || 0 : val;
    renderPersonas();
}

// Cálculo local inmediato (sin llamada API) para preview en pills
function calcLocal(p) {
    const anio = parseInt(document.getElementById('anio').value) || 2026;
    const tipo = document.getElementById('tipo-contrato').value;
    const cobraIVA = document.getElementById('cobra-iva').value === '1';
    const pm = window.APP.parametros[anio] || window.APP.parametros[2026];
    const cfg = window.APP.retenciones[tipo] || window.APP.retenciones['servicios'];
    const arl = window.APP.arlTasas;
    const b = p.bruto;
    const isInd = p.vinculacion === 'independiente';

    let ret = 0;
    if (isInd) {
        const baseMin = cfg.uvt_base * pm.uvt;
        const superaBase = !(cfg.uvt_base > 0 && b < baseMin);
        const superaHon = !(tipo === 'honorarios' && b < 1_000_000);
        if (superaBase && superaHon) ret = Math.round(b * cfg.pct);
    }

    const ica = isInd ? Math.round(b * 0.005) : 0;
    const iva = (cobraIVA && isInd) ? Math.round(b * 0.19) : 0;
    const tasa = arl[p.riesgo] || arl['I'];

    let ss = 0;
    if (isInd) {
        const base = b * 0.40;
        ss = Math.round(base * 0.125) + Math.round(base * 0.16) + Math.round(base * tasa);
    } else {
        const base = Math.max(b, pm.smmlv);
        ss = Math.round(base * 0.04) + Math.round(base * 0.04) + Math.round(base * tasa);
    }

    return { ret, ica, iva, ss, neto: b - ret - ica + iva - ss };
}

function renderPersonas() {
    const lista = document.getElementById('lista-personas');
    if (!personas.length) {
        lista.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem 0;">Sin personas. Haz clic en "Agregar persona".</p>';
        actualizarSelectLiq();
        return;
    }

    lista.innerHTML = '';
    personas.forEach(p => {
        const c = calcLocal(p);
        const isInd = p.vinculacion === 'independiente';
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <p style="font-weight:500;">${p.nombre || 'Nueva persona'}</p>
        <button class="btn-danger" onclick="eliminarPersona(${p.id})" aria-label="Eliminar">
          <i class="ti ti-trash" aria-hidden="true"></i>
        </button>
      </div>
      <div class="grid4">
        <div class="fld">
          <label>Nombre</label>
          <input value="${p.nombre}" placeholder="Juan Pérez" oninput="upd(${p.id},'nombre',this.value)">
        </div>
        <div class="fld">
          <label>Cédula / NIT</label>
          <input value="${p.cedula}" placeholder="1.234.567" oninput="upd(${p.id},'cedula',this.value)">
        </div>
        <div class="fld">
          <label>Vinculación</label>
          <select onchange="upd(${p.id},'vinculacion',this.value)">
            <option value="independiente" ${p.vinculacion === 'independiente' ? 'selected' : ''}>Independiente</option>
            <option value="empleado"      ${p.vinculacion === 'empleado' ? 'selected' : ''}>Empleado directo</option>
          </select>
        </div>
        <div class="fld">
          <label>Nivel ARL</label>
          <select onchange="upd(${p.id},'riesgo',this.value)">
            ${Object.entries(window.APP.arlTasas).map(([r, t]) =>
            `<option value="${r}" ${p.riesgo === r ? 'selected' : ''}>${r} — ${(t * 100).toFixed(3)}%</option>`
        ).join('')}
          </select>
        </div>
      </div>
      <div class="grid2">
        <div class="fld">
          <label>${isInd ? 'Valor bruto (honorarios)' : 'Salario mensual'} COP</label>
          <input type="number" value="${p.bruto}" step="50000" min="0" oninput="upd(${p.id},'bruto',this.value)">
        </div>
        <div class="fld">
          <label>Actividades / Cargo</label>
          <input value="${p.actividades}" placeholder="Desarrollo backend…" oninput="upd(${p.id},'actividades',this.value)">
        </div>
      </div>
      <div class="pill-grid">
        <div class="pill" style="background:var(--bg2);">
          <p class="lbl">Bruto</p><p class="val">${fCOP(p.bruto)}</p>
        </div>
        ${isInd && c.ret > 0 ? `
        <div class="pill" style="background:var(--red-bg);">
          <p class="lbl" style="color:var(--red);">Ret. fuente</p>
          <p class="val" style="color:var(--red);">- ${fCOP(c.ret)}</p>
        </div>` : ''}
        ${isInd ? `
        <div class="pill" style="background:var(--yellow-bg);">
          <p class="lbl" style="color:var(--yellow);">ICA 5‰</p>
          <p class="val" style="color:var(--yellow);">- ${fCOP(c.ica)}</p>
        </div>` : ''}
        <div class="pill" style="background:var(--blue-bg);">
          <p class="lbl" style="color:var(--blue);">SS ${isInd ? 'independ.' : 'empleado'}</p>
          <p class="val" style="color:var(--blue);">- ${fCOP(c.ss)}</p>
        </div>
        ${c.iva > 0 ? `
        <div class="pill" style="background:var(--green-bg);">
          <p class="lbl" style="color:var(--green);">+ IVA 19%</p>
          <p class="val" style="color:var(--green);">+ ${fCOP(c.iva)}</p>
        </div>` : ''}
        <div class="pill" style="background:var(--green-bg);">
          <p class="lbl" style="color:var(--green);">Neto estimado</p>
          <p class="val" style="color:var(--green);">${fCOP(c.neto)}</p>
        </div>
      </div>`;
        lista.appendChild(div);
    });

    actualizarSelectLiq();
}