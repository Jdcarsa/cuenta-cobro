const STORAGE_KEY = 'cc_personas';
const ID_KEY      = 'cc_id_cnt';

function cargarDesdeStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function guardarEnStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
    localStorage.setItem(ID_KEY, String(idCnt));
}

export let personas = cargarDesdeStorage();
export let idCnt    = parseInt(localStorage.getItem(ID_KEY) || '0');

export function addPersona(p) {
    personas.push(p);
    guardarEnStorage();
}

export function removePersona(id) {
    personas = personas.filter(p => p.id !== id);
    guardarEnStorage();
}

export function incrementId() {
    idCnt++;
    guardarEnStorage();
    return idCnt;
}

export function limpiarPersonas() {
    personas = [];
    idCnt = 0;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ID_KEY);
}

export function actualizarSelectLiq() {
    const sel = document.getElementById('liq-persona');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = !personas.length
        ? '<option>— Agrega personas primero —</option>'
        : personas.map(p =>
            `<option value="${p.id}" ${p.id == cur ? 'selected' : ''}>${p.nombre || 'Persona ' + p.id}</option>`
        ).join('');
}