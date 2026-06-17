import { Link, useLocation } from "react-router-dom";
import { useIntl } from "react-intl";

import { SiteFooter } from "../components/SiteFooter";
import { CommonTermsMessages, HtmlMessages } from "../legal/legalMessages";

type Msg = { id: string; defaultMessage: string };
const HEAD = HtmlMessages as Record<string, Msg>;

// non-paragraph entries (titles/buttons) we don't render in the body
const SKIP = new Set(["termsTitle", "privacyTitle", "company", "acceptButton", "labelWithTemplate"]);
const ITEMS = Object.entries(CommonTermsMessages as Record<string, Msg>)
  .filter(([k]) => !SKIP.has(k))
  .map(([, v]) => v.defaultMessage);

const TITLES: Record<string, string> = {
  "/terminos": "Términos y Condiciones",
  "/privacidad": "Política de privacidad",
};

function resolve(text: string): { heading: string | null; body: string } {
  const m = text.match(/^\{(\w+)\}:?\s*/);
  let heading: string | null = null;
  let body = text;
  if (m && HEAD[m[1]]) {
    heading = HEAD[m[1]].defaultMessage;
    body = text.slice(m[0].length);
  }
  body = body.replace(/\{(\w+)\}/g, (_, k) => (k === "email" ? "info@growcast.io" : (HEAD[k]?.defaultMessage ?? "")));
  return { heading, body };
}

export default function Legal() {
  const { pathname } = useLocation();
  const intl = useIntl();
  const title = TITLES[pathname] ?? "Términos y Condiciones";

  return (
    <main className="legal">
      <Link className="page-back" to="/">
        {intl.formatMessage({ id: "backToHome" })}
      </Link>
      <h1>{title}</h1>
      <p className="legal-company">GROWCAST by CANNFEEL S.A.</p>
      <div className="legal-body">
        {ITEMS.map((text, i) => {
          const { heading, body } = resolve(text);
          return (
            <div key={i} className="legal-section">
              {heading && <h2 className="legal-h">{heading}</h2>}
              <p>{body}</p>
            </div>
          );
        })}
      </div>
      <SiteFooter />
    </main>
  );
}
