import { Link } from "react-router-dom";
import { useIntl } from "react-intl";

import { ContactButton } from "../components/contact/ContactButton";
import { SiteFooter } from "../components/SiteFooter";
import { ProductItem } from "./catalog/ProductItem";
import { groups } from "./catalog/products";

// Product catalog — shares the same page shell (.info-page / .info-head) as the
// FAQ and Testimonials routes, then stacks one section per product group.
export default function Catalog() {
  const intl = useIntl();
  return (
    <main className="info-page info-page--wide">
      <header className="info-head">
        <Link to="/" className="page-back">
          {intl.formatMessage({ id: "backToHome" })}
        </Link>
        <h1 className="info-title">{intl.formatMessage({ id: "catalog.title" })}</h1>
        <p className="info-lead">{intl.formatMessage({ id: "catalog.lead" })}</p>
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
        <h2 className="catalog-contact-title">{intl.formatMessage({ id: "catalog.contact.title" })}</h2>
        <p className="catalog-contact-lead">{intl.formatMessage({ id: "catalog.contact.lead" })}</p>
        <ContactButton label={intl.formatMessage({ id: "cta.startNow" })} />
      </section>

      <SiteFooter />
    </main>
  );
}
