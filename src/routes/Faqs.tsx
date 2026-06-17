import { Link } from "react-router-dom";
import { useIntl } from "react-intl";

import { SiteFooter } from "../components/SiteFooter";
import { FaqItem } from "./faqs/FaqItem";
import { FAQ_SECTIONS } from "./faqs/faqData";

export default function Faqs() {
  const intl = useIntl();
  return (
    <main className="info-page">
      <header className="info-head">
        <Link className="page-back" to="/">
          {intl.formatMessage({ id: "backToHome" })}
        </Link>
        <h1 className="info-title">{intl.formatMessage({ id: "faqs.title" })}</h1>
        <p className="info-lead">{intl.formatMessage({ id: "faqs.lead" })}</p>
      </header>

      <div className="faq-sections">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.titleId} className="faq-section">
            <h2 className="faq-section-title">{intl.formatMessage({ id: section.titleId })}</h2>
            <div className="faq-list">
              {section.items.map((key) => (
                <FaqItem key={key} faqKey={key} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <SiteFooter />
    </main>
  );
}
