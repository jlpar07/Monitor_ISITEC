/* ===========================================================
   app.js · Router y arranque
   Enrutamiento por hash: #/resumen, #/proyectos,
   #/proyecto/:id, #/alertas, #/facturacion, #/horas, #/calidad
   =========================================================== */

const App = (function () {

  const RUTAS = {
    resumen:     VistaResumen,
    proyectos:   VistaProyectos,
    proyecto:    VistaProyecto,
    alertas:     VistaAlertas,
    facturacion: VistaFacturacion,
    horas:       VistaHoras,
    calidad:     VistaCalidad
  };

  let actual = { nombre: 'resumen', params: {} };

  function leerHash () {
    const partes = (location.hash || '#/resumen').replace(/^#\//, '').split('/');
    const nombre = partes[0] || 'resumen';
    if (!RUTAS[nombre]) return { nombre: 'resumen', params: {} };
    return { nombre, params: { id: partes[1] } };
  }

  function render () {
    const vista = RUTAS[actual.nombre];
    document.querySelector('#vista').innerHTML = vista.render(actual.params);
    document.querySelector('#miga').innerHTML = vista.miga(actual.params);
    if (vista.montar) vista.montar();
    pintarNav();
    window.scrollTo(0, 0);
  }

  function pintarNav () {
    const rutaNav = actual.nombre === 'proyecto' ? 'proyectos' : actual.nombre;
    document.querySelectorAll('#nav .nav-item').forEach(a =>
      a.classList.toggle('activo', a.dataset.ruta === rutaNav));
    document.querySelector('#navProyectos').textContent = Estado.proyectos().length;
    const abiertas = Estado.alertasAbiertas().length;
    const badge = document.querySelector('#navAlertas');
    badge.textContent = abiertas;
    badge.style.display = abiertas ? '' : 'none';
    const incAbiertas = Estado.calidadGlobal().abiertas;
    const badgeCal = document.querySelector('#navCalidad');
    badgeCal.textContent = incAbiertas;
    badgeCal.style.display = incAbiertas ? '' : 'none';
  }

  function navegar () { actual = leerHash(); render(); }

  /* --- acciones globales de la barra superior -------------- */
  /* El reporte (PDF o CSV) vive en reporte.js. Si estás en el
     detalle de un proyecto, el modal lo sugiere por defecto. */
  function exportarReporte () {
    Reporte.abrir(actual.nombre === 'proyecto' ? actual.params.id : null);
  }

  function abrirNuevaTarea () {
    const proyectoSugerido = actual.nombre === 'proyecto' ? actual.params.id : Estado.proyectos()[0].id;
    const enUnaSemana = (() => {
      const d = new Date(); d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0,10);
    })();

    UI.modal(`
      <h2>Nueva tarea</h2>
      <p class="modal-sub">Asigna una actividad antes de que se convierta en un riesgo.</p>
      <label class="campo">Nombre de la tarea
        <input type="text" id="nt_nombre" placeholder="Ej. Revisar entregables de la fase 2">
      </label>
      <label class="campo">Proyecto
        <select id="nt_proyecto">
          ${Estado.proyectos().map(p =>
            `<option value="${p.id}" ${p.id === proyectoSugerido ? 'selected' : ''}>${UI.escapar(p.nombre)}</option>`).join('')}
        </select>
      </label>
      <label class="campo">Responsable
        <select id="nt_responsable">
          ${Estado.personas().map(p => `<option value="${p.id}">${UI.escapar(p.nombre)}</option>`).join('')}
        </select>
      </label>
      <label class="campo">Fecha límite
        <input type="date" id="nt_fecha" value="${enUnaSemana}">
      </label>
      <label class="campo">Prioridad
        <select id="nt_prioridad">
          <option value="alta">Alta</option>
          <option value="media" selected>Media</option>
          <option value="baja">Baja</option>
        </select>
      </label>
      <label class="casilla-campo">
        <input type="checkbox" id="nt_incidencia"> Es una incidencia
        <small>Cuenta en el indicador de calidad y registra las horas para atenderla</small>
      </label>
      <label class="campo" id="nt_horas_campo" hidden>Horas ya invertidas
        <input type="number" id="nt_horas" min="0" step="0.5" value="0">
      </label>
      <div class="modal-acciones">
        <button class="boton secundario" data-cerrar>Cancelar</button>
        <button class="boton primario" id="nt_guardar">Crear tarea</button>
      </div>`,
      dlg => {
        dlg.querySelector('#nt_nombre').focus();
        const casilla = dlg.querySelector('#nt_incidencia');
        casilla.addEventListener('change', () => { dlg.querySelector('#nt_horas_campo').hidden = !casilla.checked; });
        dlg.querySelector('#nt_guardar').addEventListener('click', () => {
          const nombre = dlg.querySelector('#nt_nombre').value.trim();
          if (!nombre) { dlg.querySelector('#nt_nombre').focus(); return; }
          Estado.crearTarea({
            nombre,
            proyectoId:    dlg.querySelector('#nt_proyecto').value,
            responsableId: dlg.querySelector('#nt_responsable').value,
            fechaLimite:   dlg.querySelector('#nt_fecha').value,
            prioridad:     dlg.querySelector('#nt_prioridad').value,
            esIncidencia:  casilla.checked,
            horas:         Math.max(0, parseFloat(dlg.querySelector('#nt_horas').value) || 0)
          });
          UI.cerrarModal();
          UI.toast(casilla.checked ? 'Incidencia reportada.' : 'Tarea creada.');
        });
      });
  }

  /* --- arranque -------------------------------------------- */
  function iniciar () {
    window.addEventListener('hashchange', navegar);
    Estado.alCambiar(render);                 // cualquier cambio de datos repinta
    document.querySelector('#btnExportar').addEventListener('click', exportarReporte);
    document.querySelector('#btnNuevaTarea').addEventListener('click', abrirNuevaTarea);
    document.querySelector('#btnReiniciar').addEventListener('click', () => {
      Estado.reiniciar();
      UI.toast('Datos de ejemplo restaurados.');
    });
    navegar();
  }

  return { iniciar, render, navegar };
})();

document.addEventListener('DOMContentLoaded', App.iniciar);
