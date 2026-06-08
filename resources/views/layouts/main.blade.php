<div class="flex items-center gap-3 mb-8">
  <i class="ti ti-file-invoice text-3xl text-gray-400"></i>
  <div>
    <h1 class="text-xl font-semibold">Generador de cuenta de cobro</h1>
    <p class="text-sm text-gray-500 mt-0.5">Normativa tributaria colombiana · Seguridad social · Liquidación</p>
  </div>
</div>

<div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-6 text-xs">
  <span class="api-dot" id="api-dot"></span>
  <span id="api-label" class="text-gray-500 min-w-[110px]">Verificando...</span>
  <input id="api-base" type="text" value="{{ url('') }}"
         class="border-0 bg-transparent text-xs flex-1 p-0 text-gray-400 focus:outline-none" readonly>
  <button data-action="verificarAPI" class="px-2.5 py-1 text-xs border border-gray-200 rounded-md bg-white hover:bg-gray-50">
    <i class="ti ti-refresh"></i> Reconectar
  </button>
</div>

<div class="flex border-b border-gray-200 mb-6" role="tablist">
  <button class="tab-btn active" role="tab" data-action="showTab" data-tab="config">
    <i class="ti ti-settings"></i> Empresa
  </button>
  <button class="tab-btn" role="tab" data-action="showTab" data-tab="personas">
    <i class="ti ti-users"></i> Personas
  </button>
  <button class="tab-btn" role="tab" data-action="showTab" data-tab="liquidacion">
    <i class="ti ti-calculator"></i> Liquidación
  </button>
  <button class="tab-btn" role="tab" data-action="showTab" data-tab="historial">
    <i class="ti ti-history"></i> Historial
  </button>
</div>

<div id="tab-config"      class="tab-pane active" role="tabpanel">@include('partials.config')</div>
<div id="tab-personas"    class="tab-pane"        role="tabpanel">@include('partials.personas')</div>
<div id="tab-liquidacion" class="tab-pane"        role="tabpanel">@include('partials.liquidacion')</div>
<div id="tab-historial"   class="tab-pane"        role="tabpanel">@include('partials.historial')</div>