export type TicketLine = { nombre: string; cantidad: number; precio: number; subtotal: number };
export type Ticket = { folio: string; fecha: string; cajero: string; total: number; metodo: string; items: TicketLine[] };

export function formatTicket(ticket: Ticket) {
  return [
    'CIBER PISTE POS',
    '--------------------------------',
    `Folio: ${ticket.folio}`,
    `Fecha: ${ticket.fecha}`,
    `Cajero: ${ticket.cajero}`,
    '--------------------------------',
    ...ticket.items.map(i => `${i.cantidad} x ${i.nombre}\n$${i.subtotal.toFixed(2)}`),
    '--------------------------------',
    `TOTAL: $${ticket.total.toFixed(2)}`,
    `Pago: ${ticket.metodo}`,
    'Gracias por su compra',
  ].join('\n');
}
