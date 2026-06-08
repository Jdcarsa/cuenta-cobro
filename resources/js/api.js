function apiFetch(path, method = 'GET', body = null) {
    const opts = {
        method,
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': window.APP.csrfToken,
        },
    };
    if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    return fetch(window.APP.baseUrl + path, opts);
}

function firstError(data) {
    if (data.errors) return Object.values(data.errors).flat()[0];
    return data.message || 'Error del servidor';
}

function buildPayload() {
    return {
        empresa_nombre: document.getElementById('emp-nombre').value,
        empresa_nit: document.getElementById('emp-nit').value,
        empresa_ciudad: document.getElementById('emp-ciudad').value,
        mes_cobro: document.getElementById('mes-cobro').value,
        anio: parseInt(document.getElementById('anio').value),
        tipo_contrato: document.getElementById('tipo-contrato').value,
        cobra_iva: document.getElementById('cobra-iva').value === '1',
        personas: personas.map(p => ({
            nombre: p.nombre,
            cedula: p.cedula,
            vinculacion: p.vinculacion,
            nivel_riesgo_arl: p.riesgo,
            valor_bruto: p.bruto,
            actividades: p.actividades,
        })),
    };
}

async function verificarAPI() {
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

async function calcularAPI() {
    if (!personas.length) { toast('Agrega al menos una persona.', 'err'); return; }
    setLoading('btn-calcular', true);
    try {
        const r = await apiFetch('/api/cuentas-cobro/calcular', 'POST', buildPayload());
        const data = await r.json();
        if (!r.ok) throw new Error(firstError(data));
        renderResumen(data);
        document.getElementById('resumen-card').style.display = 'block';
        toast('Cálculo completado.');
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading('btn-calcular', false); }
}

function renderResumen(data) {
    const cobraIVA = document.getElementById('cobra-iva').value === '1';
    const filas = data.personas.map(p => `
    <tr>
      <td>${p.nombre || '—'}<br><small style="color:var(--muted);">${p.cedula || ''}</small></td>
      <td style="text-align:left;">
        <span class="badge ${p.vinculacion === 'independiente' ? 'badge-ind' : 'badge-emp'}">
          ${p.vinculacion === 'independiente' ? 'Independ.' : 'Empleado'}
        </span>
      </td>
      <td>${fCOP(p.valor_bruto)}</td>
      <td style="color:var(--red);">${p.retencion_fuente > 0 ? '- ' + fCOP(p.retencion_fuente) : '—'}</td>
      <td style="color:var(--yellow);">${p.ica > 0 ? '- ' + fCOP(p.ica) : '—'}</td>
      <td style="color:var(--blue);">- ${fCOP(p.ss_trabajador)}</td>
      ${cobraIVA ? `<td style="color:var(--green);">${p.iva > 0 ? '+ ' + fCOP(p.iva) : '—'}</td>` : ''}
      <td style="font-weight:600;color:var(--green);">${fCOP(p.valor_neto)}</td>
    </tr>`).join('');

    document.getElementById('resumen-tabla').innerHTML = `
    <table>
      <thead>
        <tr>
          <th style="text-align:left;">Persona</th>
          <th style="text-align:left;">Tipo</th>
          <th>Bruto</th><th>Ret. fuente</th><th>ICA</th><th>SS trabajador</th>
          ${cobraIVA ? '<th>IVA</th>' : ''}
          <th>Neto</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr class="tfoot-row">
          <td colspan="2">Total</td>
          <td>${fCOP(data.total_bruto)}</td>
          <td colspan="${cobraIVA ? 3 : 2}"></td>
          ${cobraIVA ? '<td></td>' : ''}
          <td style="color:var(--green);">${fCOP(data.total_neto)}</td>
        </tr>
      </tfoot>
    </table>`;

    document.getElementById('letras-resultado').innerHTML =
        `<strong>Total neto:</strong> ${fCOP(data.total_neto)}`;
}

async function guardarYDescargar(fmt) {
    if (!personas.length) { toast('Agrega personas primero.', 'err'); return; }
    setLoading('btn-' + fmt, true);
    try {
        const r = await apiFetch('/api/cuentas-cobro', 'POST', buildPayload());
        const data = await r.json();
        if (!r.ok) throw new Error(firstError(data));
        toast(`Guardado como #${data.id}. Descargando ${fmt.toUpperCase()}...`);
        window.open(window.APP.baseUrl + `/api/cuentas-cobro/${data.id}/${fmt}`, '_blank');
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading('btn-' + fmt, false); }
}

async function cargarHistorial() {
    const cont = document.getElementById('historial-content');
    cont.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem 0;"><span class="spinner"></span></p>';
    try {
        const r = await apiFetch('/api/cuentas-cobro');
        const data = await r.json();
        if (!r.ok) throw new Error('Error al cargar');
        const items = data.data || [];
        if (!items.length) {
            cont.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem 0;">No hay cuentas guardadas aún.</p>';
            return;
        }
        const filas = items.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td>${c.empresa_nombre}</td>
        <td>${c.mes_cobro} ${c.anio}</td>
        <td>${c.tipo_contrato}</td>
        <td>${fCOP(c.total_bruto)}</td>
        <td style="color:var(--green);font-weight:500;">${fCOP(c.total_neto)}</td>
        <td style="text-align:center;">
          <button onclick="window.open('${window.APP.baseUrl}/api/cuentas-cobro/${c.id}/pdf','_blank')" style="padding:4px 8px;margin-right:4px;" title="PDF">
            <i class="ti ti-file-type-pdf" aria-hidden="true"></i>
          </button>
          <button onclick="window.open('${window.APP.baseUrl}/api/cuentas-cobro/${c.id}/csv','_blank')" style="padding:4px 8px;" title="CSV">
            <i class="ti ti-download" aria-hidden="true"></i>
          </button>
        </td>
      </tr>`).join('');
        cont.innerHTML = `
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">ID</th>
              <th style="text-align:left;">Empresa</th>
              <th style="text-align:left;">Período</th>
              <th style="text-align:left;">Tipo</th>
              <th>Bruto</th><th>Neto</th>
              <th style="text-align:center;">Descargar</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
      <p style="font-size:11px;color:var(--muted);margin-top:8px;">${data.total || items.length} registros totales.</p>`;
    } catch (e) {
        cont.innerHTML = `<p style="color:var(--red);text-align:center;padding:2rem 0;">
      <i class="ti ti-alert-circle" aria-hidden="true"></i> ${e.message}
    </p>`;
    }
}