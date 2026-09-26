# Arquitectura CIBER PISTE POS V1

## Principios
- Proyecto aislado de THOP.
- PostgreSQL como fuente de verdad.
- Operaciones críticas de venta e inventario transaccionales.
- RBAC + RLS.
- Precios históricos almacenados en el detalle de venta.
- Inventario basado en movimientos y stock actual.
- POS responsive para PC, laptop y tablet.
- Lectores USB/Bluetooth HID tratados como entrada de teclado.

## Módulos
1. Autenticación y usuarios
2. Roles y permisos
3. Dashboard
4. POS / ventas
5. Caja y pagos
6. Productos y categorías
7. Inventario
8. Compras y proveedores
9. Servicios
10. Reportes y analítica
11. Cierres diarios
12. Auditoría

## Secciones iniciales
- PALETAS NESTLÉ
- PAPELERÍA
- BISUTERÍA
- REFRESCOS
- RTC
- SERVICIOS

## Flujo de venta
Escaneo/búsqueda -> carrito -> validación de stock -> transacción -> detalle de venta -> pago -> movimiento de inventario -> ticket.

## Automatizaciones
- Cierre diario por sección.
- Rotación por ventanas de venta.
- Detección de baja/sin rotación.
- Sugerencia de compra usando demanda promedio, lead time, stock de seguridad y stock actual.
