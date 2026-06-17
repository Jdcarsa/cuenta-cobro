<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('personas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_cobro_id')->constrained('cuentas_cobro')->cascadeOnDelete();
            $table->string('nombre');
            $table->string('cedula')->nullable();
            $table->enum('vinculacion', ['independiente', 'empleado']);
            $table->string('nivel_riesgo_arl')->default('I');
            $table->decimal('valor_bruto', 14, 2);
            $table->decimal('retencion_fuente', 14, 2)->default(0);
            $table->decimal('ica', 14, 2)->default(0);
            $table->decimal('iva', 14, 2)->default(0);
            $table->decimal('ss_trabajador', 14, 2)->default(0);
            $table->decimal('ss_empleador', 14, 2)->default(0);
            $table->decimal('valor_neto', 14, 2);
            $table->text('actividades')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personas');
    }
};