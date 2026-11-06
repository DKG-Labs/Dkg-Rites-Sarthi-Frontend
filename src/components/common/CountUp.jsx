import { useEffect, useRef, useState } from 'react';
import './CountUp.css';

// Counts a number up from its previous value (0 at first) once it scrolls into view.
// Non-numeric values render as-is.
const parse = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? { num: value, decimals: 0, grouped: false } : null;
  const text = String(value).trim();
  if (!/^-?[\d,]*\.?\d+$/.test(text)) return null;
  const clean = text.replace(/,/g, '');
  const dot = clean.indexOf('.');
  return { num: parseFloat(clean), decimals: dot >= 0 ? clean.length - dot - 1 : 0, grouped: text.includes(',') };
};

const CountUp = ({ value, duration = 1600, className = '' }) => {
  const parsed = parse(value);
  const target = parsed ? parsed.num : 0;

  const [display, setDisplay] = useState(0);
  const [visible, setVisible] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const shownRef = useRef(0);
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!parsed || !visible) return undefined;
    const from = shownRef.current;
    if (from === target) {
      setDisplay(target);
      return undefined;
    }
    setRunKey((k) => k + 1);
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const next = from + (target - from) * eased;
      // Track what is on screen so a re-run (StrictMode, refresh) continues from here instead of skipping to the end
      shownRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
      else shownRef.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, visible, duration]);

  if (!parsed) return <span className={className}>{value ?? ''}</span>;

  const format = (n) => {
    const fixed = n.toFixed(parsed.decimals);
    return parsed.grouped
      ? Number(fixed).toLocaleString('en-IN', { minimumFractionDigits: parsed.decimals, maximumFractionDigits: parsed.decimals })
      : fixed;
  };
  const text = format(display);

  return (
    <span ref={elRef} className={`countup ${className}`} data-final={format(target)}>
      <span key={runKey} className="countup__rise">{text}</span>
    </span>
  );
};

export default CountUp;
