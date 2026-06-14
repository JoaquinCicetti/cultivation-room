import { lazy, Suspense, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Overlay } from "../components/Overlay";
import { scrollState } from "../scroll/story";

const Scene = lazy(() => import("../three/Scene"));

const TOTAL_VH = 900;

export default function Landing() {
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: "max",
      onUpdate: (self) => {
        scrollState.target = self.progress;
      },
    });
    ScrollTrigger.refresh();
    return () => trigger.kill();
  }, []);

  return (
    <>
      {/* cool, clean background */}
      <div className="cool-bg" aria-hidden>
        <div className="cool-blob cool-blob-a" />
        <div className="cool-blob cool-blob-b" />
        <div className="cool-grid" />
      </div>

      {/* scroll spacer drives page height */}
      <div style={{ height: `${TOTAL_VH}vh` }} aria-hidden />

      {/* fixed stage: floating iso room + 2D text layer */}
      <div className="stage">
        <Suspense fallback={<SceneLoader />}>
          <Scene />
        </Suspense>
        <Overlay />
      </div>

      {/* brand mark, always visible */}
      <a className="brand" href="/">
        <img src="/logo.svg" alt="Growcast" width={26} height={26} />
        <span>Growcast</span>
      </a>
    </>
  );
}

function SceneLoader() {
  return (
    <div className="scene-loader">
      <span>Cargando…</span>
    </div>
  );
}
