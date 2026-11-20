/* ===========================================================
   vistas/horas.js · PENDIENTE (trabajo del equipo)
   -----------------------------------------------------------
   Responde al feedback de Oscar del 4 de noviembre:
   horas disponibles, horas invertidas, productividad y horas
   facturables como insumo del ingreso del proyecto.
   Datos listos en datos.js → registroHoras y personas.
   Mira TODO.md, tarea 2.
   =========================================================== */

const VistaHoras = {
  miga: () => '<a href="#/resumen">Inicio</a><span>/</span><strong>Horas y equipo</strong>',

  render () {
    const registro = Estado.registroHoras();
    const invertidas = registro.reduce((s, r) => s + r.horas, 0);
    const facturables = registro.filter(r => r.facturable).reduce((s, r) => s + r.horas, 0);
    const disponibles = Estado.personas().reduce((s, p) => s + p.horasDisponibles, 0);

    return `
      <section class="encabezado">
        <div>
          <h1>Horas y equipo</h1>
          <p class="sub">Capacidad del equipo, horas invertidas y productividad por proyecto.</p>
        </div>
      </section>

      <section class="kpis" style="grid-template-columns:repeat(3,1fr)">
        <article class="kpi">
          <div class="kpi-top"><span class="kpi-label">Horas disponibles</span></div>
          <strong>${disponibles}</strong><p>capacidad del mes</p>
        </article>
        <article class="kpi">
          <div class="kpi-top"><span class="kpi-label">Horas invertidas</span></div>
          <strong>${invertidas}</strong><p>${Math.round(invertidas / disponibles * 100)}% de la capacidad</p>
        </article>
        <article class="kpi">
          <div class="kpi-top"><span class="kpi-label">Horas facturables</span></div>
          <strong>${facturables}</strong><p>${Math.round(facturables / invertidas * 100)}% del total invertido</p>
        </article>
      </section>

      <div class="pendiente">
        <h2>Pantalla por construir</h2>
        <p>Los totales ya salen del registro de horas. Falta abrirlos por persona y por proyecto,
           que es lo que pidió el usuario en la validación.</p>
        <ul>
          <li>Tabla por persona: horas disponibles, invertidas, facturables y porcentaje de ocupación</li>
          <li>Tabla por proyecto: horas presupuestadas contra horas consumidas</li>
          <li>Productividad: comparar el consumo de horas contra el avance real del proyecto
              (<code>Estado.proyecto(id).avanceReal</code>)</li>
          <li>Señalar en rojo los proyectos donde el consumo de horas va más de 15 puntos
              por encima del avance</li>
          <li>Horas facturables acumuladas por proyecto, como insumo del ingreso</li>
        </ul>
        <span class="quien">Pendiente del equipo · ver TODO.md, tarea 2</span>
      </div>
    `;
  },

  montar () {}
};
