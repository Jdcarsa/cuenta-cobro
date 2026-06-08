<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CuentaCobro;
use App\Services\CSVService;
use App\Services\PDFService;
use App\Services\TributarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CuentaCobroController extends Controller
{
    public function __construct(
        private TributarioService $tributario,
        private PDFService $pdf,
        private CSVService $csv,
    ) {}

    // POST /api/calcular
    public function calcular(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tipo_contrato'    => 'required|in:servicios,honorarios,arrendamiento,compraventa',
            'cobra_iva'        => 'boolean',
            'anio'             => 'integer|in:2024,2025',
            'personas'         => 'required|array|min:1',
            'personas.*.nombre'          => 'required|string',
            'personas.*.cedula'          => 'nullable|string',
            'personas.*.vinculacion'     => 'required|in:independiente,empleado',
            'personas.*.nivel_riesgo_arl'=> 'nullable|in:I,II,III,IV,V',
            'personas.*.valor_bruto'     => 'required|numeric|min:0',
            'personas.*.actividades'     => 'nullable|string',
        ]);

        $anio     = $data['anio'] ?? 2024;
        $cobraIVA = $data['cobra_iva'] ?? false;
        $tipo     = $data['tipo_contrato'];

        $resultado = collect($data['personas'])->map(function ($p) use ($tipo, $cobraIVA, $anio) {
            return $this->tributario->calcularPersona($p, $tipo, $cobraIVA, $anio);
        });

        return response()->json([
            'personas'    => $resultado,
            'total_bruto' => $resultado->sum('valor_bruto'),
            'total_neto'  => $resultado->sum('valor_neto'),
        ]);
    }

    // POST /api/cuentas-cobro
    public function guardar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'empresa_nombre'   => 'required|string|max:200',
            'empresa_nit'      => 'required|string|max:30',
            'empresa_ciudad'   => 'required|string|max:100',
            'mes_cobro'        => 'required|string',
            'anio'             => 'integer|in:2024,2025',
            'tipo_contrato'    => 'required|in:servicios,honorarios,arrendamiento,compraventa',
            'cobra_iva'        => 'boolean',
            'personas'         => 'required|array|min:1',
            'personas.*.nombre'          => 'required|string',
            'personas.*.cedula'          => 'nullable|string',
            'personas.*.vinculacion'     => 'required|in:independiente,empleado',
            'personas.*.nivel_riesgo_arl'=> 'nullable|in:I,II,III,IV,V',
            'personas.*.valor_bruto'     => 'required|numeric|min:0',
            'personas.*.actividades'     => 'nullable|string',
        ]);

        $anio     = $data['anio'] ?? 2024;
        $cobraIVA = $data['cobra_iva'] ?? false;
        $tipo     = $data['tipo_contrato'];

        $personasCalc = collect($data['personas'])->map(function ($p) use ($tipo, $cobraIVA, $anio) {
            return $this->tributario->calcularPersona($p, $tipo, $cobraIVA, $anio);
        });

        $cuenta = CuentaCobro::create([
            'empresa_nombre'  => $data['empresa_nombre'],
            'empresa_nit'     => $data['empresa_nit'],
            'empresa_ciudad'  => $data['empresa_ciudad'],
            'mes_cobro'       => $data['mes_cobro'],
            'anio'            => $anio,
            'tipo_contrato'   => $tipo,
            'cobra_iva'       => $cobraIVA,
            'total_bruto'     => $personasCalc->sum('valor_bruto'),
            'total_neto'      => $personasCalc->sum('valor_neto'),
        ]);

        $cuenta->personas()->createMany($personasCalc->toArray());

        return response()->json(['id' => $cuenta->id, 'mensaje' => 'Guardado correctamente.'], 201);
    }

    // GET /api/cuentas-cobro/{id}/pdf
    public function descargarPDF(CuentaCobro $cuentaCobro)
    {
        return $this->pdf->generarCuentaCobro($cuentaCobro);
    }

    // GET /api/cuentas-cobro/{id}/csv
    public function descargarCSV(CuentaCobro $cuentaCobro)
    {
        return $this->csv->exportar($cuentaCobro);
    }

    // GET /api/cuentas-cobro
    public function historial(): JsonResponse
    {
        $historial = CuentaCobro::with('personas')
            ->latest()
            ->paginate(20);

        return response()->json($historial);
    }
}