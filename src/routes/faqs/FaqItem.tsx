import { useId, useState } from "react";
import { useIntl } from "react-intl";

// Single accessible accordion row. Question toggles; answer expands via a
// max-height transition so it animates open/closed without a layout jump.
export function FaqItem({ faqKey }: { faqKey: string }) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={`faq-item${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="faq-q"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{intl.formatMessage({ id: `faq.${faqKey}.q` })}</span>
        <span className="faq-chevron" aria-hidden />
      </button>
      <div id={panelId} className="faq-a" role="region">
        <p>{intl.formatMessage({ id: `faq.${faqKey}.a` })}</p>
      </div>
    </div>
  );
}
