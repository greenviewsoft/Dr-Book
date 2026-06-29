import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nContext";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

function toBn(num) {
  return String(num).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

// Parse a leading number out of a display string like "10+", "5000+", "4.9",
// "১০+" (Bengali digits). Returns null if no leading number is found.
function parse(value) {
  const m = String(value).match(/^([0-9০-৯]*\.?[0-9০-৯]+)(.*)$/);
  if (!m) return null;
  const western = m[1].replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  const decimals = western.includes(".")
    ? western.split(".")[1].length
    : 0;
  return { num: parseFloat(western), suffix: m[2], decimals };
}

function format(v, parsed, lang) {
  const txt = parsed.decimals
    ? v.toFixed(parsed.decimals)
    : Math.round(v).toString();
  return (lang === "bn" ? toBn(txt) : txt) + parsed.suffix;
}

// Counts a number up from 0 to its target when it scrolls into view.
// `value` is the final display string (may contain Bengali digits / a suffix).
export function CountUp({ value, className }) {
  const { lang } = useI18n();
  const ref = useRef(null);
  const parsed = parse(value);
  const [display, setDisplay] = useState(
    parsed ? format(0, parsed, lang) : value,
  );

  useEffect(() => {
    if (!parsed) {
      setDisplay(value);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const finalize = () => setDisplay(value);

    if (reduce) {
      finalize();
      return;
    }

    const el = ref.current;
    let io;
    const animate = () => {
      io?.disconnect();
      const dur = 1100;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(format(parsed.num * eased, parsed, lang));
        if (p < 1) requestAnimationFrame(tick);
        else finalize();
      };
      requestAnimationFrame(tick);
    };

    io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && animate(),
      { threshold: 0.4 },
    );
    if (el) io.observe(el);
    return () => io?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, lang]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
