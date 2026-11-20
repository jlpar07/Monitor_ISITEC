# Tareas pendientes · Monitor de seguimiento ISITEC

Lo que ya está construido y lo que falta, para repartir en el equipo.
Cada tarea dice qué archivo tocar y qué datos ya existen.

---

## Lo que YA funciona (no hay que rehacerlo)

- Arquitectura de la app: datos, estado con persistencia y enrutamiento por pantallas
- Pantalla **Resumen**, aligerada según la corrección del profesor
- Pantalla **Proyectos** con filtros por cliente, estado y búsqueda
- **Detalle de proyecto** con avance real contra esperado, desviación y cierre proyectado
- Pestaña **Tareas**: completar, reasignar y crear tareas (se guardan de verdad)
- Pestaña **Riesgos**: causa del riesgo y plan de mitigación editable
- Pantalla **Alertas**, generadas automáticamente de los datos, con "marcar como atendida"
- **Exportar reporte** a CSV con los datos reales de la pantalla

---

## Tarea 1 · Pantalla de Facturación
**Archivo:** `js/vistas/facturacion.js`
**Datos listos:** `Estado.facturas()` → id, proyectoId, numero, monto, emision, vencimiento, estado

Los tres indicadores de arriba ya funcionan. Falta:

- [x] Tabla de facturas: número, proyecto, monto, emisión, vencimiento y estado
- [x] Resaltar las vencidas en rojo y mostrar su antigüedad en días
      (usa `Estado.diasDesdeHoy(factura.vencimiento)`)
- [x] Filtro por proyecto y por estado
- [x] Botón "Marcar como pagada" — hay que agregar la mutación en `js/estado.js`,
      siguiendo el patrón de `alternarTarea()`
- [x] Comparar lo facturado contra el avance real del proyecto

También hay que llenar la pestaña **Facturación** dentro del detalle de proyecto
(`js/vistas/proyecto.js` → `contenidoPestana`), con las facturas de ese proyecto.

---

## Tarea 2 · Pantalla de Horas y equipo
**Archivo:** `js/vistas/horas.js`
**Datos listos:** `Estado.registroHoras()` y `Estado.personas()` (campo `horasDisponibles`)

Responde al feedback de Oscar del 4 de noviembre. Falta:

- [ ] Tabla por persona: horas disponibles, invertidas, facturables y % de ocupación
- [ ] Tabla por proyecto: horas presupuestadas (`proyecto.horasPresupuesto`) contra consumidas
- [ ] **Productividad**: comparar el % de horas consumidas contra el `avanceReal` del proyecto
- [ ] Marcar en rojo los proyectos donde el consumo de horas va más de 15 puntos
      por encima del avance
- [ ] Horas facturables acumuladas por proyecto, como insumo del ingreso

Igual hay que llenar la pestaña **Horas** del detalle de proyecto.

---

## Tarea 3 · Indicadores de calidad y pruebas
**Archivo:** nuevo, `js/vistas/calidad.js` + enlace en el menú de `index.html`
**Datos listos:** las tareas tienen la bandera `esIncidencia`; usa `Estado.incidencias()`

- [ ] Cantidad de incidencias por proyecto y en total
- [ ] Tiempo invertido en atender incidencias (hay que agregar un campo `horas` a la tarea
      en `datos.js` y pedirlo al crear o cerrar una incidencia)
- [ ] Evolución: incidencias abiertas contra cerradas
- [ ] Mostrar el indicador en el detalle de cada proyecto

---

## Tarea 4 · SPI y rentabilidad
**Archivo:** `js/estado.js` (los cálculos) y el detalle de proyecto

Es lo más difícil porque necesita datos que todavía no tenemos.
Primero hay que confirmar con ISITEC a qué información del sistema contable podemos llegar.

- [ ] Agregar a `datos.js` los campos de costo: `costoPlaneado` y `costoReal` por proyecto
- [ ] **SPI** = valor ganado / valor planeado. Con lo que ya hay se puede aproximar como
      `avanceReal / avanceEsperado`
- [ ] **CPI** y rentabilidad = (valorContrato − costoReal) / valorContrato
- [ ] Proyección de cierre en costo, no solo en tiempo
- [ ] Mostrarlos como una cuarta fila de indicadores en el detalle del proyecto

---

## Tarea 5 · Exportar el reporte en PDF
**Archivo:** `js/app.js` → función `exportarReporte()`

Hoy exporta CSV, que ya sirve. Para la entrega final sería mejor un PDF presentable.

- [ ] Generar un PDF con el logo de ISITEC, la fecha y la tabla de proyectos
- [ ] Incluir las alertas abiertas y los riesgos con su mitigación
- [ ] Sugerencia: `jsPDF` desde CDN, o abrir una ventana con estilos de impresión

---

## Tarea 6 · Pulido final para la sustentación
Repartir entre todos la semana del 17 de noviembre.

- [ ] Revisar que todo se vea bien en la pantalla con la que se va a proyectar
- [ ] Ajustar el menú lateral para pantallas pequeñas (hoy es fijo de 236 px)
- [ ] Revisar textos: que no quede nada en inglés ni ningún "lorem ipsum"
- [ ] Probar el recorrido completo de la demo tres veces seguidas sin errores
- [ ] Dejar los datos de ejemplo en un estado bonito antes de presentar
      (el botón "Reiniciar datos" del menú lateral los restaura)
