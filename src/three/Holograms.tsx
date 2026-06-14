import { Html } from "@react-three/drei";

import { IMPROVE_TAGS, MEASURE_CHIPS, regRef } from "../scroll/story";

// Holographic readings anchored to devices / the hero plant, each with a leader
// line + dot pointing at its source. Opacity/value/colour are driven imperatively
// by StoryDirector via `ui`.
export function Holograms() {
  return (
    <>
      {MEASURE_CHIPS.map((c) => (
        <Html
          key={c.id}
          position={c.anchor as [number, number, number]}
          center
          pointerEvents="none"
          zIndexRange={[12, 0]}
          wrapperClass="holo-wrap"
        >
          <div className="holo" ref={regRef(`chip.${c.id}`)} style={{ opacity: 0 }}>
            <div className="holo-card">
              <span className="holo-label">{c.label}</span>
              <span className="holo-value" ref={c.id === "temp" ? regRef("val.temp") : undefined}>
                {c.value}
              </span>
            </div>
            <span className="holo-stem" />
            <span className="holo-dot" />
          </div>
        </Html>
      ))}

      {IMPROVE_TAGS.map((t) => (
        <Html
          key={t.id}
          position={t.anchor as [number, number, number]}
          center
          pointerEvents="none"
          zIndexRange={[12, 0]}
          wrapperClass="holo-wrap"
        >
          <div className="holo holo-tag" ref={regRef(`tag.${t.id}`)} style={{ opacity: 0 }}>
            <div className="holo-card holo-card-tag">{t.label}</div>
            <span className="holo-stem" />
            <span className="holo-dot" />
          </div>
        </Html>
      ))}
    </>
  );
}
