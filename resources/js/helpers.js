import { actualizarSelectLiq } from './state.js';

export function fCOP(n) {
    return '$ ' + Math.round(n).toLocaleString('es-CO');
}

export function toast(msg, tipo = 'ok') {
    const d = document.createElement('div');
    d.className = `toast toast-${tipo}`;
    d.innerHTML = `<i class="ti ti-${tipo === 'ok' ? 'check' : 'alert-circle'}"></i> ${msg}`;
    document.getElementById('toasts').appendChild(d);
    setTimeout(() => d.remove(), 5000);
}

export function setLoading(id, on) {
    const b = document.getElementById(id);
    if (!b) return;
    b.disabled = on;
    if (on) { b._orig = b.innerHTML; b.innerHTML = '<span class="spinner"></span> Procesando...'; }
    else b.innerHTML = b._orig || b.innerHTML;
}



export function showTab(name) {
    document.querySelectorAll('.tab-btn').forEach((b, i) => {
        const names  = ['config', 'personas', 'liquidacion', 'historial'];
        const active = names[i] === name;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active);
    });
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');

    // Actualizar select siempre que se abra liquidación
    if (name === 'liquidacion') {
        actualizarSelectLiq();
        // renderLiq se dispara desde app.js
    }
    if (name === 'historial') {
        // cargarHistorial se dispara desde app.js
    }
}

