import { useIntl } from "react-intl";

import { regRef } from "../scroll/story";

// Section 05 — Traceability. The cultivation room rises out of frame while the
// wall tablet (a real 3D mesh, see three/TraceTablet.tsx) detaches, rotates and
// flies to the front with the production report rendered on its face. This file
// only owns the static left-hand title; the report itself lives on the 3D tablet.
export function Traceability() {
  const intl = useIntl();
  return (
    <div className="trace2">
      <div className="trace2-left" ref={regRef("trace2Left")} style={{ opacity: 0 }}>
        <span className="kicker">{intl.formatMessage({ id: "trace.kicker" })}</span>
        <h2>{intl.formatMessage({ id: "trace.title" })}</h2>
        <p>{intl.formatMessage({ id: "trace.lead" })}</p>
      </div>
    </div>
  );
}
