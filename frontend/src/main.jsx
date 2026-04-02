import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import katex from "katex";
import "katex/dist/katex.min.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8001";

const VOLUME = 0.2;
const popAudio          = Object.assign(new Audio("/pop.mp3"),               { volume: VOLUME });
const popCorrectAudio   = Object.assign(new Audio("/pop_correct.mp3"),       { volume: VOLUME });
const popWrongAudio     = Object.assign(new Audio("/pop_wrong.mp3"),         { volume: VOLUME });
const popStartAudio     = Object.assign(new Audio("/pop_start.mp3"),         { volume: VOLUME });
const popTerminarAudio  = Object.assign(new Audio("/pop_terminar_repaso.mp3"),   { volume: VOLUME });
const popConteoAudio    = Object.assign(new Audio("/pop_conteo_experiencia.mp3"), { volume: VOLUME });
function playPop()      { popAudio.currentTime = 0;         popAudio.play().catch(() => {}); }
function playCorrect()  { popCorrectAudio.currentTime = 0;  popCorrectAudio.play().catch(() => {}); }
function playWrong()    { popWrongAudio.currentTime = 0;    popWrongAudio.play().catch(() => {}); }
function playStart()    { popStartAudio.currentTime = 0;    popStartAudio.play().catch(() => {}); }
function playTerminar() { popTerminarAudio.currentTime = 0; popTerminarAudio.play().catch(() => {}); }
function playConteo()   { popConteoAudio.currentTime = 0;   popConteoAudio.play().catch(() => {}); }

// ── Constants ──────────────────────────────────────────────────────────────────

const UNIVERSIDADES = [
  "UBA", "UTN", "UNLP", "UNAHUR", "UNGS", "UNQ",
  "UNLAM", "UNSAM", "UNLu", "UNMdP", "UNLa",
];

const CARRERAS = [
  { value: "ciencias",    label: "Ciencias",    emoji: "🔬" },
  { value: "tecnologia",  label: "Tecnología",  emoji: "💻" },
  { value: "ingenieria",  label: "Ingeniería",  emoji: "⚙️" },
  { value: "matematica",  label: "Matemática",  emoji: "📐" },
  { value: "otra",        label: "Otra",        emoji: null },
];

const BELTS = [
  { name: "Blanco",  color: "#F5F5DC", text: "#7A6A30", total: 21, stripeAt: [3, 9], promoteAt: 18   },
  { name: "Azul",    color: "#1C3A8B", text: "#fff",    total: 18, stripeAt: [2, 6], promoteAt: 15   },
  { name: "Violeta", color: "#6B2D8B", text: "#fff",    total: 18, stripeAt: [2, 6], promoteAt: 15   },
  { name: "Marrón",  color: "#6B3A1F", text: "#fff",    total: 15, stripeAt: [2, 5], promoteAt: 12   },
  { name: "Negro",   color: "#111111", text: "#fff",    total: null, stripeAt: [],   promoteAt: null  },
];

const BELT_COLORS = ['#E0DDD0','#1C3A8B','#6B2D8B','#6B3A1F','#111111'];

const SKILL_LABELS = {
  CLSF: "Clasificación", LEXI: "Léxico", FORM: "Formulación",
  GRAF: "Graficación", RESV: "Resolución", DERI: "Derivación",
  INTG: "Integración", APLI: "Aplicación",
};

const FAMILY_LABELS = {
  linear: "Lineal", quadratic: "Cuadrática", polynomial: "Polinomial",
  exponential: "Exponencial", logarithmic: "Logarítmica",
  trigonometric: "Trigonométrica", rational: "Racional",
};

const WHITE_BELT_TOPICS = [
  { key: "linear",        label: "Lineal" },
  { key: "quadratic",     label: "Cuadrática" },
  { key: "polynomial",    label: "Polinomial" },
  { key: "exponential",   label: "Exponencial" },
  { key: "logarithmic",   label: "Logarítmica" },
  { key: "rational",      label: "Racional" },
  { key: "trigonometric", label: "Trigonométrica" },
];
const WHITE_BELT_SKILLS = ["CLSF", "LEXI", "FORM"];
const STRIPE_THRESHOLDS  = [3, 9];
const PROMOTION_THRESHOLD = 18;
const MASTERY_TOTAL       = 21;

const BELT_DATA = [
  {
    name: "Blanco", img: "/belt_white.png", colorIdx: 0,
    skills: ["CLSF", "LEXI", "FORM"],
    topics: [
      { key: "linear",        label: "Lineal" },
      { key: "quadratic",     label: "Cuadrática" },
      { key: "polynomial",    label: "Polinomial" },
      { key: "exponential",   label: "Exponencial" },
      { key: "logarithmic",   label: "Logarítmica" },
      { key: "rational",      label: "Racional" },
      { key: "trigonometric", label: "Trigonométrica" },
    ],
    stripeAt: [3, 9], promoteAt: 18, total: 21,
  },
  {
    name: "Azul", img: "/belt_blue.png", colorIdx: 1,
    skills: ["GRAF", "RESL", "CLSF"],
    topics: [
      { key: "lim_algebraic", label: "Lím. algebraicos" },
      { key: "lim_lateral",   label: "Lím. laterales" },
      { key: "lim_infinity",  label: "Lím. al infinito" },
      { key: "continuity",    label: "Continuidad" },
      { key: "indeterminate", label: "Indet." },
      { key: "lhopital",      label: "L'Hôpital" },
    ],
    stripeAt: [2, 6], promoteAt: 15, total: 18,
  },
  {
    name: "Violeta", img: "/belt_purple.png", colorIdx: 2,
    skills: ["GRAF", "DERI", "APLI"],
    topics: [
      { key: "deriv_def",     label: "Definición" },
      { key: "deriv_basic",   label: "Reglas básicas" },
      { key: "deriv_product", label: "Prod./Cociente" },
      { key: "deriv_chain",   label: "Cadena" },
    ],
    stripeAt: [2, 5], promoteAt: 10, total: 12,
  },
  {
    name: "Marrón", img: "/belt_brown.png", colorIdx: 3,
    skills: ["GRAF", "INTG", "APLI"],
    topics: [
      { key: "integ_indef", label: "Indefinida" },
      { key: "integ_ftc",   label: "T. Fundamental" },
      { key: "integ_subs",  label: "Sustitución" },
      { key: "integ_parts", label: "Por partes" },
      { key: "integ_def",   label: "Definidas" },
    ],
    stripeAt: [2, 5], promoteAt: 12, total: 15,
  },
];

// Example exercise for the tutorial
const TUTORIAL_EXERCISE = {
  id: "tutorial-example",
  question: "¿Cuál de estas expresiones representa una función lineal?",
  options: ["$f(x) = 5x - 2$", "$f(x) = x^2$", "$f(x) = 3^x$", "$f(x) = \\log(x)$"],
  correct_index: 0,
  has_math: true,
  skill: "CLSF",
  graph_fn: null,
  graph_view: null,
  feedback_correct: "¡Correcto! Una función lineal tiene la forma $f(x) = mx + b$, donde $m$ y $b$ son constantes.",
  feedback_incorrect: "Una función lineal tiene la forma $f(x) = mx + b$. La opción correcta es $f(x) = 5x - 2$.",
};

// ── Design tokens (pseudo dark mode) ─────────────────────────────────────────

const fonts = {
  heading: "'Computer Modern Serif', 'Roboto Serif', Georgia, serif",
  body: "'Inter', system-ui, sans-serif",
};

const C = {
  bg: "#131324", bgCard: "#1E1E34", bgElevated: "#2A2A4A",
  nav: "#1A1A2A", border: "#38385A",
  primary: "#7E80F7", primaryHover: "#9698FA",
  success: "#36D87A", successBg: "rgba(54,216,122,0.15)",
  error: "#F76565", errorBg: "rgba(247,101,101,0.15)",
  text: "#F6F8FC", textSecondary: "#A4B3C6", muted: "#768899",
  pill: "rgba(126,128,247,0.15)", pillText: "#BCBDFC",
};

const card = {
  background: C.bgCard, borderRadius: 20,
  boxShadow: "0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.15)",
  padding: "1.75rem",
};

const inputStyle = {
  width: "100%", padding: "0.9rem 1rem",
  border: `1px solid ${C.border}`, borderRadius: 10,
  fontSize: "0.95rem", outline: "none", color: C.text,
  background: C.bgElevated, boxSizing: "border-box",
  fontFamily: fonts.body,
};

const labelSt = {
  display: "block", fontWeight: 600, fontSize: "0.78rem", color: C.muted,
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem",
};

// ── MathText ───────────────────────────────────────────────────────────────────

function MathText({ text }) {
  const parts = text.split(/\$([^$]+)\$/g);
  return (
    <span>
      {parts.map((p, i) =>
        i % 2 === 0 ? p : (
          <span key={i} dangerouslySetInnerHTML={{
            __html: katex.renderToString(p, { throwOnError: false }),
          }} />
        )
      )}
    </span>
  );
}

// ── Logo (text-based) ──────────────────────────────────────────────────────────

function Logo({ size = "1.4rem" }) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{
        fontFamily: fonts.heading, fontWeight: 100, fontSize: size,
        color: C.text, letterSpacing: "normal", lineHeight: 1,
      }}>
        intervalo
      </span>
      <div style={{ display: "flex", height: 3, width: "100%", borderRadius: 2, overflow: "hidden" }}>
        {BELT_COLORS.map((col, i) => (
          <div key={i} style={{ flex: 1, background: col }} />
        ))}
      </div>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

function Nav({ rightContent }) {
  return (
    <nav style={{
      background: C.nav, padding: "0 1.5rem", height: 52,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <Logo size="1.1rem" />
      {rightContent && <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>{rightContent}</div>}
    </nav>
  );
}

// ── FunctionPlot ───────────────────────────────────────────────────────────────

function FunctionPlot({ fnStr, view }) {
  const [xMin, xMax, yMin, yMax] = view;
  const W = 480, H = 280, PAD = 44;
  const pw = W - 2 * PAD, ph = H - 2 * PAD;
  const toX = x => PAD + ((x - xMin) / (xMax - xMin)) * pw;
  const toY = y => H - PAD - ((y - yMin) / (yMax - yMin)) * ph;
  const plotId = useRef(`plot-${Math.random().toString(36).slice(2, 8)}`).current;

  let fn;
  try {
    fn = new Function("x",
      `const sin=Math.sin,cos=Math.cos,tan=Math.tan,pow=Math.pow,
             log=Math.log,log2=Math.log2,log10=Math.log10,
             exp=Math.exp,abs=Math.abs,sqrt=Math.sqrt,PI=Math.PI,E=Math.E;
       return ${fnStr};`);
  } catch { fn = () => 0; }

  const segments = []; let seg = [];
  const margin = (yMax - yMin) * 2;
  for (let i = 0; i <= 600; i++) {
    const x = xMin + (i / 600) * (xMax - xMin);
    let y; try { y = fn(x); } catch { y = NaN; }
    if (!isFinite(y) || y < yMin - margin || y > yMax + margin) {
      if (seg.length > 1) segments.push(seg); seg = [];
    } else seg.push([toX(x), toY(y)]);
  }
  if (seg.length > 1) segments.push(seg);

  const ax = toX(Math.max(xMin, Math.min(xMax, 0)));
  const ay = toY(Math.max(yMin, Math.min(yMax, 0)));
  const xStep = xMax - xMin > 10 ? 2 : 1;
  const yStep = yMax - yMin > 10 ? 2 : 1;
  const xTicks = [], yTicks = [];
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep) if (x !== 0) xTicks.push(x);
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) if (y !== 0) yTicks.push(y);

  return (
    <svg viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", borderRadius: 10, display: "block", background: "#FAFBFC" }}>
      {xTicks.map(x => <line key={`gx${x}`} x1={toX(x)} y1={PAD} x2={toX(x)} y2={H-PAD} stroke="#E2E5EA" strokeWidth="1" />)}
      {yTicks.map(y => <line key={`gy${y}`} x1={PAD} y1={toY(y)} x2={W-PAD} y2={toY(y)} stroke="#E2E5EA" strokeWidth="1" />)}
      <line x1={PAD} y1={ay} x2={W-PAD} y2={ay} stroke="#9CA3AF" strokeWidth="1.5" />
      <line x1={ax} y1={PAD} x2={ax} y2={H-PAD} stroke="#9CA3AF" strokeWidth="1.5" />
      <polygon points={`${W-PAD+1},${ay} ${W-PAD-7},${ay-4} ${W-PAD-7},${ay+4}`} fill="#9CA3AF" />
      <polygon points={`${ax},${PAD-1} ${ax-4},${PAD+7} ${ax+4},${PAD+7}`} fill="#9CA3AF" />
      {xTicks.map(x => (
        <g key={`tx${x}`}>
          <line x1={toX(x)} y1={ay-4} x2={toX(x)} y2={ay+4} stroke="#9CA3AF" strokeWidth="1" />
          <text x={toX(x)} y={ay+15} textAnchor="middle" fontSize="11" fill="#4B5563">{x}</text>
        </g>
      ))}
      {yTicks.map(y => (
        <g key={`ty${y}`}>
          <line x1={ax-4} y1={toY(y)} x2={ax+4} y2={toY(y)} stroke="#9CA3AF" strokeWidth="1" />
          <text x={ax-8} y={toY(y)+4} textAnchor="end" fontSize="11" fill="#4B5563">{y}</text>
        </g>
      ))}
      <clipPath id={plotId}><rect x={PAD} y={PAD} width={pw} height={ph} /></clipPath>
      {segments.map((s, i) => (
        <polyline key={i} points={s.map(([x,y]) => `${x},${y}`).join(" ")}
          fill="none" stroke="#4F46E5" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${plotId})`} />
      ))}
    </svg>
  );
}

// ── ProgressGrid ───────────────────────────────────────────────────────────────

// Estado derivado directamente del algoritmo SM2:
//   sin entry       → Sin iniciar  (nunca visto)
//   learning, si=0  → Reiniciado   (fallo: el backend resetea a step 0)
//   learning, si>0  → Aprendiendo  (racha: 1/3 o 2/3)
//   review          → Maduro       (graduado: 3/3)
function itemCell(entry) {
  if (!entry) return { bg: C.bgElevated, label: "-", textColor: C.muted };

  if (entry.phase === "review") {
    return { bg: "rgba(21,128,61,0.35)", label: "3/3", textColor: "#BBF7D0" };
  }

  const si = entry.step_index ?? 0;
  if (si === 0) {
    // Pendiente: attempted but failed, scheduled for review (orange)
    return { bg: "rgba(180,83,9,0.32)", label: "0/3", textColor: "#FDE68A" };
  }
  // Aprendiendo: correct answers, progressing (lime)
  return { bg: "rgba(101,163,13,0.32)", label: `${si}/3`, textColor: "#D9F99D" };
}

function ProgressGrid({ skillStates, revealedKeys }) {
  const revealed = revealedKeys || null; // null = show all (home screen), Set = animated (summary)
  return (
    <div>
      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 44px 44px",
        gap: "3px", marginBottom: "4px", paddingLeft: "4px" }}>
        <div />
        {WHITE_BELT_SKILLS.map(h => (
          <div key={h} style={{ fontSize: "0.62rem", fontWeight: 700, color: C.muted,
            textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {h}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {WHITE_BELT_TOPICS.map(({ key: topicKey, label }) => (
          <div key={topicKey} style={{ display: "grid",
            gridTemplateColumns: "1fr 44px 44px 44px", gap: "3px", alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.textSecondary, paddingLeft: "4px" }}>
              {label}
            </div>
            {WHITE_BELT_SKILLS.map(skill => {
              const k = `${topicKey}:${skill}`;
              const isRevealed = revealed === null || revealed.has(k);
              const entry = isRevealed ? skillStates[k] : undefined;
              const { bg, label: cellLabel, textColor } = itemCell(entry);
              return (
                <div key={skill} style={{
                  background: bg, borderRadius: 6, height: 26,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700, color: textColor,
                  transition: "background 0.4s ease",
                }}>
                  {cellLabel}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.85rem",
        flexWrap: "wrap", borderTop: `1px solid ${C.border}`, paddingTop: "0.7rem",
        justifyContent: "center" }}>
        {[
          { bg: C.bgElevated,            border: C.border,   label: "Bloqueado"   },
          { bg: "rgba(29,78,216,0.30)",  border: "#3B82F6",  label: "Nuevo"       },
          { bg: "rgba(180,83,9,0.32)",   border: "#B45309",  label: "Pendiente"   },
          { bg: "rgba(101,163,13,0.32)", border: "#84CC16",  label: "Aprendiendo" },
          { bg: "rgba(21,128,61,0.35)",  border: "#22C55E",  label: "Graduado"    },
        ].map(({ bg, border, label: ll }) => (
          <div key={ll} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: bg,
              border: `1px solid ${border}` }} />
            <span style={{ fontSize: "0.65rem", color: C.muted }}>{ll}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BeltGrid (generalized grid for any belt) ───────────────────────────────────

function BeltGrid({ topics, skills, skillStates, revealedKeys }) {
  const revealed = revealedKeys || null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 44px 44px",
        gap: "3px", marginBottom: "4px", paddingLeft: "4px" }}>
        <div />
        {skills.map(h => (
          <div key={h} style={{ fontSize: "0.62rem", fontWeight: 700, color: C.muted,
            textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {h}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {topics.map(({ key: topicKey, label }) => (
          <div key={topicKey} style={{ display: "grid",
            gridTemplateColumns: "1fr 44px 44px 44px", gap: "3px", alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.textSecondary, paddingLeft: "4px" }}>
              {label}
            </div>
            {skills.map(skill => {
              const k = `${topicKey}:${skill}`;
              const isRevealed = revealed === null || revealed.has(k);
              const entry = isRevealed ? skillStates?.[k] : undefined;
              const { bg, label: cellLabel, textColor } = itemCell(entry);
              return (
                <div key={skill} style={{
                  background: bg, borderRadius: 6, height: 26,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700, color: textColor,
                  transition: "background 0.4s ease",
                }}>
                  {cellLabel}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.85rem",
        flexWrap: "wrap", borderTop: `1px solid ${C.border}`, paddingTop: "0.7rem",
        justifyContent: "center" }}>
        {[
          { bg: C.bgElevated,            border: C.border,   label: "Bloqueado"   },
          { bg: "rgba(29,78,216,0.30)",  border: "#3B82F6",  label: "Nuevo"       },
          { bg: "rgba(180,83,9,0.32)",   border: "#B45309",  label: "Pendiente"   },
          { bg: "rgba(101,163,13,0.32)", border: "#84CC16",  label: "Aprendiendo" },
          { bg: "rgba(21,128,61,0.35)",  border: "#22C55E",  label: "Graduado"    },
        ].map(({ bg, border, label: ll }) => (
          <div key={ll} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: bg,
              border: `1px solid ${border}` }} />
            <span style={{ fontSize: "0.65rem", color: C.muted }}>{ll}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Slide wrapper (Brilliant-style transition) ─────────────────────────────────

function SlideTransition({ slideKey, direction, children }) {
  const anim = direction >= 0 ? "slideInRight" : "slideInLeft";
  return (
    <div key={slideKey} style={{
      animation: `${anim} 0.6s ease-out`,
    }}>
      {children}
    </div>
  );
}

// ── Typewriter ──────────────────────────────────────────────────────────────────

function Typewriter({ text, speed = 30, style, onDone, start = true }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) { setCount(0); return; }
    setCount(0);
    if (!text) { onDone?.(); return; }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setCount(i);
      if (i >= text.length) { clearInterval(t); onDone?.(); }
    }, speed);
    return () => clearInterval(t);
  }, [text, start]);
  return <span style={style}>{text.slice(0, count)}</span>;
}

// ── FadeIn ──────────────────────────────────────────────────────────────────────

function FadeIn({ show, delay = 0, style, children }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!show) { setVis(false); return; }
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [show, delay]);
  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.55s ease, transform 0.55s ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── TutorialScreen ─────────────────────────────────────────────────────────────

const TOTAL_SLIDES = 12;

function TutorialScreen({ onStart, onGoHome }) {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [career, setCareer] = useState("");
  const [uni, setUni] = useState("");
  const [uniCustom, setUniCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Animation state per slide
  const [titleDone, setTitleDone] = useState(false);
  // Slide 0 intro sequence
  const [logoBarShown, setLogoBarShown] = useState(false);
  const [holaStart, setHolaStart]       = useState(false);
  // 2-second readiness gate before continue is enabled
  const [readyToAdvance, setReadyToAdvance] = useState(false);
  useEffect(() => {
    setTitleDone(false);
    setLogoBarShown(false);
    setHolaStart(false);
    setReadyToAdvance(false);
    const t = setTimeout(() => setReadyToAdvance(true), 5000);
    return () => clearTimeout(t);
  }, [slide]);
  const onTitleDone = () => setTitleDone(true);

  // Delayed animation triggers for components that animate on mount
  const [timelineStarted,    setTimelineStarted]    = useState(false);
  const [beltSeqStarted,     setBeltSeqStarted]     = useState(false);
  const [itemStatesStarted,  setItemStatesStarted]  = useState(false);
  useEffect(() => {
    if (!titleDone || slide !== 4) { setTimelineStarted(false); return; }
    const t = setTimeout(() => setTimelineStarted(true), 11000);
    return () => clearTimeout(t);
  }, [titleDone, slide]);
  useEffect(() => {
    if (!titleDone || slide !== 6) { setBeltSeqStarted(false); return; }
    const t = setTimeout(() => setBeltSeqStarted(true), 3000);
    return () => clearTimeout(t);
  }, [titleDone, slide]);
  useEffect(() => {
    if (!titleDone || slide !== 5) { setItemStatesStarted(false); return; }
    const t = setTimeout(() => setItemStatesStarted(true), 12000);
    return () => clearTimeout(t);
  }, [titleDone, slide]);

  // Tutorial exercise state
  const [exWrongAttempts, setExWrongAttempts] = useState(new Set());
  const [exCorrectFound, setExCorrectFound]   = useState(false);
  const [exShakeIdx, setExShakeIdx]           = useState(null);
  const [exResult, setExResult]               = useState(null);

  function canAdvance() {
    if (slide === 9)  return false; // no Continuar button on this slide
    if (slide === 10) return uniCustom.trim().length > 0;
    if (slide === 11) return true;
    if (!readyToAdvance) return false;
    if (slide === 0) return name.trim().length > 0;
    if (slide === 3) return exCorrectFound;
    return true;
  }

  function goNext() {
    if (!canAdvance()) return;
    setDir(1);
    if (slide === 9 && uni !== "Otra") {
      setSlide(11);
    } else if (slide === 10) {
      setUni(uniCustom.trim());
      setSlide(11);
    } else {
      setSlide(s => Math.min(s + 1, TOTAL_SLIDES - 1));
    }
    window.scrollTo({ top: 0 });
  }

  function goBack() {
    setDir(-1);
    if (slide === 11 && uni !== "Otra") {
      setSlide(9);
    } else {
      setSlide(s => Math.max(s - 1, 0));
    }
    window.scrollTo({ top: 0 });
  }

  async function handleStart() {
    playStart();
    setLoading(true); setError(null);
    try {
      await onStart({ name: name.trim(), university: uni, career });
    } catch {
      setError("No se pudo conectar con el servidor.");
      setLoading(false);
    }
  }

  function handleExAnswer(idx) {
    if (exCorrectFound || exWrongAttempts.has(idx)) return;
    const isCorrect = idx === TUTORIAL_EXERCISE.correct_index;
    if (isCorrect) {
      playCorrect();
      setExCorrectFound(true);
      setExResult({ correct: true, feedback: TUTORIAL_EXERCISE.feedback_correct });
    } else {
      playWrong();
      const next = new Set(exWrongAttempts); next.add(idx);
      setExWrongAttempts(next);
      setExShakeIdx(idx);
      setTimeout(() => setExShakeIdx(null), 500);
      setExResult({ correct: false, feedback: "¿Seguro? Revisá tu respuesta e intentalo una vez más." });
    }
  }

  // Progress dots
  const dots = (
    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginBottom: "2rem" }}>
      {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
        <div key={i} style={{
          width: i === slide ? 24 : 8, height: 8, borderRadius: 999,
          background: i <= slide ? C.primary : C.border,
          transition: "all 0.4s ease",
        }} />
      ))}
    </div>
  );

  const continueBtn = (label = "Continuar", onClick = goNext) => (
    <button onClick={() => { if (!canAdvance()) return; playPop(); onClick(); }} disabled={!canAdvance()}
      style={{
        width: "100%", padding: "0.9rem", marginTop: "2rem",
        background: canAdvance() ? C.primary : C.border,
        color: canAdvance() ? "#fff" : C.muted,
        border: "none", borderRadius: 12, fontSize: "1rem",
        fontWeight: 700, cursor: canAdvance() ? "pointer" : "not-allowed",
        fontFamily: fonts.body, transition: "all 0.3s",
      }}>
      {label}
    </button>
  );

  const backBtn = slide > 0 ? (
    <button onClick={goBack}
      style={{ background: "none", border: "none", color: C.muted,
        cursor: "pointer", fontSize: "0.85rem", padding: "0.5rem 0",
        fontFamily: fonts.body, marginTop: "0.5rem", width: "100%", textAlign: "center" }}>
      Volver
    </button>
  ) : null;

  const slides = {
    // Slide 0: Name
    0: (
      <div style={{ textAlign: "center" }}>
        {/* Logo animado: primero el texto, luego la barra */}
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: fonts.heading, fontWeight: 100, fontSize: "2rem",
            color: C.text, letterSpacing: "normal", lineHeight: 1 }}>
            <Typewriter
              text="intervalo"
              speed={100}
              onDone={() => setTimeout(() => {
                setLogoBarShown(true);
                setTimeout(() => setHolaStart(true), 850);
              }, 550)}
            />
          </span>
          <div style={{ display: "flex", height: 3, width: "100%", borderRadius: 2, overflow: "hidden",
            transform: logoBarShown ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left center",
            transition: logoBarShown ? "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)" : "none" }}>
            {BELT_COLORS.map((col, i) => <div key={i} style={{ flex: 1, background: col }} />)}
          </div>
        </div>

        <h1 style={{ fontFamily: fonts.heading, fontSize: "1.4rem", fontWeight: 600,
          color: "rgba(244,247,251,0.75)", margin: "2rem 0 0.75rem", minHeight: "1.7em" }}>
          <Typewriter text="¡Hola!" speed={80} start={holaStart} onDone={onTitleDone} />
        </h1>
        <FadeIn show={titleDone} delay={450}>
          <p style={{ color: C.textSecondary, fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            ¿Cómo te gustaría que te llamen?
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={600}>
          <input type="text" value={name} onChange={e => {
              setName(e.target.value);
              if (e.target.value.toLowerCase() === "test") {
                setSlide(TOTAL_SLIDES - 1);
                setDir(1);
                window.scrollTo({ top: 0 });
              }
              if (e.target.value.toLowerCase() === "home") {
                onGoHome?.();
              }
            }}
            placeholder="Tu nombre"
            onKeyDown={e => e.key === "Enter" && canAdvance() && goNext()}
            style={{
              ...inputStyle, textAlign: "center", fontSize: "1rem",
              padding: "calc(0.9rem - 1px) 1rem", borderRadius: 12,
            }}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.border}
          />
        </FadeIn>
        <FadeIn show={titleDone} delay={900}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 1: Welcome with name
    1: (
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: fonts.heading, fontSize: "1.7rem", fontWeight: 800,
          color: C.text, margin: "2rem 0 0.75rem", minHeight: "2.1em" }}>
          <Typewriter text={`¡Bienvenido, ${name.trim() || "..."}!`} onDone={onTitleDone} />
        </h1>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "1.05rem", lineHeight: 1.7 }}>
            Intervalo es un sistema de <strong style={{ color: C.text }}>repaso adaptativo</strong> pensado para acompañarte durante tu cursada. Un algoritmo <strong style={{ color: C.text }}>aprende de tus respuestas</strong> y <strong style={{ color: C.text }}>prioriza</strong> lo que necesitás repasar. Este tutorial dura menos de 5 minutos.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={6500}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 2: Cursos
    2: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "1rem", minHeight: "1.9em" }}>
          <Typewriter text="Cursos" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1rem" }}>
            Intervalo está en <strong style={{ color: C.text }}>fase de incubación</strong>. Usándolo, <strong style={{ color: C.text }}>colaborás</strong> para que la herramienta sea cada vez más <strong style={{ color: C.text }}>útil</strong> para otros estudiantes.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={5500}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1rem" }}>
            La plataforma se organiza en <strong style={{ color: C.text }}>cursos</strong>, orientados a materias comunes de carreras de <strong style={{ color: C.text }}>ciencias</strong>, <strong style={{ color: C.text }}>tecnología</strong>, <strong style={{ color: C.text }}>ingeniería</strong> y <strong style={{ color: C.text }}>matemáticas</strong>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={9000}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            El único curso disponible por ahora es el de <strong style={{ color: C.text }}>Análisis Matemático I</strong>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={11500}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 3: Evocación Activa
    3: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "1rem", minHeight: "1.9em" }}>
          <Typewriter text="Evocación Activa" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Para rendir bien en los exámenes necesitás poder <strong style={{ color: C.text }}>recuperar conceptos</strong> sin fuentes externas.
            La idea es que contestes preguntas breves y puntuales, <strong style={{ color: C.text }}>sin material de consulta</strong>.
            Este tipo de práctica se llama <strong style={{ color: C.text }}>evocación activa</strong> o <em>active recall</em>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={7500} style={{ textAlign: "left" }}>
          <ExerciseCard
            exercise={TUTORIAL_EXERCISE}
            wrongAttempts={exWrongAttempts}
            correctFound={exCorrectFound}
            shakeIdx={exShakeIdx}
            result={exResult}
            onAnswer={handleExAnswer}
          />
          <div style={{ marginTop: "1rem" }}>{continueBtn()}</div>
        </FadeIn>
      </div>
    ),

    // Slide 4: Repetición Espaciada
    4: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "1rem", minHeight: "1.9em" }}>
          <Typewriter text="Repetición Espaciada" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "0.8rem" }}>
            Repasar <strong style={{ color: C.text }}>con cierta frecuencia</strong> es lo que determina si lo que entendimos en un momento va a estar <strong style={{ color: C.text }}>disponible cuando lo necesitamos</strong>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={4000}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            El algoritmo ajusta <strong style={{ color: C.text }}>qué repasar</strong> y <strong style={{ color: C.text }}>cada cuándo</strong>. Lo que te resulte difícil va a aparecer <strong style={{ color: C.text }}>más seguido</strong>. Lo que ya dominás va a aparecer <strong style={{ color: C.text }}>cada vez menos</strong>. Esta práctica se llama <strong style={{ color: C.text }}>repetición espaciada</strong> o <em>spaced repetition</em>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={11000}>
          <SpacedTimeline start={timelineStarted} />
        </FadeIn>
        <FadeIn show={titleDone} delay={15000}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 5: Ítems
    5: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "1rem", minHeight: "1.9em" }}>
          <Typewriter text="Ítems" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1rem" }}>
            El ejercicio que acabás de resolver es parte de un <strong style={{ color: C.text }}>ítem</strong>,
            que evalúa una habilidad específica sobre un tema. En este caso, <em>clasificación</em> de funciones <em>lineales</em>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={5000}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1rem" }}>
            Si todavía no resolviste ejercicios sobre un ítem, va a aparecer como <strong style={{ color: C.text }}>nuevo</strong>.
            Si tenés un repaso para hacer hoy, va a aparecer como <strong style={{ color: C.text }}>pendiente</strong>.
            A medida que resolvés bien los ejercicios de cada ítem y demostrás dominio, van a pasar de <strong style={{ color: C.text }}>aprendiendo</strong> a <strong style={{ color: C.text }}>graduado</strong>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={12000}>
          <ItemStates start={itemStatesStarted} />
        </FadeIn>
        <FadeIn show={titleDone} delay={16500}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 6: Progreso
    6: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "1rem", minHeight: "1.9em" }}>
          <Typewriter text="Progreso" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Cuando suficientes ítems se <strong style={{ color: C.text }}>gradúan</strong>, avanzás de <strong style={{ color: C.text }}>cinturón</strong>.
            Hay <strong style={{ color: C.text }}>5 cinturones</strong>, desde blanco hasta negro,
            cada uno con <strong style={{ color: C.text }}>grados intermedios</strong>, representando un nivel mayor de <strong style={{ color: C.text }}>dominio</strong> sobre los contenidos de cada curso.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={3000}>
          <BeltSequence start={beltSeqStarted} />
        </FadeIn>
        <FadeIn show={titleDone} delay={7000}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 7: Cinturón Blanco
    7: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "1rem", minHeight: "1.9em" }}>
          <Typewriter text="Cinturón Blanco" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.75rem" }}>
            En esta primera etapa vas a trabajar tu capacidad para <strong style={{ color: C.text }}>reconocer, describir y manipular</strong> las distintas familias de funciones que se suelen ver en las cátedras de Análisis Matemático I.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={0}>
          <img src="/belt_white.png" alt="Cinturón Blanco"
            style={{
              width: 180, height: "auto", display: "block", margin: "0 auto 1.75rem",
              animation: titleDone ? "beltGift 1.1s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
              opacity: 0,
            }} />
        </FadeIn>
        <FadeIn show={titleDone} delay={5500}>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Los cinturones siguientes trabajan <strong style={{ color: C.text }}>límites, continuidad, diferenciabilidad, derivadas e integrales</strong>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={7500}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 8: Career
    8: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "0.75rem", minHeight: "1.9em" }}>
          <Typewriter text="¿Qué tipo de carrera estudiás?" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Nos gustaría personalizar tu experiencia más adelante.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={220}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {CARRERAS.map(c => (
              <button key={c.value}
                onClick={() => { playPop(); setCareer(c.value); setDir(1); setSlide(s => Math.min(s + 1, TOTAL_SLIDES - 1)); }}
                style={{
                  width: "100%", padding: "0.9rem", borderRadius: 12,
                  border: `1.5px solid ${C.border}`,
                  background: C.bgElevated,
                  color: C.text,
                  fontWeight: 600, fontSize: "1rem", cursor: "pointer",
                  fontFamily: fonts.body, transition: "all 0.22s",
                }}>
                <span style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem" }}>
                  <span>{c.label}</span>
                  {c.emoji && <span>{c.emoji}</span>}
                </span>
              </button>
            ))}
          </div>
        </FadeIn>
      </div>
    ),

    // Slide 9: University
    9: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "0.5rem", minHeight: "1.9em" }}>
          <Typewriter text="¿En qué universidad?" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "0.95rem", marginBottom: "1.25rem" }}>
            Nos interesa saber de dónde venís.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={0}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {/* 3 universities in a row */}
            <div style={{ display: "flex", gap: "0.65rem" }}>
              {[
                { value: "UBA",   font: "'Montserrat', sans-serif",   size: "1.35rem", weight: 350, spacing: "0.12em" },
                { value: "UTN",   font: "'Archivo Black', sans-serif", size: "1.25rem", weight: 400 },
                { value: "UNSAM", font: "'Saira', sans-serif",         size: "1rem",   weight: 600, spacing: "0.1em" },
              ].map(({ value, font, size, weight, spacing }) => (
                <button key={value} onClick={() => {
                  playPop(); setUni(value); setDir(1); setSlide(11); window.scrollTo({ top: 0 });
                }} style={{
                  flex: 1, padding: "1rem 0.5rem",
                  borderRadius: 14,
                  background: C.bgElevated,
                  border: `1.5px solid ${C.border}`,
                  color: C.text,
                  fontFamily: font, fontSize: size, fontWeight: weight,
                  letterSpacing: spacing,
                  cursor: "pointer", transition: "all 0.2s ease",
                }}>
                  {value}
                </button>
              ))}
            </div>
            {/* Otra full-width */}
            <button onClick={() => {
              playPop(); setUni("Otra"); setDir(1); setSlide(10); window.scrollTo({ top: 0 });
            }} style={{
              width: "100%", padding: "0.85rem",
              borderRadius: 14,
              background: C.bgElevated,
              border: `1.5px solid ${C.border}`,
              color: C.text,
              fontFamily: fonts.body, fontSize: "1rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s ease",
            }}>
              Otra
            </button>
          </div>
        </FadeIn>
      </div>
    ),

    // Slide 10: Custom university (only reached when "Otra" selected)
    10: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "0.5rem", minHeight: "1.9em" }}>
          <Typewriter text="¿Cuál?" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "0.95rem", marginBottom: "1.25rem" }}>
            Por favor, especificanos el nombre de tu universidad.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={200}>
          <input
            type="text"
            value={uniCustom}
            onChange={e => setUniCustom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && goNext()}
            placeholder="Ej: UNLP, UNQ, UNLa…"
            style={{ ...inputStyle, marginBottom: "1.25rem" }}
            autoFocus
          />
        </FadeIn>
        <FadeIn show={titleDone} delay={350}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 11: Ready
    11: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.6rem", fontWeight: 800,
          color: C.text, marginBottom: "0.75rem", minHeight: "2em" }}>
          <Typewriter text="¡Listo!" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
            Tu primer repaso tiene 12 ejercicios y te va a tomar menos de 3 minutos. ¿Arrancamos?
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={220}>
          {error && (
            <p style={{ color: C.error, background: C.errorBg, borderRadius: 8,
              padding: "0.6rem 0.9rem", fontSize: "0.875rem", margin: "1rem 0" }}>
              {error}
            </p>
          )}
          {continueBtn(loading ? "Iniciando…" : "¡Vamos!", handleStart)}
        </FadeIn>
      </div>
    ),
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: fonts.body }}>
      <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem 1rem 3rem" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          {dots}
          <SlideTransition slideKey={slide} direction={dir}>
            <div style={{ ...card }}>
              {slides[slide]}
            </div>
          </SlideTransition>
          {backBtn}
        </div>
      </div>
    </div>
  );
}

// ── Tutorial micro-interactions ────────────────────────────────────────────────

function FlipCard({ front, back }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped(!flipped)}
      style={{ cursor: "pointer", perspective: 800 }}>
      <div style={{
        position: "relative", transformStyle: "preserve-3d",
        transition: "transform 0.65s ease",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
      }}>
        <div style={{
          background: C.bgElevated, borderRadius: 14, border: `1px solid ${C.border}`,
          backfaceVisibility: "hidden", minHeight: 140,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {front}
        </div>
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%",
          background: C.bgElevated, borderRadius: 14, border: `1px solid ${C.primary}`,
          backfaceVisibility: "hidden", transform: "rotateY(180deg)",
          minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {back}
        </div>
      </div>
    </div>
  );
}

function SpacedTimeline({ start }) {
  const EASY_DAYS  = [1, 3, 7, 15, 30];
  const HARD_DAYS  = [1, 2, 3, 5, 7, 9, 12, 16, 20, 25, 30];
  const TOTAL_DAYS = 30;
  const EASY_COLOR = "#36D87A";
  const HARD_COLOR = "#F97316";

  const [eVisible, setEVisible] = useState(0);
  const [hVisible, setHVisible] = useState(0);

  useEffect(() => {
    if (!start) { setEVisible(0); setHVisible(0); return; }
    const EASY_MS = 820;
    const HARD_MS = 390;
    const eTimers = EASY_DAYS.map((_, i) =>
      setTimeout(() => setEVisible(i + 1), (i + 1) * EASY_MS)
    );
    const hTimers = HARD_DAYS.map((_, i) =>
      setTimeout(() => setHVisible(i + 1), (i + 1) * HARD_MS)
    );
    return () => { [...eTimers, ...hTimers].forEach(clearTimeout); };
  }, [start]);

  const renderRow = (label, days, visible, color) => {
    return (
      <div style={{ marginBottom: "1.1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: C.muted,
            width: 44, textAlign: "right", flexShrink: 0 }}>
            {label}
          </span>
          <div style={{ position: "relative", flex: 1, height: 2,
            background: C.border, borderRadius: 1 }}>
            {days.slice(0, visible).map((day, i) => (
              <div key={i} style={{
                position: "absolute",
                left: `${(day / TOTAL_DAYS) * 100}%`,
                top: "50%",
                width: 11, height: 11, borderRadius: "50%",
                background: color,
                animation: "dotPop 0.28s ease-out forwards",
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", paddingLeft: 52, paddingRight: 0,
          marginTop: "0.3rem" }}>
          <span style={{ fontSize: "0.56rem", color: C.muted, opacity: 0.5 }}>Día 1</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: "0.56rem", color: C.muted, opacity: 0.5 }}>Día 30</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0.5rem 0 0.25rem" }}>
      {renderRow("Fácil",   EASY_DAYS, eVisible, EASY_COLOR)}
      {renderRow("Difícil", HARD_DAYS, hVisible, HARD_COLOR)}
    </div>
  );
}

function BeltSequence({ start }) {
  const belts = [
    { name: "Blanco",  img: "/belt_white.png"  },
    { name: "Azul",    img: "/belt_blue.png"   },
    { name: "Violeta", img: "/belt_purple.png" },
    { name: "Marrón",  img: "/belt_brown.png"  },
    { name: "Negro",   img: "/belt_black.png"  },
  ];
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (!start) { setLit(0); return; }
    const timers = belts.map((_, i) =>
      setTimeout(() => setLit(i + 1), 680 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, [start]);

  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center",
      padding: "1rem 0", flexWrap: "wrap" }}>
      {belts.map(({ name, img }, i) => (
        <div key={name} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          opacity: i < lit ? 1 : 0.15,
          transform: i < lit ? "scale(1)" : "scale(0.88)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          <img src={img} alt={name}
            style={{ width: 64, height: "auto", display: "block" }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: C.textSecondary }}>{name}</span>
        </div>
      ))}
    </div>
  );
}

// ── ItemStates ─────────────────────────────────────────────────────────────────

function ItemStates({ start }) {
  const STATES = [
    { label: "Nuevo",       bg: "rgba(29,78,216,0.25)",  border: "#3B82F6",  text: "#BFDBFE"      },
    { label: "Pendiente",   bg: "rgba(180,83,9,0.25)",   border: "#B45309",  text: "#FDE68A"      },
    { label: "Aprendiendo", bg: "rgba(101,163,13,0.25)", border: "#84CC16",  text: "#D9F99D"      },
    { label: "Graduado",    bg: "rgba(21,128,61,0.25)",  border: "#22C55E",  text: "#BBF7D0"      },
  ];
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!start) { setActive(-1); return; }
    setActive(0);
  }, [start]);

  useEffect(() => {
    if (active < 0 || active >= STATES.length - 1) return;
    const t = setTimeout(() => setActive(a => a + 1), 950);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      gap: "0.3rem", padding: "0.75rem 0" }}>
      {STATES.map((s, i) => (
        <React.Fragment key={s.label}>
          <div style={{
            padding: "0.5rem 2rem", borderRadius: 10, width: "100%", textAlign: "center",
            background: i <= active ? s.bg : C.bgElevated,
            color: i <= active ? s.text : C.muted,
            border: `1.5px solid ${i <= active ? s.border : C.border}`,
            fontWeight: 600, fontSize: "0.9rem",
            transition: "all 0.55s ease",
            opacity: i <= active ? 1 : 0.35,
          }}>
            {s.label}
          </div>
          {i < STATES.length - 1 && (
            <span style={{
              color: C.muted, fontSize: "0.8rem",
              opacity: i < active ? 0.8 : 0.2,
              transition: "opacity 0.55s ease",
            }}>↓</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── ExerciseCard (shared between tutorial and session) ─────────────────────────

function ExerciseCard({ exercise: ex, wrongAttempts = new Set(), correctFound = false, shakeIdx = null, result = null, onAnswer }) {
  return (
    <div style={{ ...card, padding: "1.25rem" }}>
      <span style={{ background: C.pill, color: C.pillText, borderRadius: 999,
        padding: "0.22rem 0.7rem", fontSize: "0.75rem", fontWeight: 600 }}>
        {SKILL_LABELS[ex.skill] ?? ex.skill}
      </span>

      <p style={{ fontSize: "1.05rem", fontWeight: 600, color: C.text,
        lineHeight: 1.6, margin: "0.9rem 0 1.25rem", fontFamily: fonts.body }}>
        <MathText text={ex.question} />
      </p>

      {ex.graph_fn && ex.graph_view && (
        <div style={{ marginBottom: "1.25rem" }}>
          <FunctionPlot fnStr={ex.graph_fn} view={ex.graph_view} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {ex.options.map((opt, i) => {
          const isWrong   = wrongAttempts.has(i);
          const isCorrect = correctFound && i === ex.correct_index;
          const isShaking = shakeIdx === i;
          const isDimmed  = correctFound && i !== ex.correct_index && !isWrong;
          let bg     = C.bgElevated;
          let border = `1.5px solid ${C.border}`;
          let color  = C.text;
          let opacity = isDimmed ? 0.4 : 1;
          if (isCorrect) { bg = C.successBg; border = `1.5px solid ${C.success}`; color = C.success; }
          else if (isWrong) { bg = "rgba(245,158,11,0.15)"; border = `1.5px solid #F59E0B`; color = "#F59E0B"; }
          return (
            <button key={i}
              onClick={() => onAnswer(i)}
              disabled={correctFound || wrongAttempts.has(i)}
              style={{
                width: "100%", padding: "0.8rem 1rem", background: bg,
                border, borderRadius: 10, fontSize: "0.93rem", fontWeight: 500,
                color, cursor: (correctFound || wrongAttempts.has(i)) ? "default" : "pointer",
                textAlign: "left", opacity,
                transition: isShaking ? "none" : "all 0.22s",
                animation: isShaking ? "shake 0.5s ease" : "none",
                fontFamily: fonts.body,
              }}>
              <MathText text={opt} />
            </button>
          );
        })}
      </div>

      {result && (
        <div style={{ marginTop: "1rem" }}>
          <p style={{ padding: "0.7rem 1rem", borderRadius: 10,
            fontWeight: 600, fontSize: "0.88rem", lineHeight: 1.5,
            background: result.correct ? C.successBg : "rgba(245,158,11,0.15)",
            color: result.correct ? C.success : "#F59E0B" }}>
            <MathText text={result.feedback} />
          </p>
        </div>
      )}
    </div>
  );
}

// ── SessionScreen ──────────────────────────────────────────────────────────────

const WARNING = "#F59E0B";
const WARNING_BG = "rgba(245,158,11,0.15)";

function SessionScreen({ sessionId, userName, exercises, onComplete, initialIdx = 0 }) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [wrongAttempts, setWrongAttempts] = useState(new Set());
  const [correctFound, setCorrectFound]   = useState(false);
  const [shakeIdx, setShakeIdx]           = useState(null);
  const [result, setResult]               = useState(null);
  const [elapsed, setElapsed]             = useState(0);
  const [slideDir, setSlideDir]           = useState(1);
  const [endPhase, setEndPhase]           = useState(null); // null | "pressed" | "exiting"
  const startRef  = useRef(Date.now());
  const timerRef  = useRef(null);
  const calledRef = useRef(false); // backend called for this exercise?

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0); setWrongAttempts(new Set()); setCorrectFound(false);
    setShakeIdx(null); setResult(null); calledRef.current = false;
    timerRef.current = setInterval(() =>
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 100);
    return () => clearInterval(timerRef.current);
  }, [currentIdx]);

  async function handleAnswer(idx) {
    const ex = exercises[currentIdx];
    if (correctFound || wrongAttempts.has(idx)) return;
    const t = (Date.now() - startRef.current) / 1000;
    const isCorrect = idx === ex.correct_index;

    if (isCorrect) {
      playCorrect();
      clearInterval(timerRef.current);
      setCorrectFound(true);
      if (!calledRef.current) {
        calledRef.current = true;
        try {
          const res = await fetch(`${API}/session/answer`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, exercise_id: ex.id,
              answer_index: idx, response_time_s: t }),
          });
          setResult(await res.json());
        } catch { setResult({ correct: true, feedback: ex.feedback_correct || "¡Correcto!" }); }
      } else {
        setResult({ correct: true, feedback: ex.feedback_correct });
      }
    } else {
      playWrong();
      const newWrong = new Set(wrongAttempts); newWrong.add(idx);
      setWrongAttempts(newWrong);
      setShakeIdx(idx);
      setTimeout(() => setShakeIdx(null), 500);
      setResult({ correct: false, feedback: "¿Seguro? Revisá tu respuesta e intentalo una vez más." });
      if (!calledRef.current) {
        calledRef.current = true;
        try {
          await fetch(`${API}/session/answer`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, exercise_id: ex.id,
              answer_index: idx, response_time_s: t }),
          });
        } catch {}
      }
    }
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  }

  async function handleNext() {
    if (currentIdx === exercises.length - 1) {
      playTerminar();
      setTimeout(() => playConteo(), 2200);
      setEndPhase("pressed");
      const fetchPromise = fetch(`${API}/session/${sessionId}/summary`)
        .then(r => r.json()).catch(() => null);
      setTimeout(async () => {
        setEndPhase("exiting");
        const data = await fetchPromise;
        setTimeout(() => onComplete(data), 640);
      }, 600);
    } else {
      playPop();
      setSlideDir(1);
      setCurrentIdx(i => i + 1);
    }
  }

  const ex    = exercises[currentIdx];
  const total = exercises.length;
  const pct   = (currentIdx / total) * 100;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: fonts.body }}>
      <Nav rightContent={
        <span style={{ color: C.textSecondary, fontSize: "0.85rem" }}>{userName}</span>
      } />

      <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 1rem 2rem" }}>
        <div style={{ width: "100%", maxWidth: 560,
          animation: endPhase === "exiting" ? "slideOutLeft 0.3s ease-out forwards" : undefined }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontWeight: 700, color: C.text, fontSize: "0.9rem" }}>
              {currentIdx + 1} / {total}
            </span>
            <span style={{ background: C.pill, color: C.pillText,
              borderRadius: 999, padding: "0.25rem 0.75rem",
              fontSize: "0.82rem", fontWeight: 600 }}>
              {elapsed}s
            </span>
          </div>

          <div style={{ width: "100%", height: 5, background: C.border,
            borderRadius: 999, marginBottom: "1.25rem", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: C.primary,
              borderRadius: 999, transition: "width 0.55s ease" }} />
          </div>

          <SlideTransition slideKey={currentIdx} direction={slideDir}>
            <div style={{ ...card, marginBottom: "1rem" }}>
              <span style={{ background: C.pill, color: C.pillText, borderRadius: 999,
                padding: "0.22rem 0.7rem", fontSize: "0.75rem", fontWeight: 600 }}>
                {SKILL_LABELS[ex.skill] ?? ex.skill}
              </span>

              <p style={{ fontSize: "1.1rem", fontWeight: 600, color: C.text,
                lineHeight: 1.6, margin: "0.9rem 0",
                marginBottom: ex.graph_fn ? "0.75rem" : "1.5rem" }}>
                <MathText text={ex.question} />
              </p>

              {ex.graph_fn && ex.graph_view && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <FunctionPlot fnStr={ex.graph_fn} view={ex.graph_view} />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {ex.options.map((opt, i) => {
                  const isWrong   = wrongAttempts.has(i);
                  const isCorrect = i === ex.correct_index && correctFound;
                  const isShaking = i === shakeIdx;
                  const isDone    = correctFound || isWrong;
                  let bg = C.bgElevated, border = `1.5px solid ${C.border}`,
                    color = C.text, opacity = 1;
                  if (isCorrect)    { bg = C.successBg; border = `1.5px solid ${C.success}`; color = C.success; }
                  else if (isWrong) { bg = WARNING_BG;  border = `1.5px solid ${WARNING}`;   color = WARNING; opacity = 0.6; }
                  else if (correctFound) { opacity = 0.35; }
                  return (
                    <button key={i} onClick={() => handleAnswer(i)}
                      disabled={isDone || correctFound}
                      style={{ width: "100%", padding: "0.8rem 1rem", background: bg,
                        border, borderRadius: 10, fontSize: "0.93rem", fontWeight: 500,
                        color, cursor: (isDone || correctFound) ? "default" : "pointer",
                        textAlign: "left", opacity, fontFamily: fonts.body,
                        transition: isShaking ? "none" : "all 0.22s",
                        animation: isShaking ? "shake 0.5s ease" : "none",
                      }}>
                      <MathText text={opt} />
                    </button>
                  );
                })}
              </div>

              {result && (
                <div style={{ marginTop: "1.1rem" }}>
                  <p style={{ padding: "0.7rem 1rem", borderRadius: 10,
                    fontWeight: 600, fontSize: "0.88rem", lineHeight: 1.5,
                    marginBottom: correctFound ? "0.75rem" : 0,
                    background: result.correct ? C.successBg : WARNING_BG,
                    color: result.correct ? C.success : WARNING }}>
                    <MathText text={result.feedback} />
                  </p>

                  {correctFound && (
                    <button onClick={handleNext} disabled={endPhase !== null}
                      style={{ width: "100%", padding: "0.85rem",
                        background: endPhase !== null ? "#4B4DE0" : C.primary,
                        color: "#fff", border: "none", borderRadius: 10,
                        fontSize: "1rem", fontWeight: 700,
                        cursor: endPhase !== null ? "default" : "pointer",
                        fontFamily: fonts.body, marginTop: "0.75rem",
                        transition: "background 0.3s ease",
                      }}>
                      {currentIdx === exercises.length - 1 ? "Terminar" : "Siguiente"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </SlideTransition>

          <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", flexWrap: "wrap" }}>
            {exercises.map((_, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: "50%",
                background: i <= currentIdx ? C.primary : C.border,
                opacity: i <= currentIdx ? 1 : 0.45, transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SummaryScreen ──────────────────────────────────────────────────────────────

function XPCounter({ targetXP, levelInfo, onDone }) {
  const [displayXP, setDisplayXP] = useState(0);
  const [barPct, setBarPct] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(levelInfo ? levelInfo.level : 1);

  useEffect(() => {
    if (targetXP === 0) { onDone?.(); return; }
    const STEPS    = 10;
    const STEP_MS  = 70;  // 10 × 70ms = 700ms total
    let current = 0;

    const finalPct = levelInfo ? Math.min(levelInfo.progress_pct, 100) : 0;
    const startLevel = levelInfo ? Math.max(1, levelInfo.level - (levelInfo.xp_in_level < targetXP ? 1 : 0)) : 1;
    const didLevelUp = levelInfo && startLevel < levelInfo.level;

    if (didLevelUp) setDisplayLevel(startLevel);

    const timer = setInterval(() => {
      current++;
      const progress = current / STEPS;
      const eased = Math.pow(progress, 1.5);
      setDisplayXP(Math.round(eased * targetXP));

      if (didLevelUp) {
        if (progress < 0.5) {
          setBarPct(Math.min(100, eased * 200));
        } else if (progress < 0.6) {
          setBarPct(100);
          setDisplayLevel(levelInfo.level);
        } else {
          setBarPct(finalPct * ((progress - 0.6) / 0.4));
        }
      } else {
        setBarPct(eased * finalPct);
      }

      if (current >= STEPS) {
        clearInterval(timer);
        setDisplayXP(targetXP);
        setBarPct(finalPct);
        onDone?.();
      }
    }, STEP_MS);

    return () => clearInterval(timer);
  }, [targetXP]);

  return (
    <div style={{ ...card, marginBottom: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", fontWeight: 800, color: C.text, lineHeight: 1,
        fontFamily: fonts.heading, marginBottom: "1.25rem" }}>
        +{displayXP} XP
      </div>

      {levelInfo && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "baseline", marginBottom: "0.4rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: C.text }}>
              Nivel {displayLevel}
            </div>
            <div style={{ fontSize: "0.68rem", color: C.muted }}>
              {levelInfo.xp_in_level} / {levelInfo.xp_required} XP
            </div>
          </div>
          <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)",
            borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              width: `${barPct}%`, height: "100%",
              background: "rgba(255,255,255,0.55)",
              borderRadius: 999, transition: "width 0.05s linear",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryScreen({ summary, onRestart, onRegister }) {
  const { xp_earned = 0, level_info } = summary;
  const skillStates = summary.skill_states || {};

  // ── shared derived data ─────────────────────────────────────────────────────
  const touchedList = [];
  for (const { key: topicKey } of WHITE_BELT_TOPICS)
    for (const skill of WHITE_BELT_SKILLS) {
      const k = `${topicKey}:${skill}`;
      if (skillStates[k]) touchedList.push(k);
    }

  const graduatedCount = Object.values(skillStates).filter(s => s?.phase === "review").length;
  const stripes  = STRIPE_THRESHOLDS.filter(t => graduatedCount >= t).length;
  const promoted = graduatedCount >= PROMOTION_THRESHOLD;

  // ── page state ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // page 1
  const [titleStart, setTitleStart] = useState(false);
  const [titleDone, setTitleDone]   = useState(false);
  const [xpDone, setXpDone]         = useState(false);

  // page 2
  const [title2Start, setTitle2Start] = useState(false);
  const [title2Done, setTitle2Done]   = useState(false);

  // page 2
  const [revealedCount, setRevealedCount] = useState(0);
  const [showRegister, setShowRegister]   = useState(false);
  const [registering, setRegistering]     = useState(false);
  const [registered, setRegistered]       = useState(false);

  // Delay title on page 1 by 500ms after mount (container has just disappeared)
  useEffect(() => {
    const t = setTimeout(() => setTitleStart(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (page !== 2) return;
    window.scrollTo({ top: 0 });
    const t = setTimeout(() => setTitle2Start(true), 200);
    return () => clearTimeout(t);
  }, [page]);

  useEffect(() => {
    if (page !== 2 || !title2Done) return;
    if (revealedCount >= touchedList.length) {
      setTimeout(() => {
        setShowRegister(true);
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 350);
      }, 400);
      return;
    }
    const t = setTimeout(() => setRevealedCount(c => c + 1), 70);
    return () => clearTimeout(t);
  }, [page, title2Done, revealedCount]);

  const revealedKeys = page === 2 ? new Set(touchedList.slice(0, revealedCount)) : new Set();

  function handleRegister() {
    setRegistering(true);
    setTimeout(() => { setRegistering(false); setRegistered(true); onRegister?.(); }, 1500);
  }

  // ── PAGE 1: ¡Listo! + XP ───────────────────────────────────────────────────
  if (page === 1) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: fonts.body }}>
      <Nav />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
        padding: "2rem 1rem", minHeight: "calc(100vh - 52px)" }}>
        <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>

          <h1 style={{ fontFamily: fonts.heading, fontSize: "2.4rem", fontWeight: 800,
            color: C.text, marginBottom: "2rem", minHeight: "2.8rem" }}>
            <Typewriter text="¡Listo!" speed={90} start={titleStart} onDone={() => setTitleDone(true)} />
          </h1>

          {/* Mount only after title — so playConteo() fires at the right moment */}
          {titleDone && (
            <div style={{ animation: "slideInRight 0.4s ease-out" }}>
              <XPCounter targetXP={xp_earned} levelInfo={level_info} onDone={() => setXpDone(true)} />
            </div>
          )}

          <FadeIn show={xpDone} delay={350}>
            <button onClick={() => { playPop(); setPage(2); }}
              style={{ width: "100%", padding: "0.9rem", background: C.primary,
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                fontFamily: fonts.body, marginTop: "0.5rem" }}>
              Continuar
            </button>
          </FadeIn>

        </div>
      </div>
    </div>
  );

  // ── PAGE 2: items grid + register ───────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: fonts.body }}>
      <Nav />
      <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 1rem 3rem" }}>
        <div style={{ width: "100%", maxWidth: 540, animation: "slideInRight 0.6s ease-out" }}>

          <h2 style={{ fontFamily: fonts.heading, fontSize: "1.7rem", fontWeight: 800,
            color: C.text, textAlign: "center", margin: "0 0 1.25rem", minHeight: "2rem" }}>
            <Typewriter text="Tus ítems" speed={55} start={title2Start} onDone={() => setTitle2Done(true)} />
          </h2>

          {/* Belt + progress grid card — appears after title */}
          {title2Done && <div style={{ animation: "slideInRight 0.5s ease-out" }}>
          <div style={{ ...card, marginBottom: "1rem" }}>
            {/* Header row: left info + belt centered above LEXI */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.85rem" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  Cinturón Blanco
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0, 1].map(i => (
                    <div key={i} style={{ width: 22, height: 10, borderRadius: 999,
                      background: i < stripes ? "#D97706" : C.border,
                      transition: "background 0.55s ease" }} />
                  ))}
                </div>
                <div style={{ fontSize: "0.68rem", color: C.muted, marginTop: "0.3rem" }}>
                  {graduatedCount} / {promoted ? MASTERY_TOTAL : (stripes < 2 ? STRIPE_THRESHOLDS[stripes] : PROMOTION_THRESHOLD)} ítems para el próximo grado
                </div>
              </div>
              <img src="/belt_white.png" alt="Cinturón Blanco"
                style={{ width: 115, height: "auto", opacity: 0.85,
                  flexShrink: 0 }} />
            </div>
            <ProgressGrid skillStates={skillStates} revealedKeys={revealedKeys} />
          </div>
          </div>}

          {/* Register with Google — appears after stagger completes */}
          {onRegister && !registered && showRegister && (
            <div style={{ ...card, textAlign: "center", animation: "slideInRight 0.5s ease-out" }}>
              <h3 style={{ fontFamily: fonts.heading, fontSize: "1.1rem", fontWeight: 700,
                color: C.text, margin: "0 0 0.4rem" }}>
                Guardá tu progreso
              </h3>
              <p style={{ color: C.muted, fontSize: "0.88rem", margin: "0 0 1.25rem" }}>
                Registrate para no perder tu avance
              </p>
              <button onClick={handleRegister} disabled={registering}
                style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: 12,
                  background: "#fff", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                  fontSize: "0.95rem", fontWeight: 600, color: "#333",
                  fontFamily: fonts.body, transition: "all 0.22s", opacity: registering ? 0.7 : 1 }}>
                {registering ? <span>Registrando...</span> : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Registrarse con Google
                  </>
                )}
              </button>
              <button onClick={handleRegister} disabled={registering}
                style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: 12, marginTop: "0.6rem",
                  background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "0.75rem", fontSize: "0.9rem", fontWeight: 500, color: C.textSecondary,
                  fontFamily: fonts.body, transition: "all 0.22s", opacity: registering ? 0.5 : 1 }}>
                {registering ? <span>Registrando...</span> : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M2 8l10 6 10-6"/>
                    </svg>
                    Registrarse con Email
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── RegisteredScreen ───────────────────────────────────────────────────────────

const CONFETTI_COLORS = [...BELT_COLORS, "#7E80F7", "#36D87A", "#F76565"];

function Confetti() {
  const particles = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: 45 + Math.random() * 10,
      vx: (Math.random() - 0.5) * 140,
      vy: -(120 + Math.random() * 100),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + Math.random() * 6,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 600,
    }))
  ).current;

  const [tick, setTick] = useState(0);
  const stateRef = useRef(particles.map(p => ({ ...p, y: 50, alive: true })));
  const rafRef = useRef(null);
  const lastRef = useRef(null);

  useEffect(() => {
    const animate = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      let anyAlive = false;
      stateRef.current = stateRef.current.map(p => {
        if (!p.alive) return p;
        const ny = p.y + p.vy * dt;
        const nx = p.x + p.vx * dt;
        const nvy = p.vy + 320 * dt;
        const nrot = p.rot + p.vrot * dt;
        const alive = ny < 110;
        if (alive) anyAlive = true;
        return { ...p, x: nx, y: ny, vy: nvy, rot: nrot, alive };
      });
      setTick(t => t + 1);
      if (anyAlive) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {stateRef.current.filter(p => p.alive).map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: p.color,
          borderRadius: 2,
          transform: `rotate(${p.rot}deg)`,
          opacity: 0.9,
        }} />
      ))}
    </div>
  );
}

function RegisteredScreen({ userName, onContinue }) {
  const [titleDone, setTitleDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative" }}>
        <Confetti />
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, padding: "2rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: "1.6rem", color: C.text, margin: 0, lineHeight: 1.25, minHeight: "2em", textAlign: "center" }}>
            <Typewriter text={`¡Listo, ${userName}!`} speed={40} onDone={() => setTitleDone(true)} />
          </h2>
          <FadeIn show={titleDone} delay={0}>
            <p style={{ fontFamily: fonts.body, fontSize: "0.97rem", color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>
              Tu repaso quedó registrado. Si ves <strong style={{ color: C.text }}>ítems pendientes</strong>, intentá repasarlos hoy. Si no quedó ninguno, ya podés descansar, mañana va a haber <strong style={{ color: C.text }}>nuevos ejercicios</strong> esperándote.
            </p>
          </FadeIn>
          <FadeIn show={titleDone} delay={300}>
            <p style={{ fontFamily: fonts.body, fontSize: "0.97rem", color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>
              A medida que vayas <strong style={{ color: C.text }}>graduando ítems</strong>, se van desbloqueando otros nuevos. La idea es que avances progresivamente para que los repasos <strong style={{ color: C.text }}>no se extiendan demasiado</strong>.
            </p>
          </FadeIn>
        </div>

        <FadeIn show={titleDone} delay={600}>
          <button
            onClick={() => { if (!ready) return; playPop(); onContinue(); }}
            disabled={!ready}
            style={{
              width: "100%", padding: "0.9rem", borderRadius: 12, border: "none",
              background: ready ? C.primary : C.bgElevated,
              color: ready ? "#fff" : C.muted,
              fontFamily: fonts.body, fontWeight: 700, fontSize: "1rem",
              cursor: ready ? "pointer" : "default",
              transition: "all 0.3s",
            }}>
            ¡Entendí!
          </button>
        </FadeIn>
      </div>
    </div>
  );
}

// ── BeltCarousel ───────────────────────────────────────────────────────────────

function BeltCarousel({ skillStates, revealedKeys }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef(null);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40 && active < BELT_DATA.length - 1) setActive(a => a + 1);
    if (dx > 40 && active > 0) setActive(a => a - 1);
    touchStartX.current = null;
  }

  return (
    <div>
      {/* Belt tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", justifyContent: "center" }}>
        {BELT_DATA.map((belt, i) => (
          <button key={belt.name} onClick={() => setActive(i)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "0.25rem 0.6rem",
            borderBottom: i === active ? `2px solid ${BELT_COLORS[belt.colorIdx]}` : "2px solid transparent",
            color: i === active ? C.text : C.muted,
            fontSize: "0.75rem", fontWeight: i === active ? 700 : 500,
            transition: "all 0.2s", fontFamily: fonts.body,
          }}>
            {belt.name}
          </button>
        ))}
      </div>

      {/* Carousel track */}
      <div style={{ overflow: "hidden" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}>
        <div style={{
          display: "flex",
          transform: `translateX(-${active * 100}%)`,
          transition: "transform 0.35s ease",
        }}>
          {BELT_DATA.map((belt, i) => {
            const states = i === 0 ? skillStates : {};
            const revealed = i === 0 ? revealedKeys : null;
            const graduated = i === 0
              ? Object.values(skillStates).filter(s => s?.phase === "review").length
              : 0;
            const stripes = belt.stripeAt.filter(t => graduated >= t).length;
            const isLocked = i > 0;
            const nextTarget = stripes < belt.stripeAt.length
              ? belt.stripeAt[stripes]
              : belt.promoteAt;

            return (
              <div key={belt.name} style={{ minWidth: "100%", flexShrink: 0 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted,
                      textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                      Cinturón {belt.name}
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0, 1].map(idx => (
                        <div key={idx} style={{ width: 22, height: 10, borderRadius: 999,
                          background: idx < stripes ? "#D97706" : C.border,
                          transition: "background 0.55s ease" }} />
                      ))}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: C.muted, marginTop: "0.3rem" }}>
                      {isLocked
                        ? "Bloqueado"
                        : `${graduated} / ${nextTarget} ítems para el próximo grado`}
                    </div>
                  </div>
                  <img src={belt.img} alt={`Cinturón ${belt.name}`}
                    style={{ width: 115, height: "auto", opacity: isLocked ? 0.3 : 0.85, flexShrink: 0 }} />
                </div>
                {/* Grid */}
                <BeltGrid
                  topics={belt.topics}
                  skills={belt.skills}
                  skillStates={states}
                  revealedKeys={revealed}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── HomeScreen (post-registration) ─────────────────────────────────────────────

function CountUp({ target, duration = 600, color }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const steps = Math.min(target, 10);
    const stepMs = duration / steps;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVal(Math.round((i / steps) * target));
      if (i >= steps) clearInterval(t);
    }, stepMs);
    return () => clearInterval(t);
  }, [target]);
  return <span style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{val}</span>;
}

function HomeScreen({ userName, lastSummary, onStartSession }) {
  const skillStates = lastSummary?.skill_states || {};
  const levelInfo = lastSummary?.level_info;

  const allEntries = Object.values(skillStates);
  const pendienteCount = allEntries.filter(s => s?.phase === "learning" && (s.step_index ?? 0) === 0).length;
  const nuevoCount = 0;
  const aprendiendoCount = allEntries.filter(s => s?.phase === "learning" && (s.step_index ?? 0) > 0).length;
  const graduatedCount = allEntries.filter(s => s?.phase === "review").length;
  const stripes = STRIPE_THRESHOLDS.filter(t => graduatedCount >= t).length;

  const STATUS_CHIPS = [
    { label: "Nuevos",      count: nuevoCount,       color: "#BFDBFE", bg: "rgba(29,78,216,0.30)",  border: "#3B82F6" },
    { label: "Pendientes",  count: pendienteCount,   color: "#FDE68A", bg: "rgba(180,83,9,0.32)",   border: "#B45309" },
    { label: "Aprendiendo", count: aprendiendoCount, color: "#D9F99D", bg: "rgba(101,163,13,0.32)", border: "#84CC16" },
    { label: "Graduados",   count: graduatedCount,   color: "#BBF7D0", bg: "rgba(21,128,61,0.35)",  border: "#22C55E" },
  ];

  // Animation sequence
  const [titleDone, setTitleDone] = useState(false);
  const [chipsReady, setChipsReady] = useState(false);
  const [showBtn, setShowBtn] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    if (titleDone) {
      const t1 = setTimeout(() => setChipsReady(true), 300);
      const t2 = setTimeout(() => setShowBtn(true), 900);
      const t3 = setTimeout(() => setShowGrid(true), 1300);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [titleDone]);

  // Grid reveal stagger (same as summary)
  const touchedList = Object.keys(skillStates);
  const [revealedCount, setRevealedCount] = useState(0);
  useEffect(() => {
    if (!showGrid) return;
    if (revealedCount >= touchedList.length) return;
    const t = setTimeout(() => setRevealedCount(c => c + 1), 70);
    return () => clearTimeout(t);
  }, [showGrid, revealedCount]);
  const revealedKeys = showGrid ? new Set(touchedList.slice(0, revealedCount)) : new Set();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: fonts.body }}>
      <Nav rightContent={
        levelInfo && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ color: C.textSecondary, fontSize: "0.82rem", fontWeight: 600 }}>
              Nivel {levelInfo.level}
            </span>
            <div style={{ width: 72, height: 4, borderRadius: 999,
              background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(levelInfo.progress_pct, 100)}%`, height: "100%",
                background: "rgba(255,255,255,0.55)", borderRadius: 999,
                transition: "width 0.6s ease" }} />
            </div>
          </div>
        )
      } />

      <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 1rem 3rem" }}>
        <div style={{ width: "100%", maxWidth: 540 }}>

          {/* Welcome card with animated chips */}
          <div style={{ ...card, marginBottom: "1rem", textAlign: "center" }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
              color: C.text, margin: "0 0 1rem", minHeight: "1.9em" }}>
              <Typewriter text={`Hola, ${userName}`} onDone={() => setTitleDone(true)} />
            </h2>
            <FadeIn show={titleDone} delay={150}>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                {STATUS_CHIPS.map(({ label, count, color, bg, border }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "0.5rem 0.65rem", borderRadius: 10, background: bg,
                    border: `1px solid ${border}`, flex: 1 }}>
                    {chipsReady ? <CountUp target={count} color={color} /> :
                      <span style={{ fontSize: "1.1rem", fontWeight: 700, color }}>0</span>}
                    <span style={{ fontSize: "0.6rem", fontWeight: 600, color: C.muted, marginTop: 2 }}>{label}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Start session CTA — between welcome and grid */}
          <FadeIn show={showBtn} delay={0}>
            <button onClick={() => { playStart(); onStartSession(); }}
              style={{
                width: "100%", padding: "1.1rem", marginBottom: "1rem",
                background: C.primary, color: "#fff", border: "none", borderRadius: 14,
                fontSize: "1.1rem", fontWeight: 700, cursor: "pointer",
                fontFamily: fonts.body, transition: "all 0.22s",
              }}>
              Repasar
            </button>
          </FadeIn>

          {/* Progress grid — animated slide-in */}
          {showGrid && <div style={{ animation: "slideInRight 0.5s ease-out" }}>
            {/* White belt card */}
            <div style={{ ...card, marginBottom: "1rem", paddingTop: "1rem", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                    Cinturón Blanco
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {[0, 1].map(i => (
                      <div key={i} style={{ width: 22, height: 10, borderRadius: 999,
                        background: i < stripes ? "#D97706" : C.border,
                        transition: "background 0.55s ease" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: C.muted, marginTop: "0.3rem" }}>
                    {graduatedCount} / {stripes < 2 ? STRIPE_THRESHOLDS[stripes] : PROMOTION_THRESHOLD} ítems para el próximo grado
                  </div>
                </div>
                <img src="/belt_white.png" alt="Cinturón Blanco"
                  style={{ width: 115, height: "auto", opacity: 0.85, flexShrink: 0 }} />
              </div>
              <ProgressGrid skillStates={skillStates} revealedKeys={revealedKeys} />
            </div>

            {/* Locked belts */}
            {[
              { name: "Azul",    img: "/belt_blue.png"   },
              { name: "Violeta", img: "/belt_purple.png" },
              { name: "Marrón",  img: "/belt_brown.png"  },
              { name: "Negro",   img: "/belt_black.png"  },
            ].map(b => (
              <div key={b.name} style={{ ...card, marginBottom: "1rem",
                paddingTop: "0.65rem", paddingBottom: "0.65rem", opacity: 0.75 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted,
                      textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
                      Cinturón {b.name}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: C.muted }}>Bloqueado</div>
                  </div>
                  <img src={b.img} alt={`Cinturón ${b.name}`}
                    style={{ width: 115, height: "auto", opacity: 0.4, flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>}

        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

function App() {
  const [screen, setScreen]         = useState("tutorial");
  const [session, setSession]       = useState(null);
  const [summary, setSummary]       = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userName, setUserName]     = useState("");
  const [userInfo, setUserInfo]     = useState(null);
  const [debugLastEx, setDebugLastEx] = useState(false);

  // PWA install prompt — captured before it auto-shows, triggered after login
  const deferredInstallPrompt = useRef(null);
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); deferredInstallPrompt.current = e; };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function startSession(name) {
    const res = await fetch(`${API}/session/start`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: name || userName }),
    });
    if (!res.ok) throw new Error("Error al iniciar sesión");
    const data = await res.json();
    setSession(data);
    setScreen("session");
  }

  async function handleTutorialStart({ name, university, career }) {
    setUserName(name);
    setUserInfo({ university, career });
    // Trigger PWA install prompt (placeholder for post-login; will move to Google OAuth later)
    if (deferredInstallPrompt.current) {
      deferredInstallPrompt.current.prompt();
      deferredInstallPrompt.current = null;
    }
    await startSession(name);
  }

  function handleComplete(summaryData) {
    setSummary(summaryData);
    setDebugLastEx(false);
    setScreen("summary");
  }

  function handleRegister() {
    setIsRegistered(true);
    setScreen("registered");
    window.scrollTo({ top: 0 });
  }

  async function handleNewSession() {
    await startSession();
  }

  async function handleDebugLastEx() {
    setUserName("Debug");
    const res = await fetch(`${API}/session/start`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: "Debug" }),
    });
    const data = await res.json();
    setSession(data);
    setDebugLastEx(true);
    setScreen("session");
  }

  if (screen === "tutorial")
    return <TutorialScreen onStart={handleTutorialStart} onGoHome={() => {
      setIsRegistered(true);
      setScreen("home");
      window.scrollTo({ top: 0 });
    }} />;

  if (screen === "session" && session)
    return <SessionScreen sessionId={session.session_id} userName={userName}
      exercises={session.exercises} onComplete={handleComplete}
      initialIdx={debugLastEx ? session.exercises.length - 1 : 0} />;

  if (screen === "summary" && summary)
    return <SummaryScreen summary={summary}
      onRestart={isRegistered
        ? () => setScreen("home")
        : () => { setScreen("tutorial"); setSession(null); setSummary(null); }}
      onRegister={!isRegistered ? handleRegister : null}
    />;

  if (screen === "registered")
    return <RegisteredScreen userName={userName} onContinue={() => { setScreen("home"); window.scrollTo({ top: 0 }); }} />;

  if (screen === "home")
    return <HomeScreen userName={userName} lastSummary={summary}
      onStartSession={handleNewSession} />;

  return null;
}

const root = globalThis.__ROOT ??= ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
