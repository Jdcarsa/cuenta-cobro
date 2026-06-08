<div class="grid grid-cols-2 gap-3">

  <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <p class="sec-label">Empresa pagadora</p>
    <div class="mb-2.5">
      <label class="block text-xs text-gray-500 mb-1" for="emp-nombre">Razón social</label>
      <input id="emp-nombre" type="text" value="Empresa XYZ S.A.S."
             class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
    </div>
    <div class="mb-2.5">
      <label class="block text-xs text-gray-500 mb-1" for="emp-nit">NIT</label>
      <input id="emp-nit" type="text" value="900.123.456-7"
             class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
    </div>
    <div class="mb-2.5">
      <label class="block text-xs text-gray-500 mb-1" for="emp-ciudad">Ciudad</label>
      <input id="emp-ciudad" type="text" value="Bogotá D.C."
             class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
    </div>
    <div>
      <label class="block text-xs text-gray-500 mb-1" for="mes-cobro">Mes de cobro</label>
      <select id="mes-cobro" class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
        @foreach(['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'] as $mes)
          <option {{ $mes === 'Junio' ? 'selected' : '' }}>{{ $mes }}</option>
        @endforeach
      </select>
    </div>
  </div>

  <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <p class="sec-label">Parámetros tributarios</p>
    <div class="mb-2.5">
      <label class="block text-xs text-gray-500 mb-1" for="tipo-contrato">Tipo de contrato</label>
      <select id="tipo-contrato" class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
        <option value="servicios">Prestación de servicios (4%)</option>
        <option value="honorarios">Honorarios (11%)</option>
        <option value="arrendamiento">Arrendamiento (3.5%)</option>
        <option value="compraventa">Compraventa / Suministro (2.5%)</option>
      </select>
    </div>
    <div class="mb-2.5">
      <label class="block text-xs text-gray-500 mb-1" for="cobra-iva">¿Cobra IVA?</label>
      <select id="cobra-iva" class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
        <option value="0">No (no responsable / régimen simple)</option>
        <option value="1">Sí — 19%</option>
      </select>
    </div>
    <div class="mb-3">
      <label class="block text-xs text-gray-500 mb-1" for="anio">Año gravable</label>
      <select id="anio" class="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400">
        @foreach(\App\Services\TributarioService::PARAMETROS as $year => $p)
          <option value="{{ $year }}" {{ $year == 2026 ? 'selected' : '' }}>
            {{ $year }} — UVT ${{ number_format($p['uvt'], 0, ',', '.') }} · SMMLV ${{ number_format($p['smmlv'], 0, ',', '.') }}
          </option>
        @endforeach
      </select>
    </div>
    <button id="btn-calcular" onclick="calcularAPI()"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
      <i class="ti ti-calculator"></i> Calcular con API
    </button>
  </div>

</div>

<div id="resumen-card" class="hidden bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-3">
  <p class="sec-label">Resultado del cálculo</p>
  <div id="resumen-tabla" class="overflow-x-auto"></div>
  <div id="letras-resultado" class="letras-box"></div>
  <div class="flex gap-2 mt-3 flex-wrap">
    <button id="btn-pdf" onclick="guardarYDescargar('pdf')"
            class="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
      <i class="ti ti-file-type-pdf"></i> Guardar y descargar PDF
    </button>
    <button id="btn-csv" onclick="guardarYDescargar('csv')"
            class="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors">
      <i class="ti ti-download"></i> Guardar y descargar CSV
    </button>
  </div>
</div>