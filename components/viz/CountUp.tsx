"use client";

import { animate } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE } from "@/lib/motion";

export function CountUp({ to, delay = 0, duration = 0.9 }: { to: number; delay?: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration, delay, ease: EASE, onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to, delay, duration]);
  return <>{v}</>;
}
