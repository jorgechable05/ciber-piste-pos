#!/usr/bin/env bash
set -euo pipefail

export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"
export PGDATABASE="${PGDATABASE:-ciber_piste_pos_test}"

psql -v ON_ERROR_STOP=1 -f tests/postgres/concurrency_schema.sql
psql -v ON_ERROR_STOP=1 -c 'select 1 as postgres_ready;'

USER_A='11111111-1111-1111-1111-111111111111'
USER_B='22222222-2222-2222-2222-222222222222'
ITEMS='[{"producto_id":1,"cantidad":1,"descuento":0}]'
PAYMENT='[{"metodo":"EFECTIVO","monto":100}]'

cat > /tmp/a.sql <<SQL
BEGIN;
SELECT create_pos_sale_test('${USER_A}', '${ITEMS}'::jsonb, '${PAYMENT}'::jsonb);
SELECT pg_sleep(1);
COMMIT;
SQL

cat > /tmp/b.sql <<SQL
BEGIN;
SELECT create_pos_sale_test('${USER_B}', '${ITEMS}'::jsonb, '${PAYMENT}'::jsonb);
COMMIT;
SQL

set +e
psql -v ON_ERROR_STOP=1 -f /tmp/a.sql > /tmp/a.out 2>&1 &
PID_A=$!
sleep 0.15
psql -v ON_ERROR_STOP=1 -f /tmp/b.sql > /tmp/b.out 2>&1
STATUS_B=$?
wait "$PID_A"
STATUS_A=$?
set -e

printf '\n--- CAJERO A ---\n'; cat /tmp/a.out
printf '\n--- CAJERO B ---\n'; cat /tmp/b.out

if [[ "$STATUS_A" -eq 0 && "$STATUS_B" -ne 0 ]]; then
  echo 'PASS: exactly one concurrent sale succeeded.'
else
  echo 'FAIL: expected one success and one stock rejection.'
  exit 1
fi

STOCK=$(psql -At -v ON_ERROR_STOP=1 -c "select case when stock_actual = 0 then '0' else stock_actual::text end from inventory where producto_id=1")
SALES=$(psql -At -v ON_ERROR_STOP=1 -c "select count(*) from sales")
MOVES=$(psql -At -v ON_ERROR_STOP=1 -c "select count(*) from inventory_movements where producto_id=1 and tipo='VENTA'")
PAYMENTS=$(psql -At -v ON_ERROR_STOP=1 -c "select count(*) from sale_payments")

printf '\n--- INTEGRIDAD ---\n'
printf 'stock=%s\nsales=%s\ninventory_sale_movements=%s\npayments=%s\n' "$STOCK" "$SALES" "$MOVES" "$PAYMENTS"

[[ "$STOCK" == '0' ]] || { echo 'FAIL: expected stock 0'; exit 1; }
[[ "$SALES" == '1' ]] || { echo 'FAIL: expected 1 sale'; exit 1; }
[[ "$MOVES" == '1' ]] || { echo 'FAIL: expected 1 inventory movement'; exit 1; }
[[ "$PAYMENTS" == '1' ]] || { echo 'FAIL: expected 1 payment'; exit 1; }
echo 'PASS: inventory, sale, movement and payment counts are consistent.'

# Idempotency: the same request ID must return the same sale and create no second sale.
psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  u uuid := '33333333-3333-3333-3333-333333333333';
  r uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  first_id bigint;
  second_id bigint;
  sale_count bigint;
BEGIN
  UPDATE inventory SET stock_actual=1 WHERE producto_id=1;
  DELETE FROM inventory_movements;
  DELETE FROM sale_payments;
  DELETE FROM sale_details;
  DELETE FROM sales;

  first_id := create_pos_sale_idempotent_test(u, '[{"producto_id":1,"cantidad":1}]'::jsonb, '[{"metodo":"EFECTIVO","monto":100}]'::jsonb, r);
  second_id := create_pos_sale_idempotent_test(u, '[{"producto_id":1,"cantidad":1}]'::jsonb, '[{"metodo":"EFECTIVO","monto":100}]'::jsonb, r);
  SELECT count(*) INTO sale_count FROM sales;

  IF first_id <> second_id THEN RAISE EXCEPTION 'IDEMPOTENCY_FAIL: different sale IDs'; END IF;
  IF sale_count <> 1 THEN RAISE EXCEPTION 'IDEMPOTENCY_FAIL: expected one sale, got %', sale_count; END IF;
END $$;
SQL

echo 'PASS: idempotency test.'
