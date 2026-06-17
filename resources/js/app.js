import { showTab, toast, setLoading, fCOP } from './helpers.js';
import { renderPersonas, agregarPersona, eliminarPersona, upd } from './personas.js';
import { renderLiq, calcularLiqAPI, descargarLiqPDF } from './liquidacion.js';
import { verificarAPI, calcularAPI, guardarYDescargar, cargarHistorial } from './api.js';
import { actualizarSelectLiq, personas } from './state.js';

const ACTIONS = {
    calcularAPI,
    guardarYDescargar,
    agregarPersona,
    renderLiq,
    calcularLiqAPI,
    descargarLiqPDF,
    cargarHistorial,
    verificarAPI,
    showTab: (tab) => {
        showTab(tab);
        if (tab === 'liquidacion') { actualizarSelectLiq(); renderLiq(); }
        if (tab === 'historial')   cargarHistorial();
    },
};

document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const fn     = ACTIONS[action];
    if (!fn) return;

    if (action === 'guardarYDescargar') fn(el.dataset.fmt);
    else if (action === 'showTab')      fn(el.dataset.tab);
    else fn();
});

document.addEventListener('change', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = ACTIONS[el.dataset.action];
    if (fn) fn();
});

document.addEventListener('input', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = ACTIONS[el.dataset.action];
    if (fn) fn();
});

window.upd             = upd;
window.eliminarPersona = eliminarPersona;
window.fCOP            = fCOP;

document.addEventListener('DOMContentLoaded', () => {
    verificarAPI();
    if (personas.length) renderPersonas();
});