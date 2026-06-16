import { regRef } from "../scroll/story";

// Section 05 — Traceability. The cultivation room rises out of frame while the
// wall tablet (a real 3D mesh, see three/TraceTablet.tsx) detaches, rotates and
// flies to the front with the production report rendered on its face. This file
// only owns the static left-hand title; the report itself lives on the 3D tablet.
export function Traceability() {
  return (
    <div className="trace2">
      <div className="trace2-left" ref={regRef("trace2Left")} style={{ opacity: 0 }}>
        <span className="kicker">05 · Trazabilidad</span>
        <h2>Trazabilidad completa de cada lote.</h2>
        <p>
          Cada medición, evento, alarma y acción ejecutada queda registrada automáticamente para auditoría,
          análisis y seguimiento productivo.
        </p>
      </div>
    </div>
  );
}
