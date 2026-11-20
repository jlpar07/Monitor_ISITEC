# Monitor de seguimiento · ISITEC

Prototipo funcional del cluster F (Seguimiento y control) del proyecto de
Sistemas Empresariales. Grupo 6, Universidad de los Andes.

## Cómo abrirlo

Abre `index.html` con doble clic. No necesita servidor, ni instalación, ni internet
(salvo las tipografías de Google, que si no cargan se reemplazan por las del sistema).

## Qué cambió frente al prototipo anterior

El profesor señaló que la versión anterior tenía demasiado en una sola pantalla.
Esta versión parte la aplicación en cinco pantallas y deja el resumen con lo mínimo:

| Pantalla | Para qué sirve |
|---|---|
| Resumen | Responde una sola pregunta: ¿qué necesita mi atención hoy? |
| Proyectos | Listado con avance real contra esperado y cierre proyectado |
| Detalle de proyecto | Tareas, riesgos, horas y facturación de un proyecto |
| Alertas | Lo que el sistema detectó solo, con opción de marcar como atendida |
| Facturación | Facturas por cobrar, vencidas y facturado contra avance |
| Horas y equipo | Ocupación por persona, productividad (horas vs avance) e ingreso por horas facturables |

Además, ahora la aplicación **funciona de verdad**: las acciones cambian los datos
y quedan guardadas en el navegador, no son solo mensajes en pantalla.

## Estructura del código

```
index.html              Esqueleto: menú lateral, barra superior y contenedor de vistas
css/styles.css          Toda la hoja de estilos, dividida en secciones
js/datos.js             Datos de ejemplo. Aquí se conectarán las fuentes reales
js/estado.js            Estado, persistencia y cálculos (avance, desviación, alertas)
js/ui.js                Utilidades: formato, toast, modal, descarga de archivos
js/vistas/*.js          Una vista por pantalla
js/app.js               Enrutador y acciones de la barra superior
```

La regla es simple: **las vistas nunca tocan los datos directamente**, siempre pasan
por `Estado`. Así, cuando conectemos el sistema contable y el registro de horas,
solo cambia `datos.js` y el resto sigue igual.

## Cómo agregar una pantalla nueva

1. Crea `js/vistas/mivista.js` con un objeto que tenga `miga()`, `render()` y, si
   necesita eventos, `montar()`.
2. Agrégalo al `<script>` en `index.html` y al objeto `RUTAS` en `js/app.js`.
3. Agrega el enlace en el menú lateral con `data-ruta="mivista"`.

## Cálculos que ya están implementados

- **Avance esperado**: qué porcentaje del cronograma ya transcurrió
- **Desviación**: avance real menos avance esperado, en puntos
- **Semáforo**: en tiempo (−5 o mejor), en riesgo (−15 a −5), crítico (peor que −15)
- **Cierre proyectado**: al ritmo actual, en qué fecha termina y cuántos días se desvía
- **Alertas**: se derivan de las tareas vencidas, los bloqueos y las facturas vencidas

## Qué falta

Ver `TODO.md`, con seis tareas repartibles.
