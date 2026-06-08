<?php

use App\Http\Controllers\CuentaCobroController;
use App\Http\Controllers\LiquidacionController;
use Illuminate\Support\Facades\Route;

Route::prefix('cuentas-cobro')->controller(CuentaCobroController::class)->group(function () {
    Route::post('calcular',              'calcular');
    Route::post('/',                     'guardar');
    Route::get('/',                      'historial');
    Route::get('{cuentaCobro}/pdf',      'descargarPDF');
    Route::get('{cuentaCobro}/csv',      'descargarCSV');
});

Route::post('liquidacion/calcular', [LiquidacionController::class, 'calcular']);
Route::post('liquidacion/pdf',      [LiquidacionController::class, 'descargarPDF']);