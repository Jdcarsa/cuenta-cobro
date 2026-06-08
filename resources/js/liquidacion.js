function actualizarSelectLiq() {
    const sel = document.getElementById('liq-persona');
    const cur = sel.value;
    sel.innerHTML = !personas.length
        ? '<option>— Agrega personas primero —</option>'
        : personas.map(p =>
            `<option value="${p.id}" ${p.id == cur ? 'selected' : ''}>${p.nombre || 'Persona ' + p.id}</option>`
        ).join('');
}

function buildLiqPayload() {
    const pid = parseInt(document.getElementById('liq-persona').value);
    const p = personas.find(x => x.id === pid);
    if (!p) return null;
    return {
        empresa_nombre: document.getElementById('emp-nombre').value,
        empresa_nit: document.getElementById('emp-nit').value,
        empresa_ciudad: document.getElementById('emp-ciudad').value,
        anio: parseInt(document.getElementById('anio').value) || 2026,
        personas: [{
            nombre: p.nombre,
            valor_bruto: p.bruto,
            fecha_inicio: document.getElementById('liq-inicio').value,
            fecha_fin: document.getElementById('liq-fin').value,
            motivo_retiro: document.getElementById('liq-motivo').value,
            dias_prima: parseInt(document.getElementById('liq-dias-prima').value) || 180,
            dias_vacaciones: parseInt(document.getElementById('liq-dias-vac').value) || 0,
        }],
    };
}

// Preview local instantáneo
function renderLiq() {
    const pid = parseInt(document.getElementById('liq-persona').value);
    const p = personas.find(x => x.id === pid);
    const res = document.getElementById('liq-result');
    if (!p) { res.innerHTML = ''; return; }

    const anio = parseInt(document.getElementById('anio').value) || 2026;
    const pm = window.APP.parametros[anio] || window.APP.parametros[2026];
    const inicio = new Date(document.getElementById('liq-inicio').value);
    const fin = new Date(document.getElementById('liq-fin').value);
    const motivo = document.getElementById('liq-motivo').value;
    const diasPrima = parseInt(document.getElementById('liq-dias-prima').value) || 0;
    const diasVac = parseInt(document.getElementById('liq-dias-vac').value) || 0;

    const dias = Math.max(0, Math.floor((fin - inicio) / 86_400_000));
    const meses = dias / 30;
    const sal = p.bruto;
    const salD = sal / 30;

    const prima = Math.round(sal * diasPrima / 360);
    const ces = Math.round(sal * dias / 360);
    const intC = Math.round(ces * 0.12 * (dias / 360));
    const vac = Math.round(salD * diasVac);

    let ind = 0;
    if (motivo === 'despido_sin') {
        if (sal <= pm.smmlv * 10)
            ind = meses <= 12 ? Math.round(salD * 30) : Math.round(salD * 30 + salD * 20 * Math.max(0, meses - 12));
        else
            ind = meses <= 12 ? Math.round(salD * 20) : Math.round(salD * 20 + salD * 15 * Math.max(0, meses - 12));
    }

    const total = prima + ces + intC + vac + ind;

    const frow = (lbl, val, nota, red = false) => `
    <tr>
      <td style="${red ? 'color:var(--red);' : ''}">${lbl}</td>
      <td style="font-weight:500;${red ? 'color:var(--red);' : ''}">${fCOP(val)}</td>
      <td style="font-size:12px;color:var(--muted);">${nota}</td>
    </tr>`;

    res.innerHTML = `
    <div class="card">
      <p class="sec-label">Previsualización local — ${p.nombre}</p>
      <p style="font-size:12px;color:var(--muted);margin-bottom:10px;">
        ${inicio.toLocaleDateString('es-CO')} → ${fin.toLocaleDateString('es-CO')}
        · ${dias} días · ${motivo.replace('_', ' ')}
      </p>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Concepto</th>
            <th>Valor</th>
            <th style="text-align:left;">Fórmula</th>
          </tr>
        </thead>
        <tbody>
          ${frow('Prima de servicios', prima, 'Salario × ' + diasPrima + ' días / 360')}
          ${frow('Cesantías', ces, 'Salario × ' + dias + ' días / 360')}
          ${frow('Intereses sobre cesantías', intC, 'Cesantías × 12% × (días/360)')}
          ${frow('Vacaciones pendientes', vac, '(Salario/30) × ' + diasVac + ' días')}
          ${motivo === 'despido_sin' ? frow('Indemnización sin justa causa', ind, 'Art. 64 CST', true) : ''}
        </tbody>
        <tfoot>
          <tr class="tfoot-row">
            <td>Total liquidación</td>
            <td style="color:var(--green);">${fCOP(total)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

async function calcularLiqAPI() {
    const payload = buildLiqPayload();
    if (!payload) { toast('Selecciona una persona.', 'err'); return; }
    setLoading('btn-liq-api', true);
    try {
        const r = await apiFetch('/api/liquidacion/calcular', 'POST', payload);
        const data = await r.json();
        if (!r.ok) throw new Error(firstError(data));
        const liq = data.liquidaciones[0];
        const res = document.getElementById('liq-result');
        res.innerHTML = `
      <div class="card">
        <p class="sec-label">Resultado API — ${liq.nombre}</p>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Concepto</th>
              <th>Valor</th>
              <th style="text-align:left;">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Prima de servicios</td>      <td style="font-weight:500;">${fCOP(liq.prima)}</td>        <td style="font-size:12px;color:var(--muted);">${liq.dias_trabajados} días</td></tr>
            <tr><td>Cesantías</td>               <td style="font-weight:500;">${fCOP(liq.cesantias)}</td>    <td></td></tr>
            <tr><td>Intereses cesantías</td>     <td style="font-weight:500;">${fCOP(liq.intereses_ces)}</td><td></td></tr>
            <tr><td>Vacaciones pendientes</td>   <td style="font-weight:500;">${fCOP(liq.vacaciones)}</td>   <td></td></tr>
            ${liq.indemnizacion > 0 ? `
            <tr>
              <td style="color:var(--red);">Indemnización</td>
              <td style="font-weight:500;color:var(--red);">${fCOP(liq.indemnizacion)}</td>
              <td style="font-size:12px;color:var(--muted);">Art. 64 CST</td>
            </tr>` : ''}
          </tbody>
          <tfoot>
            <tr class="tfoot-row">
              <td>Total</td>
              <td style="color:var(--green);">${fCOP(liq.total)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>`;
        toast('Liquidación calculada.');
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading('btn-liq-api', false); }
}

async function descargarLiqPDF() {
    const payload = buildLiqPayload();
    if (!payload) { toast('Selecciona una persona.', 'err'); return; }
    setLoading('btn-liq-pdf', true);
    try {
        const r = await apiFetch('/api/liquidacion/pdf', 'POST', payload);
        if (!r.ok) throw new Error('Error al generar PDF');
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'liquidacion.pdf'; a.click();
        URL.revokeObjectURL(url);
        toast('PDF de liquidación descargado.');
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading('btn-liq-pdf', false); }
}