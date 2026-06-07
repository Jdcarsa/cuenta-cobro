<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CuentaCobro extends Model
{
    protected $fillable = [
        'empresa_nombre', 'empresa_nit', 'empresa_ciudad',
        'mes_cobro', 'anio', 'tipo_contrato', 'cobra_iva',
        'total_bruto', 'total_neto',
    ];

    protected $casts = [
        'cobra_iva'    => 'boolean',
        'total_bruto'  => 'float',
        'total_neto'   => 'float',
    ];

    public function personas(): HasMany
    {
        return $this->hasMany(Persona::class);
    }
}