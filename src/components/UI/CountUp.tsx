import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number; // ms
}

export default function CountUp({ value, duration = 800 }: Props) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const diff = end - start;
    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.round(start + diff * progress);

      setDisplay(current);

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    prevValue.current = value;
  }, [value, duration]);

  return <span>{display?.toLocaleString()}</span>;
}
