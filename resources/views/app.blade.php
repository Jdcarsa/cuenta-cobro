<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Cuenta de cobro · Colombia</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.x/tabler-icons.min.css">
  @vite(['resources/css/app.css', 'resources/js/app.js'])  {{-- ← Vite en vez del <link> manual --}}
</head>
<body class="bg-gray-100 text-gray-900 text-sm min-h-screen font-sans">

  <div class="max-w-4xl mx-auto px-4 py-8" id="app-root">
    @include('layouts.main')
  </div>

  <div id="toasts" class="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5"></div>

  <script>
    window.APP = {
      baseUrl:    "{{ url('') }}",
      csrfToken:  "{{ csrf_token() }}",
      parametros: @json(\App\Services\TributarioService::PARAMETROS),
      retenciones:@json(\App\Services\TributarioService::RETENCIONES),
      arlTasas:   @json(\App\Services\TributarioService::ARL_TASAS),
    };
  </script>

</body>
</html>