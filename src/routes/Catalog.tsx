import { Link } from "react-router-dom";

import { ContactButton } from "../components/contact/ContactButton";
import { ProductItem } from "./catalog/ProductItem";
import { groups } from "./catalog/products";

// Product catalog — stacked, full-width sections (one per product group), all
// dark to match the room theme. Data lives in ./catalog/products.
export default function Catalog() {
  return (
    <main className="catalog">
      <header className="catalog-head">
        <Link to="/" className="catalog-back">
          ← Growcast
        </Link>
        <h1 className="catalog-title">Catálogo</h1>
        <p className="catalog-lead">
          Monitoreo, control y trazabilidad para cada escala de cultivo.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.id} id={group.id} className="catalog-group">
          <h2 className="catalog-group-title">{group.title}</h2>
          {group.products.map((product) => (
            <ProductItem key={product.name} product={product} />
          ))}
        </section>
      ))}

      <section className="catalog-contact">
        <h2 className="catalog-contact-title">¿Hablamos?</h2>
        <p className="catalog-contact-lead">
          Contanos sobre tu instalación y te recomendamos la solución justa.
        </p>
        <ContactButton label="Empezá ahora" />
      </section>
    </main>
  );
}
