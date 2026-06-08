<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cuentas_cobro', function (Blueprint $table) {
            $table->id();
            $table->string('empresa_nombre');
            $table->string('empresa_nit');
            $table->string('empresa_ciudad');
            $table->string('mes_cobro');
            $table->integer('anio');
            $table->string('tipo_contrato');
            $table->boolean('cobra_iva')->default(false);
            $table->decimal('total_bruto', 14, 2)->default(0);
            $table->decimal('total_neto', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuentas_cobro');
    }
};