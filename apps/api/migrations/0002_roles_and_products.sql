-- 0002 DealForge roles and product catalog (DF-004, DF-011).
-- Money is stored as integer minor units in bigint columns (ADR-0013).

ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN (
    'SALES_ADMIN',
    'PRICING_MANAGER',
    'SALES_REP',
    'SALES_MANAGER',
    'FINANCE_APPROVER',
    'CUSTOMER_VIEWER'
  ));

-- One currency per organization for catalog defaults (FR-01). Full pricing
-- settings (margin floor, thresholds, tax, expiry) arrive with DF-010.
ALTER TABLE organizations
  ADD COLUMN currency_code char(3) NOT NULL DEFAULT 'USD' CHECK (currency_code ~ '^[A-Z]{3}$');

CREATE TABLE products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sku              text NOT NULL CHECK (sku ~ '^[A-Z0-9][A-Z0-9._-]{1,63}$'),
  name             text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  category         text NOT NULL CHECK (length(category) BETWEEN 1 AND 80),
  description      text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  type             text NOT NULL CHECK (type IN ('ONE_TIME', 'RECURRING')),
  unit             text NOT NULL CHECK (length(unit) BETWEEN 1 AND 40),
  list_price_minor bigint NOT NULL CHECK (list_price_minor BETWEEN 0 AND 100000000000),
  unit_cost_minor  bigint NOT NULL CHECK (unit_cost_minor BETWEEN 0 AND 100000000000),
  active           boolean NOT NULL DEFAULT true,
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_org_sku_key UNIQUE (organization_id, sku)
);
CREATE INDEX products_org_category_idx ON products (organization_id, category);
CREATE INDEX products_org_active_idx ON products (organization_id, active);
