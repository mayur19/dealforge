import { formatBps, formatMoney, ratioBps, subtractMinor, type Product } from '@dealforge/shared';

function listMargin(product: Product): string {
  return formatBps(
    ratioBps(subtractMinor(product.listPriceMinor, product.unitCostMinor), product.listPriceMinor),
  );
}

export function ProductTable({ products }: { readonly products: readonly Product[] }) {
  if (products.length === 0) {
    return <p className="muted">No products yet.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">Product catalog</caption>
        <thead>
          <tr>
            <th scope="col">SKU</th>
            <th scope="col">Name</th>
            <th scope="col">Category</th>
            <th scope="col">Type</th>
            <th scope="col" className="num">
              List price
            </th>
            <th scope="col" className="num">
              Unit cost
            </th>
            <th scope="col" className="num">
              List margin
            </th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <code>{p.sku}</code>
              </td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.type === 'RECURRING' ? `Recurring (${p.unit})` : `One-time (${p.unit})`}</td>
              <td className="num">{formatMoney(p.listPriceMinor, p.currencyCode)}</td>
              <td className="num">{formatMoney(p.unitCostMinor, p.currencyCode)}</td>
              <td className="num">{listMargin(p)}</td>
              <td>
                <span className={p.active ? 'badge badge--ok' : 'badge badge--muted'}>
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
