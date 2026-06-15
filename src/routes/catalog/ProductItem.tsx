import type { Product } from "./products";

// A single product block: heading, device image beside description + benefits,
// the row of product photos, then the Comprar / datasheet actions. Recolored
// for the dark theme — the device line-art is inverted to read light-on-dark.
export function ProductItem({ product }: { product: Product }) {
  const { name, description, benefits, image, link, sheet, pics } = product;

  return (
    <article className="product">
      <h3 className="product-name">{name}</h3>

      <div className="product-body">
        <div className="product-art">
          <img src={image} alt={name} loading="lazy" />
        </div>

        <div className="product-info">
          <p className="product-desc">{description}</p>

          <div className="product-benefits">
            <span className="product-benefits-label">Beneficios</span>
            <ul>
              {benefits.map((b, i) => (
                <li key={i}>
                  <span className="bullet" aria-hidden="true">
                    →
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {pics.length > 0 && (
        <div className="product-pics">
          {pics.map((src, i) => (
            <img key={i} src={src} alt={`${name} ${i + 1}`} loading="lazy" />
          ))}
        </div>
      )}

      {(sheet || link) && (
        <div className="product-actions">
          {sheet && (
            <a className="product-sheet" href={sheet} target="_blank" rel="noopener noreferrer">
              Descargar Ficha Técnica
            </a>
          )}
          {link && (
            <a className="cta" href={link} target="_blank" rel="noopener noreferrer">
              Comprar
            </a>
          )}
        </div>
      )}
    </article>
  );
}
