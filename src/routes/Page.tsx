import { Link, useLocation } from "react-router-dom";

const PAGES: Record<string, { title: string; body: string }> = {
  "/faqs": {
    title: "Preguntas frecuentes",
    body: "Resolvemos las dudas más comunes sobre instalación, sensores, automatización y trazabilidad.",
  },
  "/testimonios": {
    title: "Testimonios",
    body: "Lo que dicen los equipos de cultivo que ya operan con Growcast.",
  },
  "/privacidad": {
    title: "Política de privacidad",
    body: "Cómo tratamos y protegemos los datos de tu instalación.",
  },
  "/terminos": {
    title: "Términos y condiciones",
    body: "Condiciones de uso del servicio Growcast.",
  },
};

export default function Page() {
  const { pathname } = useLocation();
  const pg = PAGES[pathname] ?? { title: "Growcast", body: "" };
  return (
    <main className="page">
      <Link className="page-back" to="/">
        ← Growcast
      </Link>
      <h1>{pg.title}</h1>
      <p>{pg.body}</p>
      <p className="page-soon">Próximamente.</p>
    </main>
  );
}
