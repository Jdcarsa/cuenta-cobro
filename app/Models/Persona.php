<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Persona extends Model
{
    protected $fillable = [
        'cuenta_cobro_id', 'nombre', 'cedula', 'vinculacion',
        'nivel_riesgo_arl', 'valor_bruto', 'retencion_fuente',
        'ica', 'iva', 'ss_trabajador', 'ss_empleador',
        'valor_neto', 'actividades',
    ];

    protected $casts = [
        'valor_bruto'      => 'float',
        'retencion_fuente' => 'float',
        'ica'              => 'float',
        'iva'              => 'float',
        'ss_trabajador'    => 'float',
        'ss_empleador'     => 'float',
        'valor_neto'       => 'float',
    ];

    public function cuentaCobro(): BelongsTo
    {
        return $this->belongsTo(CuentaCobro::class);
    }
}