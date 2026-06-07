<?php

namespace App\Services;

use App\Models\CuentaCobro;
use Barryvdh\DomPDF\Facade\Pdf;

class PDFService
{
    public function generarCuentaCobro(CuentaCobro $cuenta): \Illuminate\Http\Response
    {
        $cuenta->load('personas');

        $totalNeto = $cuenta->personas->sum('valor_neto');
        $enLetras  = TributarioService::numeroALetras($totalNeto);

        $pdf = Pdf::loadView('pdf.cuenta-cobro', [
            'cuenta'   => $cuenta,
            'personas' => $cuenta->personas,
            'enLetras' => $enLetras,
            'fecha'    => now()->locale('es')->isoFormat('D [de] MMMM [de] YYYY'),
        ])->setPaper('letter', 'portrait');

        $nombre = "Cuenta_Cobro_{$cuenta->mes_cobro}_{$cuenta->anio}_{$cuenta->empresa_nombre}.pdf";
        $nombre = str_replace([' ', '/'], '_', $nombre);

        return $pdf->download($nombre);
    }
}