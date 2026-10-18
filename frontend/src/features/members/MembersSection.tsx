import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { MEMBERS } from "../../constants/members";
import type { Member } from "../../constants/members";
import { useLanguage } from "../../i18n/useLanguage";
import type { Lang } from "../../i18n";
import { SPRING } from "../../lib/motion";
import { fadeUp, staggerGroup } from "../hero/variants";

const BEZIER = "cubic-bezier(0.25, 0.1, 0.25, 1)";
const DURATION = 600;

const TABLET_BREAKPOINT = 640;
const DESKTOP_BREAKPOINT = 1024;

const getDeviceTier = () => {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < TABLET_BREAKPOINT) return "mobile";
  if (w < DESKTOP_BREAKPOINT) return "tablet";
  return "desktop";
};

const useDeviceTier = () => {
  const [tier, setTier] = useState(getDeviceTier);
  useEffect(() => {
    const onResize = () => setTier(getDeviceTier());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return tier;
};

const TIER_CONFIG = {
  mobile: { SW: 220, GAP: 96, stageHeight: 320, arrowSize: 44, chevronSize: 16, maxOffset: 1, rowGap: 8, panelPad: "p-3", titleSize: 15 },
  tablet: { SW: 200, GAP: 70, stageHeight: 340, arrowSize: 48, chevronSize: 18, maxOffset: 2, rowGap: 16, panelPad: "p-4", titleSize: 17 },
  desktop: { SW: 340, GAP: 210, stageHeight: 460, arrowSize: 56, chevronSize: 20, maxOffset: 2, rowGap: 24, panelPad: "p-5", titleSize: 20 },
} as const;

type Tier = keyof typeof TIER_CONFIG;

function wrap(i: number, n: number) {
  return ((i % n) + n) % n;
}

function getInitials(member: Member, lang: Lang) {
  const name = member.name[lang] ?? member.name.en;
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("");
}

export default function MembersSection() {
  const { t, lang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef(0);
  const [inView, setInView] = useState(false);
  const total = MEMBERS.length;
  const tier: Tier = useDeviceTier();
  const { SW, GAP, stageHeight, arrowSize, chevronSize, maxOffset, rowGap, panelPad, titleSize } = TIER_CONFIG[tier];
  const maxSlides = Math.min(maxOffset, Math.floor((total - 1) / 2));

  const goTo = useCallback(
    (i: number) => {
      setActive(wrap(i, total));
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    [total]
  );

  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (paused || reduceMotion) return;
    timerRef.current = setInterval(next, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, next, reduceMotion]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [prev, next]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].screenX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
  };

  const slides = [];
  for (let offset = -maxSlides; offset <= maxSlides; offset++) {
    const idx = wrap(active + offset, total);
    const abs = Math.abs(offset);
    const scale = abs === 0 ? 1 : abs === 1 ? 0.85 : 0.75;
    const rotY = offset === 0 ? 0 : -offset * (abs === 1 ? 45 : 55);
    const tz = -abs * 60;
    slides.push({
      idx,
      offset,
      translateX: offset * GAP,
      scale,
      rotateY: rotY,
      translateZ: tz,
      blur: abs === 0 ? 0 : abs === 1 ? 2 : 4,
      opacity: abs === 0 ? 1 : abs === 1 ? 0.65 : 0.45,
      zIndex: Math.max(10 - abs, 0),
      isActive: abs === 0,
      item: MEMBERS[idx],
    });
  }

  const arrowClass =
    "flex cursor-pointer items-center justify-center rounded-full border border-charcoal-300 bg-surface text-charcoal-500 transition-[border-color,background-color,color,scale] duration-150 ease-out hover:scale-105 hover:border-transparent hover:bg-ink hover:text-surface active:scale-[0.96] dark:border-white/20 dark:bg-surface dark:text-white/60 dark:hover:bg-white dark:hover:text-black";

  const enterStagger: Variants = reduceMotion
    ? { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0 } } }
    : staggerGroup;

  const enterFade: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : fadeUp;

  const enterLift: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: SPRING },
      };

  return (
    <motion.section
      id="members"
      ref={sectionRef}
      tabIndex={0}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={enterStagger}
      className="w-full scroll-mt-20 overflow-hidden border-t border-charcoal-800/10 bg-surface px-4 py-16 select-none outline-none sm:px-6 md:py-24 dark:border-white/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <motion.div variants={enterStagger} className="mx-auto max-w-7xl">
        <motion.p
          variants={enterFade}
          className="mb-3 text-center text-sm tracking-[0.3em] text-ink-muted uppercase"
        >
          {t("members.eyebrow")}
        </motion.p>
        <motion.h2
          variants={enterFade}
          className="mb-10 text-center text-3xl font-semibold text-ink md:mb-16 md:text-5xl"
        >
          {t("members.title")}
        </motion.h2>
      </motion.div>

      {/* Carousel row */}
      <motion.div
        variants={enterLift}
        className="relative mx-auto flex max-w-7xl items-center"
        style={{ gap: rowGap }}
      >
        {/* Left arrow */}
        <div className="z-20 flex shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={prev}
            className={arrowClass}
            style={{ width: arrowSize, height: arrowSize }}
            aria-label="Previous member"
          >
            <FiChevronLeft size={chevronSize} />
          </button>
        </div>

        {/* Slide stage */}
        <div className="relative flex-1 overflow-visible" style={{ height: stageHeight }}>
          <div className="relative flex h-full w-full items-center justify-center" style={{ perspective: "1400px" }}>
            {slides.map((s) => (
              <div
                key={s.idx}
                aria-hidden={!s.isActive}
                onClick={() => goTo(s.idx)}
                onMouseEnter={() => setHoveredIdx(s.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="absolute top-0 cursor-pointer"
                style={{
                  width: SW,
                  left: "50%",
                  marginLeft: -SW / 2,
                  zIndex: s.zIndex,
                  transform: `translateX(${s.translateX}px) translateZ(${s.translateZ}px) rotateY(${s.rotateY}deg) scale(${s.scale})`,
                  opacity: s.opacity,
                  transition: `transform ${DURATION}ms ${BEZIER}, opacity ${DURATION}ms ${BEZIER}`,
                }}
              >
                <div
                  className="overflow-hidden rounded-2xl border border-charcoal-800/10 bg-charcoal-50 dark:border-white/10 dark:bg-white/[0.04]"
                  style={{
                    borderColor: s.isActive
                      ? undefined
                      : "transparent",
                    boxShadow: s.isActive ? "0 16px 40px -28px rgba(11, 60, 111, 0.55)" : "none",
                  }}
                >
                  {/* Media */}
                  <div
                    className="aspect-[4/3] overflow-hidden"
                    style={{
                      filter: `${hoveredIdx === s.idx && s.isActive ? "grayscale(0)" : "grayscale(1)"}${s.blur ? ` blur(${s.blur}px)` : ""} brightness(${s.isActive ? 1 : 0.55})`,
                      transition: `filter ${DURATION}ms ${BEZIER}`,
                    }}
                  >
                    {s.item.image ? (
                      <img
                        src={s.item.image}
                        alt={s.item.name[lang]}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
                        <span className="text-4xl font-semibold tracking-wide text-white/90">
                          {getInitials(s.item, lang)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content panel */}
                  <div
                    className={panelPad}
                    style={{
                      background: "var(--color-surface)",
                      opacity: s.isActive ? 1 : 0,
                      transition: `opacity 350ms ${BEZIER}`,
                    }}
                  >
                    <div className="mb-2 font-mono text-sm font-bold text-ink-muted">
                      SINCE {s.item.since}
                    </div>

                    <span className="inline-block bg-primary-600 px-[10px] py-[6px] text-[10px] font-bold tracking-[0.15em] text-white uppercase">
                      {s.item.badge[lang]}
                    </span>

                    <h3
                      className="mt-3 font-bold text-ink uppercase"
                      style={{ fontSize: titleSize, lineHeight: 1.2 }}
                    >
                      {s.item.name[lang]}
                    </h3>

                    <p className="mt-1 text-ink-muted" style={{ fontSize: 13 }}>
                      {s.item.role[lang]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right arrow */}
        <div className="z-20 flex shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={next}
            className={arrowClass}
            style={{ width: arrowSize, height: arrowSize }}
            aria-label="Next member"
          >
            <FiChevronRight size={chevronSize} />
          </button>
        </div>
      </motion.div>

      {/* Dot pagination */}
      <motion.div
        variants={enterLift}
        className="mx-auto mt-10 flex max-w-7xl items-center justify-center gap-1"
      >
        {MEMBERS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-current={i === active ? "true" : undefined}
            aria-label={`Go to member ${i + 1}`}
            className="flex cursor-pointer items-center justify-center"
            style={{ width: 44, height: 44 }}
          >
            <span
              className="transition-[width,height,background-color,border-color] duration-300"
              style={
                i === active
                  ? { width: 24, height: 8, background: "var(--color-primary-600)", borderRadius: 9999, border: "none" }
                  : { width: 8, height: 8, borderRadius: 9999, border: "1px solid rgba(106,114,128,0.4)", background: "transparent" }
              }
            />
          </button>
        ))}
      </motion.div>
    </motion.section>
  );
}
