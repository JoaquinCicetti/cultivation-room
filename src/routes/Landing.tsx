import { lazy, Suspense, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Overlay } from "../components/Overlay";
import { scrollState } from "../scroll/story";

const Scene = lazy(() => import("../three/Scene"));

const TOTAL_VH = 1300;

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
      <div style={{ height: `${TOTAL_VH}vh` }} aria-hidden />

      {/* right-column canvas (the floating room) */}
      <div className="stage">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>

      {/* full-screen 2D layer (left text, toasts, trace, final, brand header) */}
      <Overlay />
    </>
  );
}
