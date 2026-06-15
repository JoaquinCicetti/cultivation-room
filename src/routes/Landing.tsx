import { lazy, Suspense, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Overlay } from "../components/Overlay";
import { scrollState } from "../scroll/story";

const Scene = lazy(() => import("../three/Scene"));

const TOTAL_VH = 1050;

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
      <div className="cool-bg" aria-hidden>
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
        <span className="orb orb-4" />
        <span className="orb orb-5" />
        <span className="orb orb-6" />
        <div className="cool-wall" />
        <div className="cool-grid" />
        <div className="cool-dots" />
        <div className="cool-vignette" />
      </div>

      <div style={{ height: `${TOTAL_VH}vh` }} aria-hidden />

      {/* right-column canvas (the floating room) */}
      <div className="stage">
        <Suspense fallback={<SceneLoader />}>
          <Scene />
        </Suspense>
      </div>

      {/* full-screen 2D layer (left text, toasts, trace, final) */}
      <Overlay />

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
