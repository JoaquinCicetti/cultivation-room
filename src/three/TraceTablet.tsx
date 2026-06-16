import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { seg, smooth, story } from "../scroll/story";
import { CONTROLLER_POS } from "./sceneData";
import { TraceReport } from "../components/TraceReport";

// Section 05 → Traceability as a real 3D device: the production report is the
// actual DOM, rendered ON the tablet face via drei <Html transform> (CSS3D), so
// the real report is on the tablet the whole time and rotates + flies with it in
// 3D — it detaches from the wall, turns to face the viewer and moves to the front.
const START = new THREE.Vector3(CONTROLLER_POS[0], CONTROLLER_POS[1], CONTROLLER_POS[2]);
const Q_WALL = new THREE.Quaternion(); // flush on the back wall (+z)
const endPos = new THREE.Vector3();
const ndc = new THREE.Vector3();

export function TraceTablet() {
  const { camera, size } = useThree();
  const grp = useRef<THREE.Group>(null);
  // <Html> ignores group.visible, so mount/unmount it as the section enters/exits
  const [show, setShow] = useState(false);
  const showRef = useRef(false);

  useFrame(() => {
    const p = story.p;
    const live = p > 0.6 && p < 0.96; // present through the traceability section
    if (live !== showRef.current) {
      showRef.current = live;
      setShow(live);
    }
    const g = grp.current;
    if (!g || !live) return;

    const e = smooth(seg(p, 0.61, 0.72)); // detach → rotate → fly to front
    const mobile = size.width < 768;
    // Desktop: centre-right (the title keeps the left side). Mobile: centre
    // horizontally and drop LOW (below the stacked title text), overlapping room.
    ndc.set(mobile ? 0 : 0.26, mobile ? -0.78 : 0.02, -0.3).unproject(camera);
    endPos.copy(ndc);
    g.position.lerpVectors(START, endPos, e);
    g.quaternion.copy(Q_WALL).slerp(camera.quaternion, e); // wall-flush → billboard

    // Desktop fits to viewport height. Mobile uses a fixed larger scale (~90% of
    // the screen width) — the lower mobile camera zoom otherwise shrinks the
    // CSS3D report, so a constant here compensates to keep it big and legible.
    const endS = mobile ? 0.4 : size.height / 2320;
    g.scale.setScalar(THREE.MathUtils.lerp(endS * 0.34, endS, e));
  });

  return (
    <group ref={grp}>
      {show && (
        <Html transform occlude={false} zIndexRange={[18, 0]} style={{ pointerEvents: "none" }}>
          <TraceReport />
        </Html>
      )}
    </group>
  );
}
