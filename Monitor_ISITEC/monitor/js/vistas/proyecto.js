/* ===========================================================
   vistas/proyecto.js · Detalle de un proyecto
   Pestañas: Tareas · Riesgos · Horas · Facturación
   Las dos primeras están funcionando. Las otras dos quedan
   asignadas al equipo (ver TODO.md).
   =========================================================== */

const VistaProyecto = {
  id: null,
  pestana: 'tareas',

  miga () {
    const p = Estado.proyecto(this.id);
    return `<a href="#/resumen">Inicio</a><span>/</span><a href="#/proyectos">Proyectos</a>
            <span>/</span><strong>${UI.escapar(p ? p.nombre : '')}</strong>`;
  },

  render (params) {
    if (params && params.id && params.id !== this.id) { this.id = params.id; this.pestana = 'tareas'; }
    const p = Estado.proyecto(this.id);
    if (!p) return UI.vacio('Proyecto no encontrado', 'Vuelve al listado de proyectos.');

    const c = Estado.cliente(p.clienteId);
    const sem = Estado.semaforo(p);
    const esperado = Estado.avanceEsperado(p);
    const desv = Estado.desviacion(p);
    const proy = Estado.proyeccionCierre(p);
    const tareas = Estado.tareasDe(p.id);
    const riesgos = tareas.filter(Estado.enRiesgo);

    let cierreValor = '—', cierreNota = 'Sin datos suficientes', claseCierre = '';
    if (proy) {
      cierreValor = UI.fecha(proy.fecha);
      const d = proy.desvioDias;
      cierreNota = d > 0 ? `${d} días después del plan` : d < 0 ? `${Math.abs(d)} días antes` : 'En la fecha planeada';
      claseCierre = d > 7 ? 'rojo' : d > 0 ? 'ambar' : 'verde';
    }

    return `
      <div class="detalle-cabeza">
        <div class="detalle-top">
          <div>
            <p class="etiqueta">${UI.escapar(c.nombre)}</p>
            <h1>${UI.escapar(p.nombre)}</h1>
            <p class="cliente">Líder: ${UI.escapar(Estado.persona(p.liderId).nombre)} ·
               ${UI.fechaLarga(p.inicio)} → ${UI.fechaLarga(p.finPlan)}</p>
          </div>
          ${UI.chipEstado(sem)}
        </div>
        <div class="medidas">
          <div class="medida">
            <span class="m-label">Avance real</span>
            <span class="m-valor">${p.avanceReal}%</span>
            ${UI.barra(p.avanceReal, sem.clave === 'verde' ? '' : sem.clave)}
          </div>
          <div class="medida">
            <span class="m-label">Avance esperado</span>
            <span class="m-valor">${esperado}%</span>
            <span class="m-nota">según el cronograma</span>
          </div>
          <div class="medida">
            <span class="m-label">Desviación</span>
            <span class="m-valor ${desv >= -5 ? 'verde' : desv >= -15 ? 'ambar' : 'rojo'}">${desv >= 0 ? '+' : ''}${desv} pts</span>
            <span class="m-nota">real contra esperado</span>
          </div>
          <div class="medida">
            <span class="m-label">Cierre proyectado</span>
            <span class="m-valor ${claseCierre}">${cierreValor}</span>
            <span class="m-nota">${cierreNota}</span>
          </div>
        </div>
      </div>

      <div class="pestanas">
        <button class="pestana ${this.pestana==='tareas'?'activa':''}" data-pestana="tareas">Tareas <b>${tareas.length}</b></button>
        <button class="pestana ${this.pestana==='riesgos'?'activa':''}" data-pestana="riesgos">Riesgos <b>${riesgos.length}</b></button>
        <button class="pestana ${this.pestana==='horas'?'activa':''}" data-pestana="horas">Horas</button>
        <button class="pestana ${this.pestana==='facturacion'?'activa':''}" data-pestana="facturacion">Facturación</button>
      </div>

      <div id="panelPestana">${this.contenidoPestana(p)}</div>
    `;
  },

  contenidoPestana (p) {
    if (this.pestana === 'tareas')  return this.panelTareas(p);
    if (this.pestana === 'riesgos') return this.panelRiesgos(p);
    if (this.pestana === 'horas')   return this.panelPendiente('Horas y productividad',
      'Esta pestaña debe mostrar las horas del proyecto por persona y qué tanto avance generaron.',
      ['Horas presupuestadas contra horas invertidas (los datos ya están en <code>datos.js → registroHoras</code>)',
       'Productividad por persona: horas invertidas contra avance aportado',
       'Horas facturables contra no facturables, que es el insumo del ingreso del proyecto',
       'Alerta cuando el consumo de horas supera el avance en más de 15 puntos'],
      'Pendiente del equipo');
    if (this.pestana === 'facturacion') return this.panelFacturacion(p);
    return '';
  },

  panelFacturacion (p) {
    const facturas = Estado.facturas().filter(f => f.proyectoId === p.id);
    const facturado = facturas.reduce((s, f) => s + f.monto, 0);
    const pendiente = facturas.filter(f => f.estado === 'pendiente').reduce((s, f) => s + f.monto, 0);
    return `
      <section class="panel">
        <div class="panel-cabeza">
          <div><h2>Facturación del proyecto</h2><p>${facturas.length} facturas · ${UI.dineroLargo(facturado)} emitido</p></div>
          <span class="chip ${facturado / p.valorContrato * 100 >= p.avanceReal ? 'verde' : 'ambar'}">
            ${Math.round(facturado / p.valorContrato * 100)}% facturado · ${p.avanceReal}% avance
          </span>
        </div>
        <p class="sub" style="margin-bottom:16px">${UI.dineroLargo(pendiente)} pendiente de cobro</p>
        ${facturas.length ? `<div style="overflow-x:auto"><table class="tabla"><thead><tr>
          <th>Número</th><th>Monto</th><th>Emisión</th><th>Vencimiento</th><th>Estado</th><th></th>
        </tr></thead><tbody>${facturas.map(f => {
          const vencida = f.estado === 'pendiente' && Estado.diasDesdeHoy(f.vencimiento) < 0;
          return `<tr class="${vencida ? 'factura-vencida' : ''}">
            <td><strong>${UI.escapar(f.numero)}</strong></td><td>${UI.dineroLargo(f.monto)}</td>
            <td>${UI.fecha(f.emision)}</td><td class="${vencida ? 'rojo' : ''}">${UI.fecha(f.vencimiento)}
              <br><small>${vencida ? `Vencida hace ${Math.abs(Estado.diasDesdeHoy(f.vencimiento))} días` : UI.vencimiento(f.vencimiento)}</small></td>
            <td>${vencida ? '<span class="chip rojo">Vencida</span>' : f.estado === 'pagada' ? '<span class="chip verde">Pagada</span>' : '<span class="chip ambar">Pendiente</span>'}</td>
            <td style="text-align:right">${f.estado === 'pendiente' ? `<button class="boton-texto" data-pagar-proyecto="${f.id}">Marcar como pagada</button>` : ''}</td>
          </tr>`;
        }).join('')}</tbody></table></div>` : UI.vacio('Sin facturas', 'Este proyecto todavía no tiene facturas registradas.')}
      </section>`;
  },

  /* --- pestaña TAREAS (funcional) -------------------------- */
  panelTareas (p) {
    const tareas = Estado.tareasDe(p.id)
      .sort((a, b) => (a.estado === 'completada') - (b.estado === 'completada')
                   || Estado.diasDesdeHoy(a.fechaLimite) - Estado.diasDesdeHoy(b.fechaLimite));

    if (!tareas.length) return `<section class="panel">${UI.vacio('Sin tareas','Crea la primera con el botón Nueva tarea.')}</section>`;

    return `
      <section class="panel" style="padding:18px 20px">
        <table class="tabla">
          <thead><tr>
            <th style="width:38%">Tarea</th><th>Responsable</th><th>Fecha límite</th>
            <th>Prioridad</th><th>Riesgo</th><th></th>
          </tr></thead>
          <tbody>
            ${tareas.map(t => {
              const vencida = Estado.estaVencida(t);
              const completada = t.estado === 'completada';
              const colorFecha = completada ? 'var(--suave)' : vencida ? 'var(--rojo)' : '';
              return `
                <tr class="${completada ? 'completada' : ''}">
                  <td>
                    <div class="proyecto-nombre">
                      <span class="casilla ${completada ? 'marcada' : ''}" data-marcar="${t.id}">${completada ? '✓' : ''}</span>
                      <strong>${UI.escapar(t.nombre)}</strong>
                      ${t.esIncidencia ? '<span class="chip gris">Incidencia</span>' : ''}
                    </div>
                  </td>
                  <td>${UI.personaLinea(t.responsableId)}</td>
                  <td style="color:${colorFecha};font-size:12.5px">
                    ${UI.fecha(t.fechaLimite)}<br><small>${completada ? 'Completada' : UI.vencimiento(t.fechaLimite)}</small>
                  </td>
                  <td>${UI.chipPrioridad(t.prioridad)}</td>
                  <td>${t.riesgo ? `<span class="chip ambar">${Estado.CAUSAS[t.riesgo.causa]}</span>` : '<span style="color:#b6c0d2">—</span>'}</td>
                  <td style="text-align:right">
                    <button class="boton-texto" data-reasignar="${t.id}">Reasignar</button>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </section>`;
  },

  /* --- pestaña RIESGOS (funcional) ------------------------- */
  panelRiesgos (p) {
    const riesgos = Estado.tareasDe(p.id).filter(Estado.enRiesgo);

    const explicacion = `
      <section class="panel" style="margin-bottom:14px">
        <div class="panel-cabeza" style="margin-bottom:12px">
          <div>
            <h2>Cómo se marca un riesgo</h2>
            <p>Las tres causas que definió el usuario en la validación</p>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <span class="chip ambar">Sin avance · la tarea no se mueve en el plazo definido</span>
          <span class="chip ambar">Espera del cliente · depende de una entrega del cliente</span>
          <span class="chip ambar">Espera de proveedor · depende de un tercero o fabricante</span>
        </div>
      </section>`;

    if (!riesgos.length) {
      return explicacion + `<section class="panel">${UI.vacio('Sin riesgos abiertos','Ninguna tarea de este proyecto está marcada en riesgo.')}</section>`;
    }

    return explicacion + riesgos.map(t => `
      <article class="riesgo">
        <div class="riesgo-top">
          <i class="punto ambar"></i>
          <strong>${UI.escapar(t.nombre)}</strong>
          <span class="chip ambar">${Estado.CAUSAS[t.riesgo.causa]}</span>
          ${UI.avatar(t.responsableId)}
        </div>
        <div class="mitigacion">
          <b style="font-size:11.5px;color:#8e9bb3;letter-spacing:.6px">PLAN DE MITIGACIÓN</b><br>
          ${t.riesgo.mitigacion
            ? UI.escapar(t.riesgo.mitigacion)
            : '<em>Sin plan definido todavía.</em>'}
        </div>
        <div style="margin-top:11px;display:flex;gap:8px">
          <button class="boton sutil" data-mitigar="${t.id}">
            ${t.riesgo.mitigacion ? 'Editar mitigación' : 'Definir mitigación'}
          </button>
          <button class="boton secundario" data-quitar-riesgo="${t.id}">Quitar riesgo</button>
        </div>
      </article>`).join('');
  },

  /* --- bloque de trabajo pendiente ------------------------- */
  panelPendiente (titulo, texto, puntos, quien) {
    return `
      <div class="pendiente">
        <h2>${titulo}</h2>
        <p>${texto}</p>
        <ul>${puntos.map(x => `<li>${x}</li>`).join('')}</ul>
        <span class="quien">${quien}</span>
      </div>`;
  },

  /* --- eventos --------------------------------------------- */
  montar () {
    const raiz = document.querySelector('#vista');

    raiz.querySelectorAll('.pestana').forEach(b =>
      b.addEventListener('click', () => {
        this.pestana = b.dataset.pestana;
        App.render();
      }));

    raiz.querySelectorAll('[data-marcar]').forEach(el =>
      el.addEventListener('click', () => {
        const t = Estado.alternarTarea(el.dataset.marcar);
        UI.toast(t.estado === 'completada' ? 'Tarea completada.' : 'Tarea reabierta.');
      }));

    raiz.querySelectorAll('[data-reasignar]').forEach(b =>
      b.addEventListener('click', () => this.abrirReasignar(b.dataset.reasignar)));

    raiz.querySelectorAll('[data-mitigar]').forEach(b =>
      b.addEventListener('click', () => this.abrirMitigacion(b.dataset.mitigar)));

    raiz.querySelectorAll('[data-quitar-riesgo]').forEach(b =>
      b.addEventListener('click', () => {
        Estado.marcarRiesgo(b.dataset.quitarRiesgo, null);
        UI.toast('Riesgo cerrado.');
      }));

    raiz.querySelectorAll('[data-pagar-proyecto]').forEach(b =>
      b.addEventListener('click', () => {
        Estado.marcarFacturaPagada(b.dataset.pagarProyecto);
        UI.toast('Factura marcada como pagada.');
      }));
  },

  abrirReasignar (tareaId) {
    const t = Estado.tareas().find(x => x.id === tareaId);
    UI.modal(`
      <h2>Reasignar tarea</h2>
      <p class="modal-sub">${UI.escapar(t.nombre)}</p>
      <label class="campo">Nuevo responsable
        <select id="nuevoResp">
          ${Estado.personas().map(p =>
            `<option value="${p.id}" ${p.id === t.responsableId ? 'selected' : ''}>${UI.escapar(p.nombre)} · ${UI.escapar(p.rol)}</option>`).join('')}
        </select>
      </label>
      <div class="modal-acciones">
        <button class="boton secundario" data-cerrar>Cancelar</button>
        <button class="boton primario" id="guardarResp">Guardar</button>
      </div>`,
      dlg => dlg.querySelector('#guardarResp').addEventListener('click', () => {
        Estado.reasignarTarea(tareaId, dlg.querySelector('#nuevoResp').value);
        UI.cerrarModal();
        UI.toast('Tarea reasignada.');
      }));
  },

  abrirMitigacion (tareaId) {
    const t = Estado.tareas().find(x => x.id === tareaId);
    UI.modal(`
      <h2>Plan de mitigación</h2>
      <p class="modal-sub">${UI.escapar(t.nombre)} · ${Estado.CAUSAS[t.riesgo.causa]}</p>
      <label class="campo">¿Qué se va a hacer para destrabar esta tarea?
        <textarea id="textoMitiga" rows="4" placeholder="Ej. Escalar al patrocinador del cliente y fijar nueva fecha de entrega.">${UI.escapar(t.riesgo.mitigacion || '')}</textarea>
      </label>
      <div class="modal-acciones">
        <button class="boton secundario" data-cerrar>Cancelar</button>
        <button class="boton primario" id="guardarMitiga">Guardar</button>
      </div>`,
      dlg => dlg.querySelector('#guardarMitiga').addEventListener('click', () => {
        Estado.guardarMitigacion(tareaId, dlg.querySelector('#textoMitiga').value.trim());
        UI.cerrarModal();
        UI.toast('Plan de mitigación guardado.');
      }));
  }
};
