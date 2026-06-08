<div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-3">
  <p class="sec-label">Liquidación laboral</p>
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-xs text-gray-500 mb-1" for="liq-persona">Persona a liquidar</label>
      <select id="liq-persona" data-action="renderLiq"
              class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
        <option>— Agrega personas primero —</option>
      </select>
    </div>
    <div>
      <label class="block text-xs text-gray-500 mb-1" for="liq-motivo">Motivo de retiro</label>
      <select id="liq-motivo" data-action="renderLiq"
              class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
        <option value="renuncia">Renuncia voluntaria</option>
        <option value="despido_justa">Despido con justa causa</option>
        <option value="despido_sin">Despido sin justa causa</option>
        <option value="mutuo">Mutuo acuerdo</option>
      </select>
    </div>
    <div>
      <label class="block text-xs text-gray-500 mb-1" for="liq-inicio">Fecha de inicio</label>
      <input id="liq-inicio" type="date" value="2026-01-01" data-action="renderLiq"
             class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
    </div>
    <div>
      <label class="block text-xs text-gray-500 mb-1" for="liq-fin">Fecha de retiro</label>
      <input id="liq-fin" type="date" value="2026-06-30" data-action="renderLiq"
             class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
    </div>
    <div>
      <label class="block text-xs text-gray-500 mb-1" for="liq-dias-prima">Días trabajados en el semestre (prima)</label>
      <input id="liq-dias-prima" type="number" value="180" min="1" max="180" data-action="renderLiq"
             class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
    </div>
    <div>
      <label class="block text-xs text-gray-500 mb-1" for="liq-dias-vac">Días de vacaciones pendientes</label>
      <input id="liq-dias-vac" type="number" value="15" min="0" data-action="renderLiq"
             class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
    </div>
  </div>
  <div class="flex gap-2 mt-3 flex-wrap">
    <button id="btn-liq-api" data-action="calcularLiqAPI"
            class="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
      <i class="ti ti-calculator"></i> Calcular
    </button>
    <button id="btn-liq-pdf" data-action="descargarLiqPDF"
            class="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors">
      <i class="ti ti-file-type-pdf"></i> Descargar PDF
    </button>
  </div>
</div>

<div id="liq-result"></div>

