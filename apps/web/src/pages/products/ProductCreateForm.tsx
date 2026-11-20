import { PRODUCT_TYPES, type Product } from '@dealforge/shared';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import {
  EMPTY_PRODUCT_FORM,
  toCreateProductRequest,
  type FieldErrors,
  type ProductFormValues,
} from './product-form';

interface Props {
  readonly currency: string;
  readonly onCreated: (product: Product) => void;
}

type TextField = Exclude<keyof ProductFormValues, 'type'>;

const FIELDS: readonly { key: TextField; label: string; hint?: string }[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'unit', label: 'Unit', hint: 'e.g. seat/month, hour, unit' },
  { key: 'listPrice', label: 'List price' },
  { key: 'unitCost', label: 'Unit cost' },
];

function serverMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 409 || error.status === 422)) {
    return error.body.message;
  }
  return 'Could not create the product. Try again.';
}

export function ProductCreateForm({ currency, onCreated }: Props) {
  const [values, setValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const update = (key: keyof ProductFormValues, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const result = toCreateProductRequest(values, currency);
    setErrors(result.ok ? {} : result.errors);
    if (!result.ok) return;
    setSubmitting(true);
    try {
      onCreated(await api.post<Product>('/products', result.value));
      setValues(EMPTY_PRODUCT_FORM);
    } catch (error) {
      setFormError(serverMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card form-grid" onSubmit={onSubmit} noValidate aria-label="New product">
      <h2 className="form-grid__title">New product</h2>
      {FIELDS.map(({ key, label, hint }) => {
        const inputId = `product-${key}`;
        const errorId = `${inputId}-error`;
        const isMoney = key === 'listPrice' || key === 'unitCost';
        return (
          <div key={key} className="field">
            <label htmlFor={inputId}>
              {label}
              {isMoney ? ` (${currency})` : ''}
            </label>
            <input
              id={inputId}
              value={values[key]}
              onChange={(e) => update(key, e.target.value)}
              inputMode={isMoney ? 'decimal' : undefined}
              placeholder={hint}
              aria-invalid={errors[key] ? true : undefined}
              aria-describedby={errors[key] ? errorId : undefined}
            />
            {errors[key] ? (
              <small id={errorId} className="field__error">
                {errors[key]}
              </small>
            ) : null}
          </div>
        );
      })}
      <label className="field">
        <span>Type</span>
        <select value={values.type} onChange={(e) => update('type', e.target.value)}>
          {PRODUCT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === 'RECURRING' ? 'Recurring (monthly)' : 'One-time'}
            </option>
          ))}
        </select>
      </label>
      <label className="field form-grid__wide">
        <span>Description</span>
        <textarea
          rows={2}
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </label>
      {formError ? (
        <p className="alert alert--error form-grid__wide" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="form-grid__wide">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Create product'}
        </button>
      </div>
    </form>
  );
}
