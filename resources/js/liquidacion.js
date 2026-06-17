import { personas, actualizarSelectLiq } from "./state.js";
import { toast, setLoading, fCOP } from "./helpers.js";
import { apiFetch, firstError } from "./api.js";

export function buildLiqPayload() {
    const pid = parseInt(document.getElementById("liq-persona").value);
    const p = personas.find((x) => x.id === pid);
    if (!p) return null;
    return {
        empresa_nombre: document.getElementById("emp-nombre").value,
        empresa_nit: document.getElementById("emp-nit").value,
        empresa_ciudad: document.getElementById("emp-ciudad").value,
        anio: parseInt(document.getElementById("anio").value) || 2026,
        personas: [
            {
                nombre: p.nombre,
                valor_bruto: p.bruto,
                fecha_inicio: document.getElementById("liq-inicio").value,
                fecha_fin: document.getElementById("liq-fin").value,
                motivo_retiro: document.getElementById("liq-motivo").value,
                dias_prima:
                    parseInt(document.getElementById("liq-dias-prima").value) ||
                    180,
                dias_vacaciones:
                    parseInt(document.getElementById("liq-dias-vac").value) ||
                    0,
            },
        ],
    };
}

export function renderLiq() {
    const pid = parseInt(document.getElementById("liq-persona").value);
    const p = personas.find((x) => x.id === pid);
    const res = document.getElementById("liq-result");
    if (!p) {
        res.innerHTML = "";
        return;
    }

    const anio = parseInt(document.getElementById("anio").value) || 2026;
    const pm = window.APP.parametros[anio] || window.APP.parametros[2026];
    const inicio = new Date(document.getElementById("liq-inicio").value);
    const fin = new Date(document.getElementById("liq-fin").value);
    const motivo = document.getElementById("liq-motivo").value;
    const diasPrima =
        parseInt(document.getElementById("liq-dias-prima").value) || 0;
    const diasVac =
        parseInt(document.getElementById("liq-dias-vac").value) || 0;

    const dias = Math.max(0, Math.floor((fin - inicio) / 86_400_000));
    const meses = dias / 30;
    const sal = p.bruto;
    const salD = sal / 30;

    const prima = Math.round((sal * diasPrima) / 360);
    const ces = Math.round((sal * dias) / 360);
    const intC = Math.round(ces * 0.12 * (dias / 360));
    const vac = Math.round(salD * diasVac);

    let ind = 0;
    if (motivo === "despido_sin") {
        if (sal <= pm.smmlv * 10)
            ind =
                meses <= 12
                    ? Math.round(salD * 30)
                    : Math.round(
                        salD * 30 + salD * 20 * Math.max(0, meses - 12),
                    );
        else
            ind =
                meses <= 12
                    ? Math.round(salD * 20)
                    : Math.round(
                        salD * 20 + salD * 15 * Math.max(0, meses - 12),
                    );
    }

    const total = prima + ces + intC + vac + ind;

    const motivoLabel =
        {
            renuncia: "Renuncia voluntaria",
            despido_justa: "Despido con justa causa",
            despido_sin: "Despido sin justa causa",
            mutuo: "Mutuo acuerdo",
        }[motivo] || motivo;

    const fila = (icono, concepto, valor, formula, rojo = false) => `
      <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                  <i class="ti ${icono} text-base ${rojo ? "text-red-400" : "text-gray-400"}"></i>
                  <span class="text-sm font-medium ${rojo ? "text-red-600" : "text-gray-800"}">${concepto}</span>
              </div>
              <p class="text-xs text-gray-400 mt-0.5 ml-6">${formula}</p>
          </td>
          <td class="py-3 px-4 text-right">
              <span class="text-sm font-semibold ${rojo ? "text-red-600" : "text-gray-900"}">${fCOP(valor)}</span>
          </td>
      </tr>`;

    res.innerHTML = `
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-3">

            <div class="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
                <div>
                    <p class="font-semibold text-sm">Liquidación — ${p.nombre}</p>
                    <p class="text-xs text-gray-400 mt-0.5">${motivoLabel}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-400">Período</p>
                    <p class="text-xs font-medium">
                        ${inicio.toLocaleDateString("es-CO")} → ${fin.toLocaleDateString("es-CO")}
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                <div class="px-4 py-2.5 text-center">
                    <p class="text-xs text-gray-400">Días trabajados</p>
                    <p class="text-base font-semibold text-gray-900">${dias}</p>
                </div>
                <div class="px-4 py-2.5 text-center">
                    <p class="text-xs text-gray-400">Meses</p>
                    <p class="text-base font-semibold text-gray-900">${meses.toFixed(1)}</p>
                </div>
                <div class="px-4 py-2.5 text-center">
                    <p class="text-xs text-gray-400">Salario base</p>
                    <p class="text-base font-semibold text-gray-900">${fCOP(sal)}</p>
                </div>
            </div>

            <table class="w-full">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2.5">
                            Concepto / Fórmula
                        </th>
                        <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2.5">
                            Valor
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${fila("ti-file-text", "Prima de servicios", prima, `Salario × ${diasPrima} días / 360`)}
                    ${fila("ti-pig-money", "Cesantías", ces, `Salario × ${dias} días / 360`)}
                    ${fila("ti-trending-up", "Intereses sobre cesantías", intC, `Cesantías × 12% × (${dias} días / 360)`)}
                    ${fila("ti-beach", "Vacaciones pendientes", vac, `(Salario / 30) × ${diasVac} días`)}
                    ${motivo === "despido_sin" ? fila("ti-gavel", "Indemnización sin justa causa", ind, "Art. 64 CST — según salario y tiempo servido", true) : ""}
                </tbody>
            </table>

            <div class="border-t-2 border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div>
                    <p class="text-sm font-semibold text-gray-900">Total liquidación</p>
                    <p class="text-xs text-gray-400 mt-0.5">Previsualización local · confirmar con la API</p>
                </div>
                <div class="text-right">
                    <p class="text-xl font-bold text-green-700">${fCOP(total)}</p>
                </div>
            </div>

        </div>`;
}

export async function calcularLiqAPI() {
    const payload = buildLiqPayload();
    if (!payload) {
        toast("Selecciona una persona.", "err");
        return;
    }
    setLoading("btn-liq-api", true);
    try {
        const r = await apiFetch("/api/liquidacion/calcular", "POST", payload);
        const data = await r.json();
        if (!r.ok) throw new Error(firstError(data));
        const liq = data.liquidaciones[0];
        const res = document.getElementById("liq-result");
        res.innerHTML = `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-3">

    <div class="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div>
        <p class="font-semibold text-sm">Resultado API — ${liq.nombre}</p>
        <p class="text-xs text-gray-400 mt-0.5">Cálculo oficial del backend</p>
        </div>
        <span class="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">✓ Verificado</span>
    </div>

    <div class="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div class="px-4 py-2.5 text-center">
        <p class="text-xs text-gray-400">Días trabajados</p>
        <p class="text-base font-semibold text-gray-900">${liq.dias_trabajados}</p>
        </div>
        <div class="px-4 py-2.5 text-center">
        <p class="text-xs text-gray-400">Meses</p>
        <p class="text-base font-semibold text-gray-900">${liq.meses}</p>
        </div>
        <div class="px-4 py-2.5 text-center">
        <p class="text-xs text-gray-400">Total a pagar</p>
        <p class="text-base font-semibold text-green-700">${fCOP(liq.total)}</p>
        </div>
    </div>

    <table class="w-full">
        <thead>
        <tr class="bg-gray-50 border-b border-gray-200">
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2.5">Concepto</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2.5">Valor</th>
        </tr>
        </thead>
        <tbody>
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-3 px-4">
            <div class="flex items-center gap-2">
                <i class="ti ti-file-text text-gray-400"></i>
                <span class="text-sm font-medium text-gray-800">Prima de servicios</span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5 ml-6">${liq.dias_trabajados} días trabajados</p>
            </td>
            <td class="py-3 px-4 text-right font-semibold text-gray-900">${fCOP(liq.prima)}</td>
        </tr>
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-3 px-4">
            <div class="flex items-center gap-2">
                <i class="ti ti-pig-money text-gray-400"></i>
                <span class="text-sm font-medium text-gray-800">Cesantías</span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5 ml-6">Salario × ${liq.dias_trabajados} días / 360</p>
            </td>
            <td class="py-3 px-4 text-right font-semibold text-gray-900">${fCOP(liq.cesantias)}</td>
        </tr>
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-3 px-4">
            <div class="flex items-center gap-2">
                <i class="ti ti-trending-up text-gray-400"></i>
                <span class="text-sm font-medium text-gray-800">Intereses sobre cesantías</span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5 ml-6">Cesantías × 12% × (días / 360)</p>
            </td>
            <td class="py-3 px-4 text-right font-semibold text-gray-900">${fCOP(liq.intereses_ces)}</td>
        </tr>
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-3 px-4">
            <div class="flex items-center gap-2">
                <i class="ti ti-beach text-gray-400"></i>
                <span class="text-sm font-medium text-gray-800">Vacaciones pendientes</span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5 ml-6">(Salario / 30) × días pendientes</p>
            </td>
            <td class="py-3 px-4 text-right font-semibold text-gray-900">${fCOP(liq.vacaciones)}</td>
        </tr>
        ${liq.indemnizacion > 0
                    ? `
        <tr class="border-b border-gray-100 hover:bg-red-50">
            <td class="py-3 px-4">
            <div class="flex items-center gap-2">
                <i class="ti ti-gavel text-red-400"></i>
                <span class="text-sm font-medium text-red-600">Indemnización sin justa causa</span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5 ml-6">Art. 64 CST</p>
            </td>
            <td class="py-3 px-4 text-right font-semibold text-red-600">${fCOP(liq.indemnizacion)}</td>
        </tr>`
                    : ""
                }
        </tbody>
    </table>

    <div class="border-t-2 border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
        <p class="text-sm font-semibold text-gray-900">Total liquidación</p>
        <p class="text-xl font-bold text-green-700">${fCOP(liq.total)}</p>
    </div>

    </div>`;
        toast("Liquidación calculada.");
    } catch (e) {
        toast(e.message, "err");
    } finally {
        setLoading("btn-liq-api", false);
    }
}

export async function descargarLiqPDF() {
    const payload = buildLiqPayload();
    if (!payload) {
        toast("Selecciona una persona.", "err");
        return;
    }
    setLoading("btn-liq-pdf", true);
    try {
        const r = await apiFetch("/api/liquidacion/pdf", "POST", payload);
        if (!r.ok) throw new Error("Error al generar PDF");
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "liquidacion.pdf";
        a.click();
        URL.revokeObjectURL(url);
        toast("PDF de liquidación descargado.");
    } catch (e) {
        toast(e.message, "err");
    } finally {
        setLoading("btn-liq-pdf", false);
    }
}
