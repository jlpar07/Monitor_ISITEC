/* ===========================================================
   vistas/resumen.js · Pantalla de inicio
   -----------------------------------------------------------
   Corrección del profesor: esta pantalla ya NO muestra todas
   las tablas. Solo responde "¿qué necesita mi atención hoy?".
   El detalle vive en Proyectos, Alertas y Facturación.
   =========================================================== */

const VistaResumen = {
  miga: () => '<strong>Resumen</strong>',

  render () {
    const t = Estado.totales();
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

    return `
      <section class="encabezado">
        <div>
          <p class="etiqueta">${UI.fechaLarga(Estado.hoyISO())}</p>
          <h1>${saludo}, Oscar</h1>
          <p class="sub">Esto es lo que necesita tu atención hoy.</p>
        </div>
      </section>

      <section class="kpis">
        ${this.kpi('Proyectos activos', t.proyectosActivos, '', 'azul', '◇')}
        ${this.kpi('Tareas vencidas', t.tareasVencidas, 'requieren acción', 'rojo', '!')}
        ${this.kpi('En riesgo', t.enRiesgo, 'con causa identificada', 'ambar', '△')}
        ${this.kpi('Facturación pendiente', UI.dinero(t.facturacionPendiente),
                   t.facturasPendientes + ' facturas', 'violeta', '$')}
      </section>

      <div class="dos-columnas">
        <section class="panel">
          <div class="panel-cabeza">
            <div>
              <h2>Necesita tu atención</h2>
              <p>Lo más urgente primero, máximo cinco cosas</p>
            </div>
            <a class="boton-texto" href="#/proyectos">Ver proyectos →</a>
          </div>
          ${this.listaAtencion()}
        </section>

        <section class="panel">
          <div class="panel-cabeza">
            <div>
              <h2>Alertas</h2>
              <p>Generadas automáticamente</p>
            </div>
            <a class="boton-texto" href="#/alertas">Ver todas →</a>
          </div>
          ${this.listaAlertas()}
        </section>
      </div>
    `;
  },

  kpi (label, valor, nota, color, icono) {
    const fondo = { azul:'var(--azul-claro)', rojo:'var(--rojo-claro)',
                    ambar:'var(--ambar-claro)', violeta:'#efebfb' }[color];
    const tinta = { azul:'var(--azul)', rojo:'var(--rojo)',
                    ambar:'var(--ambar)', violeta:'var(--violeta)' }[color];
    return `
      <article class="kpi">
        <div class="kpi-top">
          <span class="kpi-label">${label}</span>
          <span class="marca" style="background:${fondo};color:${tinta}">${icono}</span>
        </div>
        <strong>${valor}</strong>
        <p>${nota || '&nbsp;'}</p>
      </article>`;
  },

  /* Combina tareas vencidas y en riesgo, ordenadas por urgencia */
  listaAtencion () {
    const items = Estado.tareas()
      .filter(t => Estado.estaVencida(t) || Estado.enRiesgo(t))
      .sort((a, b) => Estado.diasDesdeHoy(a.fechaLimite) - Estado.diasDesdeHoy(b.fechaLimite))
      .slice(0, 5);

    if (!items.length) return UI.vacio('Todo al día', 'No hay tareas vencidas ni en riesgo.');

    return '<div class="atencion">' + items.map(t => {
      const p = Estado.proyecto(t.proyectoId);
      const vencida = Estado.estaVencida(t);
      const color = vencida ? 'rojo' : 'ambar';
      const fondo = vencida ? 'var(--rojo-claro)' : 'var(--ambar-claro)';
      const tinta = vencida ? 'var(--rojo)' : 'var(--ambar)';
      const causa = t.riesgo ? ' · ' + Estado.CAUSAS[t.riesgo.causa] : '';
      return `
        <a class="atencion-item" href="#/proyecto/${p.id}">
          <span class="icono" style="background:${fondo};color:${tinta}">${vencida ? '!' : '△'}</span>
          <span class="txt">
            <strong>${UI.escapar(t.nombre)}</strong>
            <small>${UI.escapar(p.nombre)} · ${UI.vencimiento(t.fechaLimite)}${UI.escapar(causa)}</small>
          </span>
          ${UI.avatar(t.responsableId)}
          <span class="flecha">→</span>
        </a>`;
    }).join('') + '</div>';
  },

  listaAlertas () {
    const abiertas = Estado.alertasAbiertas().slice(0, 4);
    if (!abiertas.length) return UI.vacio('Sin alertas', 'El monitoreo automático no encontró nada.');

    const estilo = {
      vencida: ['var(--rojo-claro)', 'var(--rojo)', '!'],
      bloqueo: ['var(--ambar-claro)', 'var(--ambar)', '△'],
      factura: ['#efebfb', 'var(--violeta)', '$']
    };

    return '<div class="atencion">' + abiertas.map(a => {
      const [fondo, tinta, icono] = estilo[a.tipo];
      const destino = a.proyectoId ? `#/proyecto/${a.proyectoId}` : '#/facturacion';
      return `
        <a class="atencion-item" href="${destino}">
          <span class="icono" style="background:${fondo};color:${tinta}">${icono}</span>
          <span class="txt">
            <strong>${UI.escapar(a.titulo)}</strong>
            <small>${UI.escapar(a.detalle)}</small>
          </span>
          <span class="flecha">→</span>
        </a>`;
    }).join('') + '</div>';
  }
};
