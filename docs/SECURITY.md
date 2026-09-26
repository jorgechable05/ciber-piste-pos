# Seguridad V1

- No exponer claves service-role en el cliente.
- Autenticación mediante Supabase Auth.
- Autorización por rol y permisos.
- RLS en tablas sensibles.
- Las funciones transaccionales validan usuario, permisos, stock y totales.
- Nunca confiar en precios enviados por el navegador.
- Los precios históricos se conservan en detalle_ventas.
- Las ventas no se eliminan físicamente; se cancelan y auditan.
- Los movimientos de inventario son inmutables; correcciones mediante movimientos compensatorios.
- Auditoría de acciones administrativas y operaciones sensibles.
- Pruebas de concurrencia para evitar sobreventa.
