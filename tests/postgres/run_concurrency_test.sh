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
ITEM_ONE='[{"producto_id":1,"cantidad":1,"descuento":0}]'
PAYMENT_100='[{"metodo":"EFECTIVO","monto":100}]'

cat > /tmp/a.sql <<SQL
BEGIN;
SELECT create_pos_sale_test('${USER_A}', '${ITEM_ONE}'::jsonb, '${PAYMENT_100}'::jsonb);
SELECT pg_sleep(1);
COMMIT;
SQL

cat > /tmp/b.sql <<SQL
BEGIN;
SELECT create_pos_sale_test('${USER_B}', '${ITEM_ONE}'::jsonb, '${PAYMENT_100}'::jsonb);
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

# Compare stock numerically instead of comparing its text representation.
# PostgreSQL may return numeric values such as 0.000, while the invariant is simply stock = 0.
STOCK_OK=$(psql -At -v ON_ERROR_STOP=1 -c "select case when stock_actual = 0 then '1' else '0' end from inventory where producto_id=1")
STOCK=$(psql -At -v ON_ERROR_STOP=1 -c "select stock_actual::text from inventory where producto_id=1")
SALES=$(psql -At -v ON_ERROR_STOP=1 -c "select count(*) from sales")
MOVES=$(psql -At -v ON_ERROR_STOP=1 -c "select count(*) from inventory_movements where producto_id=1 and tipo='VENTA'")
PAYMENTS=$(psql -At -v ON_ERROR_STOP=1 -c "select count(*) from sale_payments")

printf '\n--- INTEGRIDAD CONCURRENCIA ---\n'
printf 'stock=%s\nsales=%s\ninventory_sale_movements=%s\npayments=%s\n' "$STOCK" "$SALES" "$MOVES" "$PAYMENTS"
[[ "$STOCK_OK" == '1' ]] || { echo 'FAIL: expected stock 0'; exit 1; }
[[ "$SALES" == '1' ]] || { echo 'FAIL: expected 1 sale'; exit 1; }
[[ "$MOVES" == '1' ]] || { echo 'FAIL: expected 1 inventory movement'; exit 1; }
[[ "$PAYMENTS" == '1' ]] || { echo 'FAIL: expected 1 payment'; exit 1; }
echo 'PASS: inventory, sale, movement and payment counts are consistent.'

# Reset to a clean fixture before the remaining isolated tests.
psql -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE sale_payments, sale_details, inventory_movements, sales RESTART IDENTITY;
UPDATE inventory SET stock_actual = CASE WHEN producto_id IN (1,2) THEN 1 ELSE stock_actual END;
SQL

# Concurrent idempotency: two requests with the SAME client_request_id must resolve to one sale.
REQUEST_ID='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
cat > /tmp/idempotent_a.sql <<SQL
BEGIN;
SELECT create_pos_sale_idempotent_test('${USER_A}', '${ITEM_ONE}'::jsonb, '${PAYMENT_100}'::jsonb, '${REQUEST_ID}'::uuid);
SELECT pg_sleep(1);
COMMIT;
SQL
cat > /tmp/idempotent_b.sql <<SQL
BEGIN;
SELECT create_pos_sale_idempotent_test('${USER_B}', '${ITEM_ONE}'::jsonb, '${PAYMENT_100}'::jsonb, '${REQUEST_ID}'::uuid);
COMMIT;
SQL

psql -v ON_ERROR_STOP=1 -f /tmp/idempotent_a.sql > /tmp/idempotent_a.out 2>&1 &
PID_A=$!
sleep 0.15
psql -v ON_ERROR_STOP=1 -f /tmp/idempotent_b.sql > /tmp/idempotent_b.out 2>&1
STATUS_B=$?
wait "$PID_A"
STATUS_A=$?
cat /tmp/idempotent_a.out
cat /tmp/idempotent_b.out
[[ "$STATUS_A" -eq 0 && "$STATUS_B" -eq 0 ]] || { echo 'FAIL: idempotent concurrent requests must both resolve successfully'; exit 1; }

ID_COUNT=$(psql -At -v ON_ERROR_STOP=1 -c "select count(*) from sales where client_request_id='${REQUEST_ID}'::uuid")
SALE_COUNT=$(psql -At -v ON_ERROR_STOP=1 -c 'select count(*) from sales')
PAY_COUNT=$(psql -At -v ON_ERROR_STOP=1 -c 'select count(*) from sale_payments')
MOVE_COUNT=$(psql -At -v ON_ERROR_STOP=1 -c "select count(*) from inventory_movements where tipo='VENTA'")
[[ "$ID_COUNT" == '1' && "$SALE_COUNT" == '1' && "$PAY_COUNT" == '1' && "$MOVE_COUNT" == '1' ]] || { echo 'FAIL: idempotency created duplicate data'; exit 1; }
echo 'PASS: concurrent same client_request_id produced one sale, one payment and one inventory movement.'

# Payment/change: $150 paid for a $100 sale means $50 change, not $150 revenue.
psql -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE sale_payments, sale_details, inventory_movements, sales RESTART IDENTITY;
UPDATE inventory SET stock_actual = 1 WHERE producto_id=1;
SELECT create_pos_sale_test('33333333-3333-3333-3333-333333333333', '[{"producto_id":1,"cantidad":1}]'::jsonb, '[{"metodo":"EFECTIVO","monto":150}]'::jsonb);
DO $$
DECLARE v_total numeric; v_paid numeric; v_change numeric;
BEGIN
  SELECT total INTO v_total FROM sales LIMIT 1;
  SELECT coalesce(sum(monto),0) INTO v_paid FROM sale_payments;
  v_change := v_paid-v_total;
  IF v_total <> 100 OR v_paid <> 150 OR v_change <> 50 THEN
    RAISE EXCEPTION 'CHANGE_FAIL: total=%, paid=%, change=%',v_total,v_paid,v_change;
  END IF;
END $$;
SQL
echo 'PASS: cash change calculation is $50 and sale revenue remains $100.'

# Mixed payment: $60 cash + $40 card exactly settles a $100 sale.
psql -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE sale_payments, sale_details, inventory_movements, sales RESTART IDENTITY;
UPDATE inventory SET stock_actual = 1 WHERE producto_id=1;
SELECT create_pos_sale_test('44444444-4444-4444-4444-444444444444', '[{"producto_id":1,"cantidad":1}]'::jsonb, '[{"metodo":"EFECTIVO","monto":60},{"metodo":"TARJETA","monto":40}]'::jsonb);
DO $$
DECLARE v_count bigint; v_paid numeric; v_cash numeric; v_card numeric;
BEGIN
  SELECT count(*), coalesce(sum(monto),0) INTO v_count,v_paid FROM sale_payments;
  SELECT coalesce(sum(monto),0) INTO v_cash FROM sale_payments WHERE metodo='EFECTIVO';
  SELECT coalesce(sum(monto),0) INTO v_card FROM sale_payments WHERE metodo='TARJETA';
  IF v_count<>2 OR v_paid<>100 OR v_cash<>60 OR v_card<>40 THEN RAISE EXCEPTION 'MIXED_PAYMENT_FAIL'; END IF;
END $$;
SQL
echo 'PASS: mixed cash/card payment settled the sale exactly.'

# Insufficient payment must roll back the sale, payment and inventory movement.
psql -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE sale_payments, sale_details, inventory_movements, sales RESTART IDENTITY;
UPDATE inventory SET stock_actual = 1 WHERE producto_id=1;
DO $$
BEGIN
  BEGIN
    PERFORM create_pos_sale_test('55555555-5555-5555-5555-555555555555', '[{"producto_id":1,"cantidad":1}]'::jsonb, '[{"metodo":"EFECTIVO","monto":99}]'::jsonb);
    RAISE EXCEPTION 'ROLLBACK_FAIL: sale unexpectedly succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'PAYMENT_INSUFFICIENT' THEN RAISE; END IF;
  END;
END $$;
DO $$
DECLARE v_stock numeric; v_sales bigint; v_moves bigint; v_payments bigint;
BEGIN
  SELECT stock_actual INTO v_stock FROM inventory WHERE producto_id=1;
  SELECT count(*) INTO v_sales FROM sales;
  SELECT count(*) INTO v_moves FROM inventory_movements;
  SELECT count(*) INTO v_payments FROM sale_payments;
  IF v_stock<>1 OR v_sales<>0 OR v_moves<>0 OR v_payments<>0 THEN RAISE EXCEPTION 'ROLLBACK_FAIL: partial data remained'; END IF;
END $$;
SQL
echo 'PASS: insufficient payment rolled back all sale-side effects.'

# Two products in one atomic sale: both stocks and movements must change together.
psql -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE sale_payments, sale_details, inventory_movements, sales RESTART IDENTITY;
UPDATE inventory SET stock_actual = 1 WHERE producto_id IN (1,2);
SELECT create_pos_sale_test('66666666-6666-6666-6666-666666666666', '[{"producto_id":1,"cantidad":1},{"producto_id":2,"cantidad":1}]'::jsonb, '[{"metodo":"EFECTIVO","monto":125}]'::jsonb);
DO $$
DECLARE s1 numeric; s2 numeric; m bigint; d bigint; sale_total numeric;
BEGIN
  SELECT stock_actual INTO s1 FROM inventory WHERE producto_id=1;
  SELECT stock_actual INTO s2 FROM inventory WHERE producto_id=2;
  SELECT count(*) INTO m FROM inventory_movements WHERE tipo='VENTA';
  SELECT count(*) INTO d FROM sale_details;
  SELECT s.total INTO sale_total FROM sales AS s LIMIT 1;
  IF s1<>0 OR s2<>0 OR m<>2 OR d<>2 OR sale_total<>125 THEN RAISE EXCEPTION 'TWO_PRODUCT_FAIL'; END IF;
END $$;
SQL
echo 'PASS: two-product atomic sale kept inventory and detail rows consistent.'

echo 'ALL ISOLATED POSTGRES TESTS PASSED.'
