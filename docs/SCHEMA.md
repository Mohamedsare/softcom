# Schéma de base de données — FasoStock

## Enums

- **user_role_enum** : super_admin, owner, manager, store_manager, cashier, stock_manager, accountant, viewer
- **store_increase_status** : pending, approved, rejected
- **transfer_status** : draft, pending, approved, shipped, received, rejected, cancelled
- **purchase_status** : draft, confirmed, partially_received, received, cancelled
- **sale_status** : draft, completed, cancelled, refunded
- **payment_method** : cash, mobile_money, card, transfer, other
- **stock_movement_type** : purchase_in, sale_out, adjustment, transfer_out, transfer_in, return_in, return_out, loss, inventory_correction
- **cash_movement_type** : opening, closing, sale, expense, withdrawal, deposit, adjustment

## Tables (ordre logique)

1. **profiles** — Extension de auth.users (id = auth.uid()), full_name, avatar_url, is_super_admin
2. **companies** — name, slug, logo_url, is_active, store_quota (default 3), created_at
3. **company_settings** — company_id, key/value ou colonnes (timezone, currency, etc.)
4. **roles** — name, slug (super_admin, owner, …)
5. **permissions** — key (company.manage, …)
6. **role_permissions** — role_id, permission_id
7. **user_company_roles** — user_id (auth.uid()), company_id, role_id
8. **stores** — company_id, name, code, address, is_active, is_primary
9. **user_store_assignments** — user_id, store_id, company_id
10. **store_increase_requests** — company_id, requested_count, justification, status, reviewed_by, reviewed_at
11. **categories** — company_id, name, parent_id, slug
12. **brands** — company_id, name
13. **products** — company_id, category_id, brand_id, name, sku, barcode, unit, purchase_price, sale_price, min_price, stock_min, description, is_active, deleted_at
14. **product_images** — product_id, url, position
15. **product_store_settings** — product_id, store_id, stock_min_override
16. **suppliers** — company_id, name, contact, phone, email, address, notes
17. **customers** — company_id, name, type (individual/company), phone, email, address, notes
18. **store_inventory** — store_id, product_id, quantity, reserved_quantity, updated_at
19. **stock_movements** — store_id, product_id, type, quantity, reference_type, reference_id, created_by, created_at, notes
20. **stock_adjustments** — store_id, product_id, quantity_delta, reason, created_by, created_at
21. **inventory_sessions** — store_id, status, started_at, closed_at, created_by
22. **inventory_session_items** — session_id, product_id, expected_qty, counted_qty, variance
23. **sales** — company_id, store_id, customer_id, sale_number, status, subtotal, discount, tax, total, created_by, created_at
24. **sale_items** — sale_id, product_id, quantity, unit_price, discount, total
25. **sale_payments** — sale_id, method, amount, reference
26. **sale_returns** — sale_id, status, total_refund, created_at
27. **sale_return_items** — return_id, sale_item_id, quantity, amount
28. **cash_register_sessions** — store_id, opened_by, opened_at, closed_at, opening_amount, closing_amount, status
29. **cash_movements** — session_id, type, amount, reference_type, reference_id, notes, created_by
30. **purchases** — company_id, store_id, supplier_id, reference, status, total, created_by, created_at
31. **purchase_items** — purchase_id, product_id, quantity, unit_price, total
32. **purchase_payments** — purchase_id, amount, method, paid_at
33. **stock_transfers** — company_id, from_store_id, to_store_id, status, requested_by, approved_by, shipped_at, received_at, created_at
34. **stock_transfer_items** — transfer_id, product_id, quantity_requested, quantity_shipped, quantity_received
35. **audit_logs** — company_id, store_id (nullable), user_id, action, entity_type, entity_id, old_data, new_data, created_at
36. **notifications** — user_id, company_id, type, title, body, read_at, created_at
37. **ai_requests** — company_id, store_id (nullable), type, input_summary, output_summary, tokens_used, created_at
38. **ai_insights_cache** — company_id, store_id (nullable), insight_type, payload, expires_at
39. **forecast_snapshots** — company_id, store_id (nullable), product_id (nullable), snapshot_date, payload (jsonb)

Toutes les tables métier ont company_id (sauf roles, permissions, role_permissions, profiles). Les tables scopées boutique ont en plus store_id. created_at/updated_at et created_by/updated_by où pertinent.
