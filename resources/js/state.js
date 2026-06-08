
export let personas = [];
export let idCnt    = 0;

export function addPersona(p)    { personas.push(p); }
export function removePersona(id){ personas = personas.filter(p => p.id !== id); }
export function incrementId()    { return ++idCnt; }

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