<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: DejaVu Sans, sans-serif; font-size:11px; color:#1a1a1a; padding:40px; }
    .header { border-bottom:2px solid #1a1a1a; padding-bottom:12px; margin-bottom:20px; }
    .header h1 { font-size:16px; font-weight:bold; margin-bottom:4px; }
    .header p  { font-size:10px; color:#555; }
    .meta { display:flex; justify-content:space-between; margin-bottom:20px; font-size:10px; line-height:1.8; }
    .meta strong { display:block; font-size:11px; margin-bottom:2px; }
    .persona-block { margin-bottom:20px; page-break-inside:avoid; }
    .persona-header { background:#f0f0f0; padding:7px 10px; font-weight:bold; font-size:11px;
                      border-left:3px solid #333; margin-bottom:0; }
    table { width:100%; border-collapse:collapse; }
    th { background:#f8f8f8; text-align:left; padding:5px 8px; font-size:10px; border:0.5px solid #ddd; }
    th.num { text-align:right; }
    td { padding:5px 8px; border:0.5px solid #e8e8e8; font-size:10px; }
    td.num { text-align:right; font-variant-numeric:tabular-nums; }
    td.formula { font-size:9px; color:#666; }
    tr.subtotal td { background:#f8f8f8; font-weight:bold; border-top:1.5px solid #999; }
    .gran-total { margin-top:16px; padding:12px 16px; background:#f0f0f0;
                  border-left:4px solid #1a1a1a; font-size:12px; }
    .letras { margin-top:10px; padding:10px 14px; background:#fafafa;
              border-left:3px solid #333; font-size:10px; }
    .firma { margin-top:48px; display:flex; justify-content:space-between; }
    .firma-bloque { text-align:center; width:45%; }
    .firma-linea { border-top:1px solid #333; padding-top:6px; margin-top:40px; font-size:10px; }
    .ind { color:#1a5276; } .emp { color:#1a5c30; }
    .negativo { color:#c0392b; }
  </style>
</head>
<body>

<div class="header">
  <h1>Liquidación laboral — {{ $anio }}</h1>
  <p>Expedida en {{ $empresa['empresa_ciudad'] }}, el {{ $fecha }}</p>
</div>

<div class="meta">
  <div>
    <strong>Empresa</strong>
    {{ $empresa['empresa_nombre'] }}<br>
    NIT: {{ $empresa['empresa_nit'] }}<br>
    Ciudad: {{ $empresa['empresa_ciudad'] }}
  </div>
  <div>
    <strong>Documento</strong>
    Tipo: Liquidación de prestaciones sociales<br>
    Año: {{ $anio }}<br>
    Personas: {{ $liquidaciones->count() }}
  </div>
</div>

@foreach($liquidaciones as $liq)
<div class="persona-block">
  <div class="persona-header">
    {{ $liq['nombre'] }} —
    Salario: $ {{ number_format($liq['valor_bruto'], 0, ',', '.') }} —
    {{ $liq['dias_trabajados'] }} días ({{ $liq['meses'] }} meses)
  </div>
  <table>
    <thead>
      <tr>
        <th>Concepto</th>
        <th class="num">Valor (COP)</th>
        <th>Fórmula aplicada</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Prima de servicios</td>
        <td class="num">$ {{ number_format($liq['prima'], 0, ',', '.') }}</td>
        <td class="formula">Salario × días prima / 360</td>
      </tr>
      <tr>
        <td>Cesantías</td>
        <td class="num">$ {{ number_format($liq['cesantias'], 0, ',', '.') }}</td>
        <td class="formula">Salario × {{ $liq['dias_trabajados'] }} días / 360</td>
      </tr>
      <tr>
        <td>Intereses sobre cesantías (12% anual)</td>
        <td class="num">$ {{ number_format($liq['intereses_ces'], 0, ',', '.') }}</td>
        <td class="formula">Cesantías × 12% × (días / 360)</td>
      </tr>
      <tr>
        <td>Vacaciones pendientes</td>
        <td class="num">$ {{ number_format($liq['vacaciones'], 0, ',', '.') }}</td>
        <td class="formula">(Salario / 30) × días pendientes</td>
      </tr>
      @if($liq['indemnizacion'] > 0)
      <tr>
        <td class="negativo">Indemnización — despido sin justa causa</td>
        <td class="num negativo">$ {{ number_format($liq['indemnizacion'], 0, ',', '.') }}</td>
        <td class="formula">Art. 64 CST — según salario y tiempo servido</td>
      </tr>
      @endif
      <tr class="subtotal">
        <td>Total liquidación — {{ $liq['nombre'] }}</td>
        <td class="num">$ {{ number_format($liq['total'], 0, ',', '.') }}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
</div>
@endforeach

<div class="gran-total">
  <strong>Gran total a pagar:</strong>
  $ {{ number_format($granTotal, 0, ',', '.') }}
</div>

<div class="letras">
  <strong>Son:</strong> {{ $enLetras }}
</div>

<div style="margin-top:60px;">
  <div style="display:flex; justify-content:space-between; gap:40px;">

    <div style="flex:1; text-align:center;">
      <div style="border-top:1.5px solid #1a1a1a; padding-top:8px; margin-top:50px;">
        <p style="font-weight:bold; font-size:11px; margin:0;">{{ $empresa['empresa_nombre'] }}</p>
        <p style="font-size:10px; color:#555; margin:3px 0 0;">NIT: {{ $empresa['empresa_nit'] }}</p>
        <p style="font-size:10px; color:#555; margin:2px 0 0;">Representante legal</p>
      </div>
    </div>

    <div style="flex:1; text-align:center;">
      <div style="border-top:1.5px solid #1a1a1a; padding-top:8px; margin-top:50px;">
        @if(count($liquidaciones) === 1)
          <p style="font-weight:bold; font-size:11px; margin:0;">{{ $liquidaciones[0]['nombre'] }}</p>
          <p style="font-size:10px; color:#555; margin:3px 0 0;">Trabajador / Prestador</p>
        @else
          <p style="font-weight:bold; font-size:11px; margin:0;">Trabajador / Prestador</p>
          <p style="font-size:10px; color:#555; margin:3px 0 0;">Firma y cédula</p>
        @endif
      </div>
    </div>

  </div>

  <div style="margin-top:24px; border-top:0.5px solid #e0e0e0; padding-top:10px;
              display:flex; justify-content:space-between; font-size:9px; color:#999;">
    <span>Documento generado el {{ $fecha }}</span>
    <span>Valores calculados según normativa laboral colombiana vigente {{ $anio }}</span>
    <span>Página 1</span>
  </div>
</div>

</body>
</html>