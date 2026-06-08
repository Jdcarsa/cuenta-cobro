<?php

namespace App\Services;

class TributarioService
{
    public const PARAMETROS = [
        2024 => ['uvt' => 47065, 'smmlv' => 1300000],
        2025 => ['uvt' => 49799, 'smmlv' => 1423500],
    ];

    public const RETENCIONES = [
        'servicios'    => ['pct' => 0.04,  'uvt_base' => 4,  'label' => 'Servicios'],
        'honorarios'   => ['pct' => 0.11,  'uvt_base' => 0,  'label' => 'Honorarios'],
        'arrendamiento'=> ['pct' => 0.035, 'uvt_base' => 27, 'label' => 'Arrendamiento'],
        'compraventa'  => ['pct' => 0.025, 'uvt_base' => 27, 'label' => 'Compraventa'],
    ];

    public const ARL_TASAS = [
        'I'   => 0.00522,
        'II'  => 0.01044,
        'III' => 0.02436,
        'IV'  => 0.04350,
        'V'   => 0.06960,
    ];

    public function calcularPersona(array $persona, string $tipoContrato, bool $cobraIVA, int $anio = 2024): array
    {
        $params  = self::PARAMETROS[$anio] ?? self::PARAMETROS[2024];
        $bruto   = (float) $persona['valor_bruto'];
        $vinc    = $persona['vinculacion'] ?? 'independiente';
        $riesgo  = $persona['nivel_riesgo_arl'] ?? 'I';

        $retencion = $vinc === 'independiente'
            ? $this->calcularRetencionFuente($bruto, $tipoContrato, $params)
            : 0.0;

        $ica = $vinc === 'independiente'
            ? round($bruto * 0.005, 2)
            : 0.0;

        $iva = ($cobraIVA && $vinc === 'independiente')
            ? round($bruto * 0.19, 2)
            : 0.0;

        $ss = $this->calcularSeguridadSocial($bruto, $vinc, $riesgo, $params);

        $neto = $bruto - $retencion - $ica + $iva - $ss['trabajador'];

        return [
            'nombre'           => $persona['nombre'] ?? '',
            'cedula'           => $persona['cedula'] ?? '',
            'vinculacion'      => $vinc,
            'nivel_riesgo_arl' => $riesgo,
            'valor_bruto'      => $bruto,
            'retencion_fuente' => $retencion,
            'ica'              => $ica,
            'iva'              => $iva,
            'ss_trabajador'    => $ss['trabajador'],
            'ss_empleador'     => $ss['empleador'],
            'ss_detalle'       => $ss['detalle'],
            'valor_neto'       => round($neto, 2),
            'actividades'      => $persona['actividades'] ?? '',
        ];
    }

    private function calcularRetencionFuente(float $bruto, string $tipo, array $params): float
    {
        $cfg     = self::RETENCIONES[$tipo] ?? self::RETENCIONES['servicios'];
        $baseMin = $cfg['uvt_base'] * $params['uvt'];

        if ($cfg['uvt_base'] > 0 && $bruto < $baseMin) return 0.0;
        if ($tipo === 'honorarios' && $bruto < 1_000_000)  return 0.0;

        return round($bruto * $cfg['pct'], 2);
    }

    private function calcularSeguridadSocial(float $bruto, string $vinculacion, string $riesgo, array $params): array
    {
        $tasaARL = self::ARL_TASAS[$riesgo] ?? self::ARL_TASAS['I'];

        if ($vinculacion === 'independiente') {
            $base    = $bruto * 0.40;
            $salud   = round($base * 0.125, 2);
            $pension = round($base * 0.16, 2);
            $arl     = round($base * $tasaARL, 2);
            $total   = $salud + $pension + $arl;

            return [
                'trabajador' => $total,
                'empleador'  => 0.0,
                'detalle'    => compact('base', 'salud', 'pension', 'arl'),
            ];
        }

        // Empleado directo
        $base         = max($bruto, $params['smmlv']);
        $emp_salud    = round($base * 0.04, 2);
        $emp_pension  = round($base * 0.04, 2);
        $emp_arl      = round($base * $tasaARL, 2);
        $total_emp    = $emp_salud + $emp_pension + $emp_arl;

        $pat_salud    = round($base * 0.085, 2);
        $pat_pension  = round($base * 0.12, 2);
        $pat_arl      = $emp_arl;
        $total_pat    = $pat_salud + $pat_pension + $pat_arl;

        return [
            'trabajador' => $total_emp,
            'empleador'  => $total_pat,
            'detalle'    => [
                'base'         => $base,
                'emp_salud'    => $emp_salud,
                'emp_pension'  => $emp_pension,
                'emp_arl'      => $emp_arl,
                'pat_salud'    => $pat_salud,
                'pat_pension'  => $pat_pension,
                'pat_arl'      => $pat_arl,
            ],
        ];
    }

    public function calcularLiquidacion(array $persona, array $params): array
    {
        $salario   = (float) $persona['valor_bruto'];
        $inicio    = new \DateTime($persona['fecha_inicio']);
        $fin       = new \DateTime($persona['fecha_fin']);
        $dias      = (int) $inicio->diff($fin)->days;
        $meses     = $dias / 30;
        $diasPrima = (int) ($persona['dias_prima'] ?? 180);
        $diasVac   = (int) ($persona['dias_vacaciones'] ?? 15);
        $motivo    = $persona['motivo_retiro'] ?? 'renuncia';
        $salarioD  = $salario / 30;

        $prima      = round($salario * $diasPrima / 360, 2);
        $cesantias  = round($salario * $dias / 360, 2);
        $intCes     = round($cesantias * 0.12 * ($dias / 360), 2);
        $vacaciones = round($salarioD * $diasVac, 2);

        $indemnizacion = 0.0;
        if ($motivo === 'despido_sin') {
            if ($salario <= $params['smmlv'] * 10) {
                $indemnizacion = $meses <= 12
                    ? round($salarioD * 30, 2)
                    : round($salarioD * 30 + $salarioD * 20 * max(0, $meses - 12), 2);
            } else {
                $indemnizacion = $meses <= 12
                    ? round($salarioD * 20, 2)
                    : round($salarioD * 20 + $salarioD * 15 * max(0, $meses - 12), 2);
            }
        }

        return [
            'dias_trabajados'  => $dias,
            'meses'            => round($meses, 1),
            'prima'            => $prima,
            'cesantias'        => $cesantias,
            'intereses_ces'    => $intCes,
            'vacaciones'       => $vacaciones,
            'indemnizacion'    => $indemnizacion,
            'total'            => $prima + $cesantias + $intCes + $vacaciones + $indemnizacion,
        ];
    }

    public static function numeroALetras(float $monto): string
    {
        $entero   = (int) $monto;
        $centavos = (int) round(($monto - $entero) * 100);
        $texto    = self::enteroALetras($entero);
        $sufijo   = $centavos > 0 ? " con {$centavos}/100" : "";
        return ucfirst(strtolower($texto)) . " pesos m/cte" . $sufijo;
    }

    private static function enteroALetras(int $n): string
    {
        if ($n === 0) return 'cero';
        $unidades  = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve',
                      'diez','once','doce','trece','catorce','quince','dieciséis','diecisiete',
                      'dieciocho','diecinueve'];
        $decenas   = ['','diez','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
        $centenas  = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos',
                      'seiscientos','setecientos','ochocientos','novecientos'];

        if ($n < 20)   return $unidades[$n];
        if ($n < 100)  return $decenas[intdiv($n,10)] . ($n%10 ? ' y ' . $unidades[$n%10] : '');
        if ($n === 100) return 'cien';
        if ($n < 1000) return $centenas[intdiv($n,100)] . ($n%100 ? ' ' . self::enteroALetras($n%100) : '');
        if ($n < 2000) return 'mil' . ($n%1000 ? ' ' . self::enteroALetras($n%1000) : '');
        if ($n < 1_000_000) {
            $m = intdiv($n,1000);
            return self::enteroALetras($m) . ' mil' . ($n%1000 ? ' ' . self::enteroALetras($n%1000) : '');
        }
        if ($n < 2_000_000) return 'un millón' . ($n%1_000_000 ? ' ' . self::enteroALetras($n%1_000_000) : '');
        $m = intdiv($n, 1_000_000);
        return self::enteroALetras($m) . ' millones' . ($n%1_000_000 ? ' ' . self::enteroALetras($n%1_000_000) : '');
    }
}