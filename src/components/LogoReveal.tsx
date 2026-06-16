import { useEffect, useRef } from "react";
import gsap from "gsap";

import { story } from "../scroll/story";

// ===========================================================================
// LogoReveal — premium "living seed" reveal of the Growcast mark.
//
// The mark in /public/logo.svg is a SINGLE filled <path> (a 3-fold pinwheel:
// three teardrop leaves ~120° apart — one up, one lower-left, one lower-right).
// It can't be stroke-traced, so growth is done with MASKS: the exact original
// path is revealed by three feathered circles that expand outward from the
// center, staggered per leaf. A lighter "frontier" copy, masked to a thin ring
// riding each growth edge, gives the sensation of life flowing through the form.
//
// Sequence: seed glow (in darkness) → up → lower-left → lower-right leaves grow
// → a "first breath" (scale + rotate settle) with a light pulse → idle forever
// (microscopic breathing + glow flicker). Driven by GSAP, triggered when the
// scroll story's final section appears (story.finalP). Respects reduced motion.
// ===========================================================================

// Exact original mark — copied verbatim from public/logo.svg. Do not edit.
const LOGO_D =
  "M65.92,41.35a20.52,20.52,0,0,0-16.73,8.7l-4.88-2.86V41.75A21,21,0,0,0,59,8.54L58.58,8,58,8.34,55.71,9.72l-11.4,6.92V.1l-.71,0-.3,0c-.3,0-.6,0-.91,0-.51,0-1,0-1.49.07h0l-.7.05V4.27h0V37.51A16.79,16.79,0,0,1,37.79,4.86l.54-.15V.41L37.4.64a21,21,0,0,0,2.76,41.08v5.39l-4.67,2.75A20.48,20.48,0,0,0,.72,52.35L.4,53l.58.38.79.5h0l.6.43,12.24,7.86-.35.21L3.54,68.65h0L2.89,69,.59,70.38,0,70.73l.3.62a22,22,0,0,0,1.36,2.44l.39.6L2.67,74l1.51-.9.33-.18L34,55.59a16.83,16.83,0,0,1,1.39,6.7A16.64,16.64,0,0,1,18.89,79,16.21,16.21,0,0,1,7.24,74.12l-.42-.42-.5.3L4,75.39l-.79.47.63.68a20.54,20.54,0,0,0,15.07,6.68,20.95,20.95,0,0,0,18.7-29.75l4.58-2.69,5,2.9A20.94,20.94,0,0,0,65.92,83.22l.68,0h.22l.72,0v-.72l0-1h0v-.76l-.22-15.15L79,72.4h0l.69.42L82,74.17l.61.36.4-.59a21.21,21.21,0,0,0,1.39-2.44l.3-.62-.6-.35-2.29-1.36-.71-.42v0L52.8,52.16a16.42,16.42,0,0,1,13.12-6.62A16.65,16.65,0,0,1,82.41,62.29a17.06,17.06,0,0,1-.5,4l-.13.54.48.29,2.38,1.4.83.5.27-.94A20.94,20.94,0,0,0,65.92,41.35Zm-7-20.42A16.69,16.69,0,0,1,44.31,37.54V21.86l13-7.91A16.58,16.58,0,0,1,58.88,20.93Zm4.19,57.84a16.77,16.77,0,0,1-12.33-23l12.09,7.09ZM6.3,51.51a16.27,16.27,0,0,1,12.59-6,16.45,16.45,0,0,1,13,6.45L18.92,59.61Z";

const MARK = "#cad86e"; // exact brand color — never altered
const HILITE = "#eef6c4"; // transient light only (frontier + pulse), additive

// Pinwheel hub (≈ viewBox center) and the per-leaf reveal radius.
const CX = 43.28;
const CY = 45.61;
const R_MAX = 64; // covers each leaf base→tip (+ feather)

// Wedge sector boundaries (deg, SVG y-down) that partition the plane so the
// union of the three leaves covers the whole mark with no gaps.
const SECTORS = {
  lr: [-18, 95.5], // lower-right leaf  (points ≈ +49°)
  ll: [95.5, 208.5], // lower-left leaf  (points ≈ +152°)
  up: [208.5, 342], // upper leaf       (points ≈ -85°)
} as const;

function wedgePath([a0, a1]: readonly [number, number]): string {
  const R = 240;
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(CX + R * Math.cos(a)).toFixed(2)} ${(CY + R * Math.sin(a)).toFixed(2)}`;
  };
  const mid = (a0 + a1) / 2;
  return `M${CX} ${CY} L${p(a0)} L${p(mid)} L${p(a1)} Z`;
}

export function LogoReveal({
  size = 64,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const groupRef = useRef<SVGGElement>(null);
  const seedRef = useRef<SVGCircleElement>(null);
  const hiliteRef = useRef<SVGPathElement>(null);
  const pulseRef = useRef<SVGCircleElement>(null);

  // reveal circles (mask) + frontier ring circles (highlight), per leaf
  const revUp = useRef<SVGCircleElement>(null);
  const revLL = useRef<SVGCircleElement>(null);
  const revLR = useRef<SVGCircleElement>(null);
  const frUp = useRef<SVGCircleElement>(null);
  const frLL = useRef<SVGCircleElement>(null);
  const frLR = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Reduced motion: reveal the mark fully, no growth/idle.
    if (reduce) {
      [revUp, revLL, revLR].forEach((r) =>
        r.current?.setAttribute("r", String(R_MAX)),
      );
      gsap.set(seedRef.current, { opacity: 0.45 });
      gsap.set(hiliteRef.current, { opacity: 0 });
      return;
    }

    const idle: gsap.core.Tween[] = [];
    let raf = 0;

    const tl = gsap.timeline({ paused: true });
    tl.set(groupRef.current, { svgOrigin: `${CX} ${CY}` });

    // 1 — seed glow rises in the dark (anticipation), then a soft breath
    tl.fromTo(
      seedRef.current,
      { opacity: 0, scale: 0.55, svgOrigin: `${CX} ${CY}` },
      {
        opacity: 1,
        scale: 1,
        duration: 0.85,
        ease: "sine.out",
        svgOrigin: `${CX} ${CY}`,
      },
      0,
    );
    tl.to(
      seedRef.current,
      {
        opacity: 0.8,
        duration: 1.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 1,
      },
      0.85,
    );

    // 2 — leaves grow from center outward, staggered (up → lower-left → lower-right)
    const grow = (targets: Array<SVGCircleElement | null>, at: number) =>
      tl.to(
        targets,
        { attr: { r: R_MAX }, duration: 1.5, ease: "power3.out" },
        at,
      );
    grow([revUp.current, frUp.current], 0.55);
    grow([revLL.current, frLL.current], 1.05);
    grow([revLR.current, frLR.current], 1.55);

    // 3 — first breath: gentle scale + rotation that settles into alignment
    tl.to(
      groupRef.current,
      {
        keyframes: [
          { scale: 1.03, rotation: 1.3, duration: 0.5, ease: "sine.out" },
          { scale: 1, rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.5)" },
        ],
        svgOrigin: `${CX} ${CY}`,
      },
      3.05,
    );
    // a single soft pulse of light travels through the completed form
    tl.fromTo(
      pulseRef.current,
      { attr: { r: 0 }, opacity: 1 },
      { attr: { r: 60 }, duration: 1.0, ease: "power2.out" },
      3.05,
    );
    // retire the frontier highlight once the form is alive
    tl.to(
      hiliteRef.current,
      { opacity: 0, duration: 0.7, ease: "sine.inOut" },
      3.7,
    );
    tl.to(
      seedRef.current,
      { opacity: 0.5, duration: 0.8, ease: "sine.inOut" },
      3.7,
    );

    // 4 — idle forever: microscopic breathing + glow flicker (no spin/float)
    tl.eventCallback("onComplete", () => {
      idle.push(
        gsap.to(groupRef.current, {
          scale: 1.008,
          duration: 4.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          svgOrigin: `${CX} ${CY}`,
        }),
        gsap.to(seedRef.current, {
          opacity: 0.72,
          duration: 3.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        }),
      );
    });

    // Trigger when the scroll story's final section comes into view.
    const watch = () => {
      if (story.finalP > 0.12) {
        tl.play();
        return; // stop watching
      }
      raf = requestAnimationFrame(watch);
    };
    raf = requestAnimationFrame(watch);

    return () => {
      cancelAnimationFrame(raf);
      tl.kill();
      idle.forEach((t) => t.kill());
    };
  }, []);

  return (
    <span
      className={`logo-reveal ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 86.56 83.22"
        width={size}
        height={size}
        aria-label="Growcast"
        role="img"
      >
        <defs>
          {/* soft (not smoky) glow for the seed */}
          <filter id="lr-soft" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          {/* feathered growth frontier — white core fading at the edge */}
          <radialGradient id="lr-feather">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.8" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          {/* bright thin ring near a circle's outer edge — the leading highlight */}
          <radialGradient id="lr-ring">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.72" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.9" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          {/* seed glow tint */}
          <radialGradient id="lr-seed">
            <stop offset="0" stopColor="#eef6c4" />
            <stop offset="0.4" stopColor={MARK} stopOpacity="0.7" />
            <stop offset="1" stopColor={MARK} stopOpacity="0" />
          </radialGradient>

          <clipPath id="lr-wedge-up">
            <path d={wedgePath(SECTORS.up)} />
          </clipPath>
          <clipPath id="lr-wedge-ll">
            <path d={wedgePath(SECTORS.ll)} />
          </clipPath>
          <clipPath id="lr-wedge-lr">
            <path d={wedgePath(SECTORS.lr)} />
          </clipPath>

          {/* reveal mask: three feathered circles grow within their leaf wedges */}
          <mask
            id="lr-reveal"
            maskUnits="userSpaceOnUse"
            x="-30"
            y="-30"
            width="160"
            height="160"
          >
            <g clipPath="url(#lr-wedge-up)">
              <circle
                ref={revUp}
                cx={CX}
                cy={CY}
                r={0}
                fill="url(#lr-feather)"
              />
            </g>
            <g clipPath="url(#lr-wedge-ll)">
              <circle
                ref={revLL}
                cx={CX}
                cy={CY}
                r={0}
                fill="url(#lr-feather)"
              />
            </g>
            <g clipPath="url(#lr-wedge-lr)">
              <circle
                ref={revLR}
                cx={CX}
                cy={CY}
                r={0}
                fill="url(#lr-feather)"
              />
            </g>
          </mask>

          {/* frontier mask: a bright ring rides each growth edge, plus the breath pulse */}
          <mask
            id="lr-frontier"
            maskUnits="userSpaceOnUse"
            x="-30"
            y="-30"
            width="160"
            height="160"
          >
            <g clipPath="url(#lr-wedge-up)">
              <circle ref={frUp} cx={CX} cy={CY} r={0} fill="url(#lr-ring)" />
            </g>
            <g clipPath="url(#lr-wedge-ll)">
              <circle ref={frLL} cx={CX} cy={CY} r={0} fill="url(#lr-ring)" />
            </g>
            <g clipPath="url(#lr-wedge-lr)">
              <circle ref={frLR} cx={CX} cy={CY} r={0} fill="url(#lr-ring)" />
            </g>
            <circle ref={pulseRef} cx={CX} cy={CY} r={0} fill="url(#lr-ring)" />
          </mask>
        </defs>

        <g ref={groupRef}>
          {/* seed glow at the origin */}
          {/* <circle
            ref={seedRef}
            cx={CX}
            cy={CY}
            r={20}
            fill="url(#lr-seed)"
            filter="url(#lr-soft)"
            opacity={0}
          /> */}
          {/* the exact mark, revealed by the growth mask */}
          <path d={LOGO_D} fill={MARK} mask="url(#lr-reveal)" />
          {/* lighter copy, masked to the moving frontier — life flowing through */}
          <path
            ref={hiliteRef}
            d={LOGO_D}
            fill={HILITE}
            mask="url(#lr-frontier)"
            style={{ mixBlendMode: "screen" }}
          />
        </g>
      </svg>
    </span>
  );
}
