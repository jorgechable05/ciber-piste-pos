# CIBER PISTE POS — Plan de pruebas de concurrencia y consistencia

## Objetivo

Validar el flujo transaccional de ventas sin utilizar datos reales de producción. Las pruebas deben ejecutarse únicamente contra un entorno aislado de CIBER PISTE POS.

## Regla de aislamiento

- No ejecutar estas pruebas contra producción.
- No utilizar cuentas de clientes reales para generar ventas de prueba.
- No modificar THOP.
- Crear datos de prueba identificables y eliminarlos al finalizar, o destruir la rama de pruebas.

## Escenario A — Última unidad

Preparar un producto de prueba con stock = 1 y dos sesiones autenticadas de cajero.

Lanzar dos llamadas concurrentes a `create_pos_sale()` con solicitudes independientes para el mismo producto.

### Resultado esperado

- exactamente 1 venta aprobada;
- exactamente 1 operación rechazada por stock insuficiente/concurrencia;
- stock final = 0;
- exactamente 1 movimiento de salida;
- ningún inventario negativo;
- ningún cobro duplicado;
- ningún movimiento huérfano.

## Escenario B — Idempotencia

Enviar dos solicitudes simultáneas con el mismo `client_request_id`.

### Resultado esperado

- una sola venta persistida;
- una sola aplicación de inventario;
- una sola afectación de caja;
- la segunda llamada devuelve/reconoce la operación existente;
- la restricción UNIQUE de PostgreSQL impide duplicados incluso bajo carrera.

## Escenario C — Stock insuficiente

Intentar vender más unidades que el stock disponible, tanto secuencial como concurrentemente.

### Resultado esperado

- operación rechazada de forma atómica;
- inventario sin cambios por la operación rechazada;
- caja sin movimiento por la operación rechazada;
- sin venta parcialmente creada.

## Escenario D — Doble cobro

Repetir una solicitud de cobro debido a doble clic/reintento de red.

### Resultado esperado

- una sola venta efectiva;
- un solo movimiento de caja;
- un solo descuento de inventario;
- ninguna duplicación por reintento.

## Escenario E — Dos cajeros, productos diferentes

Ejecutar ventas simultáneas de productos diferentes desde dos sesiones autenticadas.

### Resultado esperado

Ambas ventas pueden aprobarse cuando existe stock suficiente y cada una conserva sus cantidades, cajero, caja y movimientos correctos.

## Escenario F — Rollback

Provocar un error después de iniciar la operación transaccional.

### Resultado esperado

- rollback completo;
- ninguna venta parcial;
- ningún detalle parcial;
- ningún descuento de inventario parcial;
- ningún movimiento de caja parcial.

## Escenario G — Pagos

Probar efectivo exacto, efectivo con cambio, tarjeta, transferencia y pago mixto.

### Resultado esperado

- total de pagos = total de venta;
- el cambio no se contabiliza como ingreso adicional;
- los métodos individuales suman exactamente el importe cobrado;
- no existe cobro duplicado.

## Escenario H — Devolución

Probar devolución parcial, total y devolución superior a lo vendido.

### Resultado esperado

- nunca devolver más unidades de las vendidas;
- inventario se repone exactamente una vez;
- caja/refund queda registrado correctamente;
- devolución repetida de la misma cantidad no puede duplicar el reintegro.

## Escenario I — Cierre diario

Crear ventas de prueba en las seis secciones y ejecutar el cierre.

Secciones:

- PALETAS NESTLÉ
- PAPELERÍA
- BISUTERÍA
- REFRESCOS
- RTC
- SERVICIOS

### Resultado esperado

- suma por secciones = total de ventas del día;
- total del cierre = suma de sus secciones;
- caja y ventas son conciliables;
- ninguna venta desaparece del reporte.

## Evidencia requerida

Cada escenario debe conservar:

1. identificador de ejecución;
2. hora de inicio/fin;
3. usuarios de prueba;
4. `client_request_id` utilizados;
5. resultado de cada llamada;
6. stock antes/después;
7. número de movimientos de inventario;
8. número de ventas creadas;
9. movimientos de caja;
10. resultado PASS/FAIL.

## Criterio de aprobación

No se considera aprobada la concurrencia hasta demostrar mediante resultados observables que la base mantiene invariantes de inventario, ventas, caja e idempotencia bajo solicitudes simultáneas.
