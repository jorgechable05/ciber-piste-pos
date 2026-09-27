const { test, expect } = require('@playwright/test');

test.describe('CIBER PISTE POS - DEMO aislada', () => {
  test('flujo completo DEMO sin tocar Supabase', async ({ page }) => {
    const supabaseRequests = [];
    page.on('request', request => {
      const url = request.url();
      if (/supabase\.(co|in)|supabase\.com/i.test(url)) supabaseRequests.push(url);
    });

    await page.goto('http://127.0.0.1:3000/demo');
    await expect(page.getByText('EXPERIENCIA DEMO AISLADA')).toBeVisible();

    await page.getByRole('button', { name: /Entrar a la experiencia/i }).click();
    await expect(page.getByText('ENTORNO DE PRUEBA')).toBeVisible();

    await page.getByRole('button', { name: /Caja cerrada/i }).click();
    await expect(page.getByText('Abre tu caja demo')).toBeVisible();
    await page.getByRole('button', { name: /Abrir caja de prueba/i }).click();
    await expect(page.getByText(/Caja abierta/i)).toBeVisible();

    await page.getByRole('button', { name: /^POS/ }).click();
    await expect(page.getByText('Listo para cobrar')).toBeVisible();

    const search = page.getByPlaceholder('Escanea o busca por nombre o código...');
    await search.fill('Libreta profesional Norma');
    await page.getByRole('button', { name: /Libreta profesional Norma/i }).click();
    await expect(page.getByRole('button', { name: /Cobrar \$92\.00/i })).toBeVisible();

    await page.getByRole('button', { name: /Cobrar \$92\.00/i }).click();
    await expect(page.getByText('¿Cómo paga el cliente?')).toBeVisible();

    const amountInputs = page.locator('.payment-line input[type="number"]');
    await expect(amountInputs).toHaveCount(1);
    await amountInputs.first().fill('100');
    await expect(page.getByText('Cambio')).toBeVisible();
    await expect(page.getByText('$8.00')).toBeVisible();
    await page.getByRole('button', { name: /Confirmar cobro/i }).click();
    await expect(page.getByText(/DEMO-00001/)).toBeVisible();

    await page.getByRole('button', { name: /Reimprimir/i }).click();

    // Segunda venta: pago mixto.
    await search.fill('Pluma azul punto fino');
    await page.getByRole('button', { name: /Pluma azul punto fino/i }).click();
    await page.getByRole('button', { name: /Cobrar \$12\.00/i }).click();
    await amountInputs.first().fill('6');
    await page.getByRole('button', { name: /Agregar otro método/i }).click();
    await page.locator('.payment-line').nth(1).locator('select').selectOption('TARJETA');
    await page.locator('.payment-line').nth(1).locator('input').fill('6');
    await expect(page.getByText('Pago mixto')).toBeVisible();
    await page.getByRole('button', { name: /Confirmar cobro/i }).click();
    await expect(page.getByText(/DEMO-00002/)).toBeVisible();

    // Devolución DEMO.
    await page.getByRole('button', { name: /^Devoluciones/ }).click();
    await expect(page.getByText('Devoluciones demo')).toBeVisible();
    await page.getByRole('button', { name: /Simular devolución/i }).click();
    await expect(page.getByText(/devolución simulada correctamente/i)).toBeVisible();

    // Dashboard DEMO.
    await page.getByRole('button', { name: /^Dashboard/ }).click();
    await expect(page.getByText('Todo listo para mostrar')).toBeVisible();

    // Cierre: el estado debe pasar realmente a CERRADA.
    await page.getByRole('button', { name: /Ver caja/i }).click();
    await page.getByRole('button', { name: /Realizar cierre de prueba/i }).click();
    await expect(page.getByText('✓ Cierre realizado')).toBeVisible();
    await expect(page.getByText('CERRADA')).toBeVisible();

    expect(supabaseRequests, 'La DEMO no debe contactar Supabase').toEqual([]);
  });
});
