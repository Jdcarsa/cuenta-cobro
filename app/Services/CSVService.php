<?php

namespace App\Services;

use App\Models\CuentaCobro;
use League\Csv\Writer;
use SplTempFileObject;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CSVService
{
    public function exportar(CuentaCobro $cuenta): StreamedResponse
    {
        $cuenta->load('personas');

        return response()->stream(function () use ($cuenta) {
            $csv = Writer::createFromFileObject(new SplTempFileObject());
            $csv->setOutputBOM(Writer::BOM_UTF8);

            // Encabezado del documento
            $csv->insertOne(["CUENTA DE COBRO — {$cuenta->empresa_nombre} — {$cuenta->mes_cobro} {$cuenta->anio}"]);
            $csv->insertOne(["NIT", $cuenta->empresa_nit, "Ciudad", $cuenta->empresa_ciudad]);
            $csv->insertOne(["Tipo contrato", $cuenta->tipo_contrato, "Cobra IVA", $cuenta->cobra_iva ? 'Sí' : 'No']);
            $csv->insertOne([]);

            // Personas — cuenta de cobro
            $csv->insertOne(['--- CUENTA DE COBRO ---']);
            $csv->insertOne([
                'Nombre', 'Cédula/NIT', 'Vinculación', 'Nivel ARL',
                'Valor bruto', 'Ret. en la fuente', 'ICA', 'IVA',
                'SS trabajador', 'SS empleador', 'Valor neto', 'Actividades',
            ]);

            foreach ($cuenta->personas as $p) {
                $csv->insertOne([
                    $p->nombre, $p->cedula, $p->vinculacion, $p->nivel_riesgo_arl,
                    number_format($p->valor_bruto, 2, '.', ''),
                    number_format($p->retencion_fuente, 2, '.', ''),
                    number_format($p->ica, 2, '.', ''),
                    number_format($p->iva, 2, '.', ''),
                    number_format($p->ss_trabajador, 2, '.', ''),
                    number_format($p->ss_empleador, 2, '.', ''),
                    number_format($p->valor_neto, 2, '.', ''),
                    str_replace("\n", '; ', $p->actividades ?? ''),
                ]);
            }

            $csv->insertOne([]);
            $csv->insertOne(['TOTAL', '', '', '',
                number_format($cuenta->total_bruto, 2, '.', ''),
                '', '', '', '', '',
                number_format($cuenta->total_neto, 2, '.', ''),
            ]);

            $csv->output("cuenta_cobro_{$cuenta->mes_cobro}_{$cuenta->anio}.csv");
        }, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"cuenta_cobro_{$cuenta->mes_cobro}_{$cuenta->anio}.csv\"",
        ]);
    }
}