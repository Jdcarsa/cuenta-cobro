<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\TributarioService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LiquidacionController extends Controller
{
    public function __construct(private TributarioService $tributario) {}

    // POST /api/liquidacion/calcular
    public function calcular(Request $request): JsonResponse
    {
        $data = $request->validate([
            'anio'                    => 'integer|in:2024,2025,2026',
            'personas'                => 'required|array|min:1',
            'personas.*.nombre'       => 'required|string',
            'personas.*.valor_bruto'  => 'required|numeric|min:0',
            'personas.*.fecha_inicio' => 'required|date',
            'personas.*.fecha_fin'    => 'required|date|after:personas.*.fecha_inicio',
            'personas.*.motivo_retiro'=> 'required|in:renuncia,despido_justa,despido_sin,mutuo',
            'personas.*.dias_prima'   => 'integer|min:0|max:180',
            'personas.*.dias_vacaciones' => 'integer|min:0',
        ]);

        $anio   = $data['anio'] ?? 2024;
        $params = TributarioService::PARAMETROS[$anio] ?? TributarioService::PARAMETROS[2024];

        $resultado = collect($data['personas'])->map(function ($p) use ($params) {
            $liq = $this->tributario->calcularLiquidacion($p, $params);
            return array_merge(['nombre' => $p['nombre'], 'valor_bruto' => $p['valor_bruto']], $liq);
        });

        return response()->json([
            'liquidaciones' => $resultado,
            'gran_total'    => $resultado->sum('total'),
        ]);
    }

    // POST /api/liquidacion/pdf
    public function descargarPDF(Request $request)
    {
        $data = $request->validate([
            'empresa_nombre'          => 'required|string',
            'empresa_nit'             => 'required|string',
            'empresa_ciudad'          => 'required|string',
            'anio'                    => 'integer|in:2024,2025,2026',
            'personas'                => 'required|array|min:1',
            'personas.*.nombre'       => 'required|string',
            'personas.*.valor_bruto'  => 'required|numeric|min:0',
            'personas.*.fecha_inicio' => 'required|date',
            'personas.*.fecha_fin'    => 'required|date',
            'personas.*.motivo_retiro'=> 'required|in:renuncia,despido_justa,despido_sin,mutuo',
            'personas.*.dias_prima'   => 'integer|min:0|max:180',
            'personas.*.dias_vacaciones' => 'integer|min:0',
        ]);

        $anio   = $data['anio'] ?? 2024;
        $params = TributarioService::PARAMETROS[$anio] ?? TributarioService::PARAMETROS[2024];

        $liquidaciones = collect($data['personas'])->map(function ($p) use ($params) {
            $liq = $this->tributario->calcularLiquidacion($p, $params);
            return array_merge(['nombre' => $p['nombre'], 'valor_bruto' => $p['valor_bruto']], $liq);
        });

        $granTotal  = $liquidaciones->sum('total');
        $enLetras   = TributarioService::numeroALetras($granTotal);
        $fecha      = now()->locale('es')->isoFormat('D [de] MMMM [de] YYYY');

        $pdf = Pdf::loadView('pdf.liquidacion', [
            'empresa'       => $data,
            'liquidaciones' => $liquidaciones,
            'granTotal'     => $granTotal,
            'enLetras'      => $enLetras,
            'fecha'         => $fecha,
            'anio'          => $anio,
        ])->setPaper('letter', 'portrait');

        $nombre = "Liquidacion_{$data['empresa_nombre']}_{$anio}.pdf";
        return $pdf->download(str_replace(' ', '_', $nombre));
    }
}