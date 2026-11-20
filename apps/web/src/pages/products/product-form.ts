import {
  createProductSchema,
  currencyMinorDigits,
  parseDecimalToMinor,
  type CreateProductRequest,
  type ProductType,
} from '@dealforge/shared';

/** Raw text the user typed; money stays a decimal string until parsed. */
export interface ProductFormValues {
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly type: ProductType;
  readonly unit: string;
  readonly listPrice: string;
  readonly unitCost: string;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  sku: '',
  name: '',
  category: '',
  description: '',
  type: 'ONE_TIME',
  unit: '',
  listPrice: '',
  unitCost: '',
};

export type FieldErrors = Readonly<Partial<Record<keyof ProductFormValues, string>>>;

export type FormResult =
  | { readonly ok: true; readonly value: CreateProductRequest }
  | { readonly ok: false; readonly errors: FieldErrors };

const MONEY_FIELD = { listPriceMinor: 'listPrice', unitCostMinor: 'unitCost' } as const;

function parseMoney(text: string, digits: number): number | string {
  try {
    return parseDecimalToMinor(text, digits);
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid amount';
  }
}

/**
 * Convert form text to the API payload. Decimal input is parsed to integer
 * minor units on digit strings (no floats); the server re-validates anyway.
 */
export function toCreateProductRequest(values: ProductFormValues, currency: string): FormResult {
  const digits = currencyMinorDigits(currency);
  const listPriceMinor = parseMoney(values.listPrice, digits);
  const unitCostMinor = parseMoney(values.unitCost, digits);
  const moneyErrors: Record<string, string> = {};
  if (typeof listPriceMinor === 'string') moneyErrors.listPrice = listPriceMinor;
  if (typeof unitCostMinor === 'string') moneyErrors.unitCost = unitCostMinor;

  const parsed = createProductSchema.safeParse({
    sku: values.sku,
    name: values.name,
    category: values.category,
    description: values.description,
    type: values.type,
    unit: values.unit,
    listPriceMinor: typeof listPriceMinor === 'number' ? listPriceMinor : 0,
    unitCostMinor: typeof unitCostMinor === 'number' ? unitCostMinor : 0,
  });
  const schemaErrors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      const field = MONEY_FIELD[key as keyof typeof MONEY_FIELD] ?? key;
      schemaErrors[field] ??= issue.message;
    }
  }
  const errors = { ...schemaErrors, ...moneyErrors };
  if (!parsed.success || Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: parsed.data };
}
