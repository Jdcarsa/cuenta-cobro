<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1a1a1a; padding: 40px; }
    .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
    .header p  { font-size: 10px; color: #555; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 10px; }
    .meta div { line-height: 1.8; }
    .meta strong { display: block; font-size: 11px; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f0f0f0; text-align: left; padding: 6px 8px; font-size: 10px; border: 0.5px solid #ccc; }
    td { padding: 6px 8px; border: 0.5px solid #e0e0e0; font-size: 10px; vertical-align: top; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    tr.total td { background: #f8f8f8; font-weight: bold; border-top: 1.5px solid #333; }
    .letras { margin: 16px 0; padding: 10px 14px; background: #f9f9f9; border-left: 3px solid #333; font-size: 10px; }
    .firma { margin-top: 48px; display: flex; justify-content: space-between; }
    .firma-bloque { text-align: center; width: 45%; }
    .firma-linea { border-top: 1px solid #333; padding-top: 6px; margin-top: 40px; font-size: 10px; }
    .negativo { color: #c0392b; }
    .positivo { color: #1a7a4a; }
    .tag { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; }
    .tag-ind { background: #e8f4fd; color: #1a5276; }
    .tag-emp { background: #e9f7ef; color: #1a5c30; }
  </style>
</head>
<body>

<div class="header">
  <h1>Cuenta de cobro — {{ $cuenta->mes_cobro }} {{ $cuenta->anio }}</h1>
  <p>Expedida en {{ $cuenta->empresa_ciudad }}, el {{ $fecha }}</p>
</div>

<div class="meta">
  <div>
    <strong>Empresa pagadora</strong>
    {{ $cuenta->empresa_nombre }}<br>
    NIT: {{ $cuenta->empresa_nit }}<br>
    Ciudad: {{ $cuenta->empresa_ciudad }}
  </div>
  <div>
    <strong>Parámetros</strong>
    Tipo: {{ ucfirst($cuenta->tipo_contrato) }}<br>
    IVA: {{ $cuenta->cobra_iva ? 'Sí — 19%' : 'No aplica' }}<br>
    Período: {{ $cuenta->mes_cobro }} {{ $cuenta->anio }}
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Nombre / Cédula</th>
      <th>Tipo</th>
      <th>Actividades</th>
      <th class="num">Bruto</th>
      <th class="num">Ret. fuente</th>
      <th class="num">ICA</th>
      <th class="num">SS trabajador</th>
      @if($cuenta->cobra_iva)
      <th class="num">IVA 19%</th>
      @endif
      <th class="num">Neto</th>
    </tr>
  </thead>
  <tbody>
    @foreach($personas as $p)
    <tr>
      <td>
        {{ $p->nombre }}<br>
        <span style="color:#666;">{{ $p->cedula }}</span>
      </td>
      <td>
        <span class="tag {{ $p->vinculacion === 'independiente' ? 'tag-ind' : 'tag-emp' }}">
          {{ $p->vinculacion === 'independiente' ? 'Independ.' : 'Empleado' }}
        </span>
        <br><span style="color:#666;">ARL {{ $p->nivel_riesgo_arl }}</span>
      </td>
      <td style="max-width:120px;">{{ $p->actividades }}</td>
      <td class="num">$ {{ number_format($p->valor_bruto, 0, ',', '.') }}</td>
      <td class="num negativo">{{ $p->retencion_fuente > 0 ? '- $ ' . number_format($p->retencion_fuente, 0, ',', '.') : '—' }}</td>
      <td class="num negativo">{{ $p->ica > 0 ? '- $ ' . number_format($p->ica, 0, ',', '.') : '—' }}</td>
      <td class="num negativo">{{ $p->ss_trabajador > 0 ? '- $ ' . number_format($p->ss_trabajador, 0, ',', '.') : '—' }}</td>
      @if($cuenta->cobra_iva)
      <td class="num positivo">{{ $p->iva > 0 ? '+ $ ' . number_format($p->iva, 0, ',', '.') : '—' }}</td>
      @endif
      <td class="num positivo" style="font-weight:bold;">$ {{ number_format($p->valor_neto, 0, ',', '.') }}</td>
    </tr>
    @endforeach
    <tr class="total">
      <td colspan="{{ $cuenta->cobra_iva ? 7 : 6 }}">Total</td>
      <td class="num positivo">$ {{ number_format($cuenta->total_neto, 0, ',', '.') }}</td>
    </tr>
  </tbody>
</table>

<div class="letras">
  <strong>Son:</strong> {{ $enLetras }}
</div>

<div class="firma">
  <div class="firma-bloque">
    <div class="firma-linea">
      Firma del pagador<br>{{ $cuenta->empresa_nombre }}<br>NIT: {{ $cuenta->empresa_nit }}
    </div>
  </div>
  <div class="firma-bloque">
    <div class="firma-linea">
      Firma del prestador de servicios<br>&nbsp;
    </div>
  </div>
</div>

</body>
</html>