import { personas } from './state.js';
import { toast, setLoading, fCOP } from './helpers.js';

export function firstError(data) {
    if (data.errors) return Object.values(data.errors).flat()[0];
    return data.message || 'Error del servidor';
}

export function apiFetch(path, method = 'GET', body = null) {
    const opts = {
        method,
        headers: {
            'Accept':       'application/json',
            'X-CSRF-TOKEN': window.APP.csrfToken,
        },
    };
    if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    return fetch(window.APP.baseUrl + path, opts);
}

export function buildPayload() {
    return {
        empresa_nombre: document.getElementById('emp-nombre').value,
        empresa_nit:    document.getElementById('emp-nit').value,
        empresa_ciudad: document.getElementById('emp-ciudad').value,
        mes_cobro:      document.getElementById('mes-cobro').value,
        anio:           parseInt(document.getElementById('anio').value),
        tipo_contrato:  document.getElementById('tipo-contrato').value,
        cobra_iva:      document.getElementById('cobra-iva').value === '1',
        personas: personas.map(p => ({
            nombre:           p.nombre,
            cedula:           p.cedula,
            vinculacion:      p.vinculacion,
            nivel_riesgo_arl: p.riesgo,
            valor_bruto:      p.bruto,
            actividades:      p.actividades,
        })),
    };
}

export async function verificarAPI() {
    const dot = document.getElementById('api-dot');
    const lbl = document.getElementById('api-label');
    lbl.textContent = 'Verificando...'; dot.style.background = '#ccc';
    try {
        const r = await apiFetch('/api/cuentas-cobro');
        dot.style.background = r.ok ? '#1a7a4a' : '#c0392b';
        lbl.textContent = r.ok ? 'API conectada' : 'Error ' + r.status;
    } catch {
        dot.style.background = '#c0392b';
        lbl.textContent = 'Sin conexión';
    }
}

export async function calcularAPI() {
    if (!personas.length) { toast('Agrega al menos una persona.', 'err'); return; }
    setLoading('btn-calcular', true);
    try {
        const r    = await apiFetch('/api/cuentas-cobro/calcular', 'POST', buildPayload());
        const data = await r.json();
        if (!r.ok) throw new Error(firstError(data));
        renderResumen(data);
        document.getElementById('resumen-card').classList.remove('hidden');
        toast('Cálculo completado.');
    } catch(e) { toast(e.message, 'err'); }
    finally { setLoading('btn-calcular', false); }
}

export function renderResumen(data) {
    const cobraIVA = document.getElementById('cobra-iva').value === '1';
    const filas = data.personas.map(p => `
        <tr>
          <td class="text-left">${p.nombre || '—'}<br><small class="text-gray-400">${p.cedula || ''}</small></td>
          <td class="text-left"><span class="badge ${p.vinculacion === 'independiente' ? 'badge-ind' : 'badge-emp'}">${p.vinculacion === 'independiente' ? 'Independ.' : 'Empleado'}</span></td>
          <td>${fCOP(p.valor_bruto)}</td>
          <td class="text-red-600">${p.retencion_fuente > 0 ? '- ' + fCOP(p.retencion_fuente) : '—'}</td>
          <td class="text-yellow-700">${p.ica > 0 ? '- ' + fCOP(p.ica) : '—'}</td>
          <td class="text-blue-800">- ${fCOP(p.ss_trabajador)}</td>
          ${cobraIVA ? `<td class="text-green-700">${p.iva > 0 ? '+ ' + fCOP(p.iva) : '—'}</td>` : ''}
          <td class="font-semibold text-green-700">${fCOP(p.valor_neto)}</td>
        </tr>`).join('');

    document.getElementById('resumen-tabla').innerHTML = `
        <table class="w-full text-sm border-collapse">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 border-b">Persona</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 border-b">Tipo</th>
              <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 border-b">Bruto</th>
              <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 border-b">Ret. fuente</th>
              <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 border-b">ICA</th>
              <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 border-b">SS trabajador</th>
              ${cobraIVA ? '<th class="text-right px-3 py-2 text-xs font-medium text-gray-500 border-b">IVA</th>' : ''}
              <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 border-b">Neto</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
          <tfoot>
            <tr class="bg-gray-50 font-semibold border-t-2 border-gray-300">
              <td colspan="2" class="text-left px-3 py-2">Total</td>
              <td class="text-right px-3 py-2">${fCOP(data.total_bruto)}</td>
              <td colspan="${cobraIVA ? 3 : 2}"></td>
              ${cobraIVA ? '<td></td>' : ''}
              <td class="text-right px-3 py-2 text-green-700">${fCOP(data.total_neto)}</td>
            </tr>
          </tfoot>
        </table>`;

    document.getElementById('letras-resultado').innerHTML =
        `<strong>Total neto:</strong> ${fCOP(data.total_neto)}`;
}

export async function guardarYDescargar(fmt) {
    if (!personas.length) { toast('Agrega personas primero.', 'err'); return; }
    setLoading('btn-' + fmt, true);
    try {
        const r    = await apiFetch('/api/cuentas-cobro', 'POST', buildPayload());
        const data = await r.json();
        if (!r.ok) throw new Error(firstError(data));
        toast(`Guardado como #${data.id}. Descargando ${fmt.toUpperCase()}...`);
        window.open(window.APP.baseUrl + `/api/cuentas-cobro/${data.id}/${fmt}`, '_blank');
    } catch(e) { toast(e.message, 'err'); }
    finally { setLoading('btn-' + fmt, false); }
}

export async function cargarHistorial() {
    const cont = document.getElementById('historial-content');
    cont.innerHTML = '<p class="text-gray-400 text-center py-8"><span class="spinner"></span></p>';
    try {
        const r    = await apiFetch('/api/cuentas-cobro');
        const data = await r.json();
        if (!r.ok) throw new Error('Error al cargar');
        const items = data.data || [];
        if (!items.length) {
            cont.innerHTML = '<p class="text-gray-400 text-center py-8">No hay cuentas guardadas aún.</p>';
            return;
        }
        const filas = items.map(c => `
            <tr>
              <td class="text-left px-3 py-2">#${c.id}</td>
              <td class="text-left px-3 py-2">${c.empresa_nombre}</td>
              <td class="text-left px-3 py-2">${c.mes_cobro} ${c.anio}</td>
              <td class="text-left px-3 py-2">${c.tipo_contrato}</td>
              <td class="text-right px-3 py-2">${fCOP(c.total_bruto)}</td>
              <td class="text-right px-3 py-2 text-green-700 font-medium">${fCOP(c.total_neto)}</td>
              <td class="text-center px-3 py-2">
                <button onclick="window.open('${window.APP.baseUrl}/api/cuentas-cobro/${c.id}/pdf','_blank')"
                        class="px-2 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50 mr-1">
                  <i class="ti ti-file-type-pdf"></i>
                </button>
                <button onclick="window.open('${window.APP.baseUrl}/api/cuentas-cobro/${c.id}/csv','_blank')"
                        class="px-2 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50">
                  <i class="ti ti-download"></i>
                </button>
              </td>
            </tr>`).join('');

        cont.innerHTML = `
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse bg-white border border-gray-200 rounded-xl overflow-hidden">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 border-b">ID</th>
                    <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 border-b">Empresa</th>
                    <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 border-b">Período</th>
                    <th class="text-left px-3 py-2 text-xs font-medium text-gray-500 border-b">Tipo</th>
                    <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 border-b">Bruto</th>
                    <th class="text-right px-3 py-2 text-xs font-medium text-gray-500 border-b">Neto</th>
                    <th class="text-center px-3 py-2 text-xs font-medium text-gray-500 border-b">Descargar</th>
                  </tr>
                </thead>
                <tbody>${filas}</tbody>
              </table>
            </div>
            <p class="text-xs text-gray-400 mt-2">${data.total || items.length} registros totales.</p>`;
    } catch(e) {
        cont.innerHTML = `<p class="text-red-500 text-center py-8"><i class="ti ti-alert-circle"></i> ${e.message}</p>`;
    }
}

