import { Link } from "react-router-dom";

// Lazy-loaded placeholder route — proves code-splitting works. Real catalog
// content/data comes in a later phase.
export default function Catalog() {
  return (
    <main
      style={{
        minHeight: "100%",
        padding: "clamp(1.5rem, 4vw, 3.5rem)",
        overflow: "auto",
      }}
    >
      <Link to="/" style={{ color: "var(--growcast-lime)", fontSize: "0.85rem" }}>
        ← Growcast
      </Link>
      <h1 style={{ marginTop: "2rem", fontWeight: 600, letterSpacing: "-0.02em" }}>Catalog</h1>
      <p style={{ opacity: 0.55 }}>Placeholder — product catalog coming soon.</p>
    </main>
  );
}
