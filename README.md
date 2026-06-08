# 📄 Generador de Cuentas de Cobro — Colombia

Aplicación web monolítica construida con **Laravel 11** para generar, calcular y archivar cuentas de cobro bajo la normativa tributaria colombiana vigente. Incluye cálculo automático de retenciones en la fuente, seguridad social, ICA, IVA, liquidaciones laborales y exportación a PDF y CSV.

---

## ✨ Características

- **Cálculo tributario automático** — retención en la fuente (servicios, honorarios, arrendamiento, compraventa), ICA (5‰), IVA (19%)
- **Seguridad social** — cálculo diferenciado para independientes (base 40% del ingreso) y empleados directos (descuentos empleado + costo empleador)
- **Niveles de riesgo ARL** — soporta los 5 niveles con sus tasas exactas
- **Liquidación laboral** — prima de servicios, cesantías, intereses sobre cesantías, vacaciones e indemnización por despido sin justa causa (art. 64 CST)
- **Soporte multi-persona** — varias personas por cuenta de cobro, con tipo de vinculación mixto
- **Exportación PDF** — documento firmable generado con Dompdf, incluye monto en letras
- **Exportación CSV** — con BOM UTF-8, compatible con Excel en español
- **Historial persistente** — todas las cuentas guardadas en SQLite con paginación
- **API REST** — endpoints limpios consumidos por el frontend Blade incluido
- **Parámetros actualizables** — UVT y SMMLV para 2024 y 2025 seleccionables desde la interfaz

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | PHP 8.2 · Laravel 11 |
| Motor PDF | barryvdh/laravel-dompdf |
| Motor CSV | league/csv |
| Base de datos | SQLite (archivo local) |
| Frontend | Blade + HTML/CSS/JS vanilla |
| Estilos | CSS custom (sin framework externo) |

---

## ⚙️ Instalación

### Requisitos

- PHP 8.2 o superior con extensiones: `mbstring`, `sqlite3`, `pdo_sqlite`, `gd`
- Composer 2.x

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/cuenta-cobro-co.git
cd cuenta-cobro-co

# 2. Instalar dependencias
composer install

# 3. Copiar variables de entorno
cp .env.example .env
php artisan key:generate

# 4. Configurar SQLite en .env
# Asegúrate de que DB_CONNECTION=sqlite y elimina las demás DB_*

# 5. Crear el archivo de base de datos y migrar
touch database/database.sqlite
php artisan migrate

# 6. Levantar el servidor
php artisan serve
```

Abre el navegador en `http://127.0.0.1:8000`.

---

## 📡 Endpoints de la API

Todos los endpoints están bajo el prefijo `/api`.

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/cuentas-cobro/calcular` | Calcula retenciones sin guardar — responde JSON |
| `POST` | `/api/cuentas-cobro` | Calcula, guarda en SQLite y retorna el ID |
| `GET` | `/api/cuentas-cobro` | Historial paginado de cuentas guardadas |
| `GET` | `/api/cuentas-cobro/{id}/pdf` | Descarga el PDF de una cuenta guardada |
| `GET` | `/api/cuentas-cobro/{id}/csv` | Descarga el CSV de una cuenta guardada |
| `POST` | `/api/liquidacion/calcular` | Calcula la liquidación laboral — responde JSON |
| `POST` | `/api/liquidacion/pdf` | Genera y descarga el PDF de liquidación |

### Ejemplo de payload — calcular cuenta de cobro

```json
POST /api/cuentas-cobro/calcular
Content-Type: application/json

{
  "empresa_nombre": "Empresa XYZ S.A.S.",
  "empresa_nit": "900.123.456-7",
  "empresa_ciudad": "Bogotá D.C.",
  "mes_cobro": "Junio",
  "anio": 2024,
  "tipo_contrato": "servicios",
  "cobra_iva": false,
  "personas": [
    {
      "nombre": "Juan Pérez",
      "cedula": "1.234.567.890",
      "vinculacion": "independiente",
      "nivel_riesgo_arl": "I",
      "valor_bruto": 3000000,
      "actividades": "Desarrollo del módulo de usuarios"
    }
  ]
}
```

### Ejemplo de respuesta

```json
{
  "personas": [
    {
      "nombre": "Juan Pérez",
      "valor_bruto": 3000000,
      "retencion_fuente": 120000,
      "ica": 15000,
      "iva": 0,
      "ss_trabajador": 168104,
      "ss_empleador": 0,
      "valor_neto": 2696896
    }
  ],
  "total_bruto": 3000000,
  "total_neto": 2696896
}
```

### Ejemplo de payload — liquidación

```json
POST /api/liquidacion/calcular
Content-Type: application/json

{
  "anio": 2024,
  "personas": [
    {
      "nombre": "Juan Pérez",
      "valor_bruto": 3000000,
      "fecha_inicio": "2024-01-01",
      "fecha_fin": "2024-06-30",
      "motivo_retiro": "renuncia",
      "dias_prima": 180,
      "dias_vacaciones": 15
    }
  ]
}
```

---

## 🧮 Lógica tributaria implementada

### Retención en la fuente

| Tipo | Tarifa | Base mínima |
|---|---|---|
| Prestación de servicios | 4% | 4 UVT |
| Honorarios | 11% | $1.000.000 |
| Arrendamiento | 3.5% | 27 UVT |
| Compraventa / Suministro | 2.5% | 27 UVT |

### Seguridad social — Independiente

Base de cotización = **40% del ingreso bruto**

| Concepto | Tarifa |
|---|---|
| Salud | 12.5% |
| Pensión | 16% |
| ARL (riesgo I) | 0.522% |

### Seguridad social — Empleado directo

Base = máximo entre salario y SMMLV

| Concepto | Empleado | Empleador |
|---|---|---|
| Salud | 4% | 8.5% |
| Pensión | 4% | 12% |
| ARL | Variable | Variable |

### Parámetros 2024 / 2025

| Parámetro | 2024 | 2025 |
|---|---|---|
| UVT | $47.065 | $49.799 |
| SMMLV | $1.300.000 | $1.423.500 |

---

## 📁 Estructura del proyecto

```
cuenta-cobro-co/
├── app/
│   ├── Http/Controllers/Api/
│   │   ├── CuentaCobroController.php   # Endpoints cuenta de cobro
│   │   └── LiquidacionController.php   # Endpoints liquidación
│   ├── Models/
│   │   ├── CuentaCobro.php
│   │   └── Persona.php
│   └── Services/
│       ├── TributarioService.php       # Motor de cálculo tributario y liquidación
│       ├── PDFService.php              # Generación de PDF con Dompdf
│       └── CSVService.php              # Exportación CSV con League\CSV
├── database/
│   ├── migrations/
│   └── database.sqlite                 # Base de datos local
├── resources/views/
│   ├── app.blade.php                   # Frontend principal (SPA Blade)
│   └── pdf/
│       ├── cuenta-cobro.blade.php      # Plantilla PDF cuenta de cobro
│       └── liquidacion.blade.php       # Plantilla PDF liquidación
└── routes/
    ├── api.php                         # Rutas REST
    └── web.php                         # Ruta raíz → app.blade.php
```

---

## 🚀 Uso rápido

1. Levanta el servidor con `php artisan serve`
2. Abre `http://127.0.0.1:8000` en el navegador
3. En la pestaña **Empresa**, configura los datos de la empresa pagadora y el tipo de contrato
4. En la pestaña **Personas**, agrega a cada prestador o empleado con su tipo de vinculación y nivel de riesgo ARL
5. Haz clic en **Calcular con API** para ver los resultados en tiempo real
6. Usa **Guardar y descargar PDF** o **Guardar y descargar CSV** para generar los documentos
7. En la pestaña **Liquidación**, selecciona una persona, ingresa las fechas y descarga el PDF de liquidación
8. En la pestaña **Historial** puedes consultar y re-descargar cualquier cuenta guardada

---

## ⚠️ Aviso legal

Esta herramienta es de carácter **orientativo**. Los cálculos se basan en la normativa tributaria y laboral colombiana vigente, pero pueden existir casos particulares, tarifas municipales de ICA distintas o situaciones especiales no contempladas. **Siempre confirma los valores con tu asesor contable o tributario** antes de presentar documentos oficiales.

---

## 📝 Licencia

MIT — libre para uso personal y comercial.