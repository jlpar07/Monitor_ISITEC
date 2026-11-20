/* ===========================================================
   estado.js · Estado de la aplicación y cálculos
   -----------------------------------------------------------
   Guarda en localStorage, expone lecturas y mutaciones, y
   calcula los indicadores derivados (avance esperado,
   desviación, proyección de cierre, alertas).
   Nadie debe tocar el arreglo de datos directamente:
   siempre a través de Estado.
   =========================================================== */

const Estado = (function () {
  const LLAVE = 'isitec.monitor.v1';
  let datos = cargar();
  const suscriptores = [];

  /* --- persistencia ---------------------------------------- */
  function cargar () {
    try {
      const crudo = localStorage.getItem(LLAVE);
      if (crudo) {
        const d = JSON.parse(crudo);
        if (d && d.version === DATOS_SEMILLA.version) return d;
      }
    } catch (e) { /* localStorage bloqueado: seguimos en memoria */ }
    return structuredClone(DATOS_SEMILLA);
  }

  function guardar () {
    try { localStorage.setItem(LLAVE, JSON.stringify(datos)); }
    catch (e) { /* sin persistencia, la sesión sigue funcionando */ }
    suscriptores.forEach(fn => fn());
  }

  function reiniciar () {
    datos = structuredClone(DATOS_SEMILLA);
    guardar();
  }

  function alCambiar (fn) { suscriptores.push(fn); }

  /* --- utilidades de fecha --------------------------------- */
  const HOY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const fecha = s => { const d = new Date(s + 'T00:00:00'); return d; };
  const dias  = (a, b) => Math.round((fecha(b) - fecha(a)) / 86400000);
  const hoyISO = () => HOY.toISOString().slice(0,10);
  const diasDesdeHoy = s => Math.round((fecha(s) - HOY) / 86400000);

  /* --- lecturas simples ------------------------------------ */
  const proyectos = () => datos.proyectos;
  const tareas    = () => datos.tareas;
  const personas  = () => datos.personas;
  const clientes  = () => datos.clientes;
  const facturas  = () => datos.facturas;
  const registroHoras = () => datos.registroHoras;

  const proyecto = id => datos.proyectos.find(p => p.id === id);
  const persona  = id => datos.personas.find(p => p.id === id);
  const cliente  = id => datos.clientes.find(c => c.id === id);
  const tareasDe = id => datos.tareas.filter(t => t.proyectoId === id);

  /* --- cálculos de proyecto -------------------------------- */

  /* % del cronograma que ya transcurrió */
  function avanceEsperado (p) {
    const total = dias(p.inicio, p.finPlan);
    if (total <= 0) return 100;
    const corridos = dias(p.inicio, hoyISO());
    return Math.max(0, Math.min(100, Math.round(corridos / total * 100)));
  }

  /* Diferencia entre lo que lleva y lo que debería llevar.
     Es el indicador que pidió Oscar: avance real vs estimado. */
  function desviacion (p) { return p.avanceReal - avanceEsperado(p); }

  /* Semáforo del proyecto, derivado de la desviación */
  function semaforo (p) {
    const d = desviacion(p);
    if (d >= -5)  return { clave:'verde', texto:'En tiempo' };
    if (d >= -15) return { clave:'ambar', texto:'En riesgo' };
    return { clave:'rojo', texto:'Crítico' };
  }

  /* Proyección de cierre: a este ritmo, ¿cuándo termina?
     Devuelve {fecha, desvioDias} o null si aún no hay ritmo. */
  function proyeccionCierre (p) {
    const corridos = dias(p.inicio, hoyISO());
    if (corridos <= 0 || p.avanceReal <= 0) return null;
    const ritmo = p.avanceReal / corridos;                 // % por día
    const faltan = Math.ceil((100 - p.avanceReal) / ritmo);
    const d = new Date(HOY); d.setDate(d.getDate() + faltan);
    const iso = d.toISOString().slice(0,10);
    return { fecha: iso, desvioDias: dias(p.finPlan, iso) };
  }

  /* --- cálculos de horas y productividad ------------------- */
  /* Feedback de Oscar (4 nov): horas disponibles vs invertidas,
     productividad (las horas deben reflejarse en avance) y horas
     facturables como insumo del ingreso. */

  const UMBRAL_PRODUCTIVIDAD = 15;   // pts de consumo por encima del avance

  const sumaHoras = lista => lista.reduce((s, r) => s + r.horas, 0);
  const horasDelMes = () => datos.registroHoras.filter(r => (r.mes || 0) === 0);

  /* Ocupación de una persona en el mes en curso */
  function horasPersona (personaId) {
    const per = persona(personaId);
    const reg = horasDelMes().filter(r => r.personaId === personaId);
    const invertidas  = sumaHoras(reg);
    const facturables = sumaHoras(reg.filter(r => r.facturable));
    const disponibles = per ? per.horasDisponibles : 0;
    return {
      disponibles, invertidas, facturables,
      libres: disponibles - invertidas,
      ocupacion: disponibles ? Math.round(invertidas / disponibles * 100) : 0,
      pctFacturable: invertidas ? Math.round(facturables / invertidas * 100) : 0,
      proyectos: [...new Set(reg.map(r => r.proyectoId))]
    };
  }

  /* Consumo acumulado del proyecto frente a su presupuesto y su avance */
  function horasProyecto (p) {
    const reg = datos.registroHoras.filter(r => r.proyectoId === p.id);
    const consumidas  = sumaHoras(reg);
    const facturables = sumaHoras(reg.filter(r => r.facturable));
    const pctConsumo  = p.horasPresupuesto ? Math.round(consumidas / p.horasPresupuesto * 100) : 0;
    const brecha      = pctConsumo - p.avanceReal;          // + = gasta más de lo que avanza
    /* Valor hora implícito del contrato: mientras no tengamos la tarifa
       real del sistema contable, se aproxima como contrato / horas. */
    const valorHora   = p.horasPresupuesto ? p.valorContrato / p.horasPresupuesto : 0;
    const facturado   = facturas().filter(f => f.proyectoId === p.id).reduce((s, f) => s + f.monto, 0);
    const ingresoHoras = Math.round(facturables * valorHora);
    return {
      presupuesto: p.horasPresupuesto, consumidas, facturables,
      noFacturables: consumidas - facturables,
      restantes: p.horasPresupuesto - consumidas,
      pctConsumo, brecha, valorHora, ingresoHoras, facturado,
      sinFacturar: Math.max(0, ingresoHoras - facturado),
      porPersona: [...new Set(reg.map(r => r.personaId))].map(id => {
        const rp = reg.filter(r => r.personaId === id);
        return { personaId: id, horas: sumaHoras(rp), facturables: sumaHoras(rp.filter(r => r.facturable)),
                 mes: sumaHoras(rp.filter(r => (r.mes || 0) === 0)) };
      }).sort((a, b) => b.horas - a.horas)
    };
  }

  /* Semáforo de productividad: ¿las horas se están volviendo avance? */
  function productividad (p) {
    const b = horasProyecto(p).brecha;
    if (b > UMBRAL_PRODUCTIVIDAD) return { clave:'rojo',  texto:'Consumo sobre el avance' };
    if (b > 5)                    return { clave:'ambar', texto:'Vigilar consumo' };
    return { clave:'verde', texto:'Productivo' };
  }

  /* --- cálculos de tareas ---------------------------------- */
  const estaVencida = t => t.estado !== 'completada' && diasDesdeHoy(t.fechaLimite) < 0;
  const enRiesgo    = t => t.estado !== 'completada' && !!t.riesgo;

  const tareasVencidas  = () => datos.tareas.filter(estaVencida);
  const tareasEnRiesgo  = () => datos.tareas.filter(enRiesgo);
  const incidencias     = () => datos.tareas.filter(t => t.esIncidencia);

  const CAUSAS = {
    sin_avance:       'Sin avance',
    espera_cliente:   'Espera del cliente',
    espera_proveedor: 'Espera de proveedor'
  };

  /* --- alertas (se generan de los datos, no están quemadas) - */
  function alertas () {
    const lista = [];

    proyectos().forEach(p => {
      const vencidas = tareasDe(p.id).filter(estaVencida);
      if (vencidas.length) lista.push({
        id: 'venc-' + p.id, tipo: 'vencida',
        titulo: `${vencidas.length} tarea${vencidas.length > 1 ? 's' : ''} vencida${vencidas.length > 1 ? 's' : ''}`,
        detalle: p.nombre, proyectoId: p.id
      });
    });

    tareasEnRiesgo().filter(t => t.riesgo.causa !== 'sin_avance').forEach(t => {
      lista.push({
        id: 'bloq-' + t.id, tipo: 'bloqueo',
        titulo: 'Bloqueo: ' + CAUSAS[t.riesgo.causa],
        detalle: t.nombre, proyectoId: t.proyectoId
      });
    });

    const vencidasFact = facturas().filter(f => f.estado === 'pendiente' && diasDesdeHoy(f.vencimiento) < 0);
    if (vencidasFact.length) lista.push({
      id: 'fact-vencidas', tipo: 'factura',
      titulo: `${vencidasFact.length} factura${vencidasFact.length > 1 ? 's' : ''} vencida${vencidasFact.length > 1 ? 's' : ''}`,
      detalle: 'Facturación pendiente de cobro', proyectoId: null
    });

    return lista.map(a => ({ ...a, atendida: datos.alertasAtendidas.includes(a.id) }));
  }

  const alertasAbiertas = () => alertas().filter(a => !a.atendida);

  /* --- totales para los indicadores del resumen ------------- */
  function totales () {
    const pendientes = facturas().filter(f => f.estado === 'pendiente');
    return {
      proyectosActivos: proyectos().length,
      tareasVencidas:   tareasVencidas().length,
      enRiesgo:         tareasEnRiesgo().length,
      facturacionPendiente: pendientes.reduce((s, f) => s + f.monto, 0),
      facturasPendientes:   pendientes.length
    };
  }

  /* --- mutaciones ------------------------------------------ */
  function alternarTarea (id) {
    const t = datos.tareas.find(x => x.id === id);
    if (!t) return;
    t.estado = t.estado === 'completada' ? 'pendiente' : 'completada';
    guardar();
    return t;
  }

  function marcarFacturaPagada (id) {
    const factura = datos.facturas.find(x => x.id === id);
    if (!factura) return;
    factura.estado = 'pagada';
    guardar();
    return factura;
  }

  function crearTarea ({ nombre, proyectoId, responsableId, fechaLimite, prioridad, esIncidencia }) {
    const t = {
      id: 't' + Date.now(),
      proyectoId, nombre, responsableId, fechaLimite,
      prioridad: prioridad || 'media',
      estado: 'pendiente',
      riesgo: null,
      esIncidencia: !!esIncidencia
    };
    datos.tareas.push(t);
    guardar();
    return t;
  }

  function reasignarTarea (id, responsableId) {
    const t = datos.tareas.find(x => x.id === id);
    if (t) { t.responsableId = responsableId; guardar(); }
    return t;
  }

  /* Respuesta directa al feedback de Oscar:
     cada riesgo guarda su plan de mitigación. */
  function guardarMitigacion (tareaId, texto) {
    const t = datos.tareas.find(x => x.id === tareaId);
    if (t && t.riesgo) { t.riesgo.mitigacion = texto; guardar(); }
    return t;
  }

  function marcarRiesgo (tareaId, causa) {
    const t = datos.tareas.find(x => x.id === tareaId);
    if (!t) return;
    t.riesgo = causa ? { causa, mitigacion: (t.riesgo && t.riesgo.mitigacion) || '' } : null;
    guardar();
    return t;
  }

  function atenderAlerta (id) {
    if (!datos.alertasAtendidas.includes(id)) datos.alertasAtendidas.push(id);
    guardar();
  }

  /* --- API pública ----------------------------------------- */
  return {
    alCambiar, reiniciar, guardar,
    proyectos, proyecto, tareas, tareasDe, personas, persona, clientes, cliente,
    facturas, registroHoras,
    avanceEsperado, desviacion, semaforo, proyeccionCierre,
    horasDelMes, horasPersona, horasProyecto, productividad, UMBRAL_PRODUCTIVIDAD,
    estaVencida, enRiesgo, tareasVencidas, tareasEnRiesgo, incidencias,
    alertas, alertasAbiertas, totales,
    alternarTarea, marcarFacturaPagada, crearTarea, reasignarTarea, guardarMitigacion, marcarRiesgo, atenderAlerta,
    CAUSAS, hoyISO, diasDesdeHoy, dias
  };
})();
