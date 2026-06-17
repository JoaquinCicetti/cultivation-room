import { Link } from "react-router-dom";
import { useIntl } from "react-intl";

import { SiteFooter } from "../components/SiteFooter";

// Author/role are proper nouns — kept verbatim across locales. Only the quote
// text is translated (textId -> i18n catalog).
const TESTIMONIALS = [
  { textId: "testimonial.0.text", author: "Mauro Lamónica (MAULA)", role: "Flowers & Terps" },
  { textId: "testimonial.1.text", author: "Tomás Di Lorenzi", role: "Nativas" },
  { textId: "testimonial.2.text", author: "Matías Jardi", role: "Comunidab" },
];

export default function Testimonials() {
  const intl = useIntl();
  return (
    <main className="info-page">
      <header className="info-head">
        <Link className="page-back" to="/">
          {intl.formatMessage({ id: "backToHome" })}
        </Link>
        <h1 className="info-title">{intl.formatMessage({ id: "testimonials.title" })}</h1>
        <p className="info-lead">{intl.formatMessage({ id: "testimonials.lead" })}</p>
      </header>

      <div className="tm-list">
        {TESTIMONIALS.map((tm) => (
          <figure key={tm.textId} className="tm-quote">
            <span className="tm-mark" aria-hidden>
              &ldquo;
            </span>
            <blockquote>{intl.formatMessage({ id: tm.textId })}</blockquote>
            <figcaption>
              <strong>{tm.author}</strong>
              <span>{tm.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <SiteFooter />
    </main>
  );
}
