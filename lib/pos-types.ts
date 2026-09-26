export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';

export type PosItem = {
  producto_id: number;
  nombre: string;
  codigo_barras?: string | null;
  precio_venta: number;
  cantidad: number;
  descuento: number;
};

export type PosPayment = {
  metodo: PaymentMethod;
  monto: number;
  referencia?: string;
};
