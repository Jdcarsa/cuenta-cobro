import { personas, addPersona, removePersona, incrementId, actualizarSelectLiq } from './state.js';
import { fCOP } from './helpers.js';

export function agregarPersona() {
    const id = incrementId();
    addPersona({ id, nombre: '', cedula: '', vinculacion: 'independiente', riesgo: 'I', bruto: 3000000, actividades: '' });
    renderPersonas();
}

export function eliminarPersona(id) {
    removePersona(id);
    renderPersonas(); 
}

export function upd(id, campo, val) {
    const p = personas.find(p => p.id === id);
    if (!p) return;
    p[campo] = campo === 'bruto' ? parseFloat(val) || 0 : val;
    if (campo === 'vinculacion' || campo === 'riesgo') {
        renderPersonas();
        return;
    }
    actualizarPills(id);
    if (campo === 'nombre') actualizarSelectLiq();
}

function actualizarPills(id) {
    const p = personas.find(p => p.id === id);
    if (!p) return;
    const pillsEl = document.getElementById(`pills-${id}`);
    if (!pillsEl) return;
    const c     = calcLocal(p);
    const isInd = p.vinculacion === 'independiente';
    pillsEl.innerHTML = buildPills(p, c, isInd);
}

function buildPills(p, c, isInd) {
    return `
        <div class="pill bg-gray-100"><p class="lbl">Bruto</p><p class="val">${fCOP(p.bruto)}</p></div>
        ${isInd && c.ret > 0 ? `<div class="pill bg-red-50"><p class="lbl text-red-700">Ret. fuente</p><p class="val text-red-700">- ${fCOP(c.ret)}</p></div>` : ''}
        ${isInd ? `<div class="pill bg-yellow-50"><p class="lbl text-yellow-700">ICA 5‰</p><p class="val text-yellow-700">- ${fCOP(c.ica)}</p></div>` : ''}
        <div class="pill bg-blue-50"><p class="lbl text-blue-800">SS ${isInd ? 'independ.' : 'empleado'}</p><p class="val text-blue-800">- ${fCOP(c.ss)}</p></div>
        ${c.iva > 0 ? `<div class="pill bg-green-50"><p class="lbl text-green-800">+ IVA 19%</p><p class="val text-green-800">+ ${fCOP(c.iva)}</p></div>` : ''}
        <div class="pill bg-green-50"><p class="lbl text-green-800">Neto estimado</p><p class="val text-green-800">${fCOP(c.neto)}</p></div>`;
}

export function calcLocal(p) {
    const anio     = parseInt(document.getElementById('anio').value) || 2026;
    const tipo     = document.getElementById('tipo-contrato').value;
    const cobraIVA = document.getElementById('cobra-iva').value === '1';
    const pm       = window.APP.parametros[anio] || window.APP.parametros[2026];
    const cfg      = window.APP.retenciones[tipo] || window.APP.retenciones['servicios'];
    const arl      = window.APP.arlTasas;
    const b        = p.bruto;
    const isInd    = p.vinculacion === 'independiente';

    let ret = 0;
    if (isInd) {
        const baseMin    = cfg.uvt_base * pm.uvt;
        const superaBase = !(cfg.uvt_base > 0 && b < baseMin);
        const superaHon  = !(tipo === 'honorarios' && b < 1_000_000);
        if (superaBase && superaHon) ret = Math.round(b * cfg.pct);
    }

    const ica  = isInd ? Math.round(b * 0.005) : 0;
    const iva  = (cobraIVA && isInd) ? Math.round(b * 0.19) : 0;
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

export function renderPersonas() {
    const lista = document.getElementById('lista-personas');
    if (!personas.length) {
        lista.innerHTML = '<p class="text-gray-400 text-center py-8">Sin personas. Haz clic en "Agregar persona".</p>';
        actualizarSelectLiq();
        return;
    }

    lista.innerHTML = '';
    personas.forEach(p => {
        const c     = calcLocal(p);
        const isInd = p.vinculacion === 'independiente';
        const div   = document.createElement('div');
        div.className = 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-3';
        div.innerHTML = `
          <div class="flex justify-between items-center mb-3">
            <p class="font-medium">${p.nombre || 'Nueva persona'}</p>
            <button onclick="eliminarPersona(${p.id})"
                    class="text-red-500 text-sm px-2 py-1 hover:bg-red-50 rounded" aria-label="Eliminar">
              <i class="ti ti-trash"></i>
            </button>
          </div>
          <div class="grid grid-cols-4 gap-2 mb-2">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Nombre</label>
              <input value="${p.nombre}" placeholder="Juan Pérez"
                     class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                     oninput="upd(${p.id},'nombre',this.value)">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Cédula / NIT</label>
              <input value="${p.cedula}" placeholder="1.234.567"
                     class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                     oninput="upd(${p.id},'cedula',this.value)">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Vinculación</label>
              <select class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                      onchange="upd(${p.id},'vinculacion',this.value)">
                <option value="independiente" ${p.vinculacion === 'independiente' ? 'selected' : ''}>Independiente</option>
                <option value="empleado"      ${p.vinculacion === 'empleado'      ? 'selected' : ''}>Empleado directo</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Nivel ARL</label>
              <select class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                      onchange="upd(${p.id},'riesgo',this.value)">
                ${Object.entries(window.APP.arlTasas).map(([r, t]) =>
                  `<option value="${r}" ${p.riesgo === r ? 'selected' : ''}>${r} — ${(t * 100).toFixed(3)}%</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">
                ${isInd ? 'Valor bruto (honorarios)' : 'Salario mensual'} COP
              </label>
              <input type="number" value="${p.bruto}" step="50000" min="0"
                     class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                     oninput="upd(${p.id},'bruto',this.value)">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Actividades / Cargo</label>
              <input value="${p.actividades}" placeholder="Desarrollo backend…"
                     class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                     oninput="upd(${p.id},'actividades',this.value)">
            </div>
          </div>

          <div id="pills-${p.id}" class="flex gap-2 flex-wrap">
            ${buildPills(p, c, isInd)}
          </div>`;
        lista.appendChild(div);
    });

    actualizarSelectLiq();
}