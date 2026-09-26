import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CIBER PISTE POS',
  description: 'Punto de venta e inventario de CIBER PISTE',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
