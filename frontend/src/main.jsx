import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import katex from "katex";
import "katex/dist/katex.min.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8001";

const VOLUME = 0.5;
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
  heading: "'Roboto Serif', Georgia, serif",
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

const TOTAL_SLIDES = 10;

function TutorialScreen({ onStart }) {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [career, setCareer] = useState("");
  const [uni, setUni] = useState("");
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

  // Tutorial exercise state
  const [exWrongAttempts, setExWrongAttempts] = useState(new Set());
  const [exCorrectFound, setExCorrectFound]   = useState(false);
  const [exShakeIdx, setExShakeIdx]           = useState(null);
  const [exResult, setExResult]               = useState(null);

  function canAdvance() {
    if (slide === 8) return uni !== "";
    if (slide === 9) return true;
    if (!readyToAdvance) return false;
    if (slide === 0) return name.trim().length > 0;
    if (slide === 3) return exCorrectFound;
    return true;
  }

  function goNext() {
    if (!canAdvance()) return;
    setDir(1);
    setSlide(s => Math.min(s + 1, TOTAL_SLIDES - 1));
  }

  function goBack() {
    setDir(-1);
    setSlide(s => Math.max(s - 1, 0));
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
      ← Volver
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
            transition: logoBarShown ? "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)" : "none" }}>
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
          <input type="text" value={name} onChange={e => setName(e.target.value)}
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
        <Logo size="1.6rem" />
        <h1 style={{ fontFamily: fonts.heading, fontSize: "1.7rem", fontWeight: 800,
          color: C.text, margin: "2rem 0 0.75rem", minHeight: "2.1em" }}>
          <Typewriter text={`¡Bienvenido, ${name.trim() || "..."}!`} onDone={onTitleDone} />
        </h1>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "1.05rem", lineHeight: 1.7 }}>
            Intervalo es un sistema de <strong style={{ color: C.text }}>repaso adaptativo</strong> pensado para acompañarte durante tu cursada. Un algoritmo <strong style={{ color: C.text }}>aprende de tus respuestas</strong> y <strong style={{ color: C.text }}>prioriza</strong> lo que necesitás repasar. Este tutorial dura menos de 5 minutos.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={220}>
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
            Intervalo está en <strong style={{ color: C.text }}>fase de incubación</strong> y todavía estamos ajustando el producto. Usándolo, colaborás para que la herramienta sea cada vez más útil para los estudiantes.
          </p>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1rem" }}>
            La plataforma se organiza en <strong style={{ color: C.text }}>cursos</strong>, orientados a materias comunes de carreras de ciencias, tecnología, ingeniería y matemáticas.
          </p>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7 }}>
            El único curso disponible por ahora es el de <strong style={{ color: C.text }}>Análisis Matemático I</strong>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={220}>
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
        <FadeIn show={titleDone} delay={220} style={{ textAlign: "left" }}>
          <ExerciseCard
            exercise={TUTORIAL_EXERCISE}
            wrongAttempts={exWrongAttempts}
            correctFound={exCorrectFound}
            shakeIdx={exShakeIdx}
            result={exResult}
            onAnswer={handleExAnswer}
          />
        </FadeIn>
        <FadeIn show={titleDone} delay={450}>
          {continueBtn()}
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
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Repasar con cierta frecuencia es lo que determina si lo que entendimos en un momento va a estar disponible cuando lo necesitamos. El algoritmo ajusta <strong style={{ color: C.text }}>qué repasar</strong> y <strong style={{ color: C.text }}>cada cuándo</strong>. Lo que te resulte difícil va a aparecer <strong style={{ color: C.text }}>más seguido</strong>. Lo que ya dominás va a aparecer <strong style={{ color: C.text }}>cada vez menos</strong>. Esta práctica se llama <strong style={{ color: C.text }}>repetición espaciada</strong> o <em>spaced repetition</em>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={220}>
          <SpacedTimeline />
        </FadeIn>
        <FadeIn show={titleDone} delay={450}>
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
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1rem", textAlign: "left" }}>
            El ejercicio que acabás de resolver es un <strong style={{ color: C.text }}>ítem</strong>,
            que evalúa una habilidad específica sobre un tema. En este caso, <em>clasificación</em> de funciones <em>lineales</em>.
          </p>
          <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem", textAlign: "left" }}>
            Si todavía no resolviste ejercicios sobre un ítem, va a aparecer como <strong style={{ color: C.text }}>nuevo</strong>.
            Si tenés un repaso para hacer hoy, va a aparecer como <strong style={{ color: C.text }}>pendiente</strong>.
            A medida que resolvés bien los ejercicios de cada ítem y demostrás dominio, van a pasar de <strong style={{ color: C.text }}>aprendiendo</strong> a <strong style={{ color: C.text }}>graduado</strong>.
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={220}>
          <ItemStates />
        </FadeIn>
        <FadeIn show={titleDone} delay={450}>
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
        <FadeIn show={titleDone} delay={220}>
          <BeltSequence />
        </FadeIn>
        <FadeIn show={titleDone} delay={450}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 7: Career
    7: (
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

    // Slide 8: University
    8: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "0.75rem", minHeight: "1.9em" }}>
          <Typewriter text="¿En qué universidad?" onDone={onTitleDone} />
        </h2>
        <FadeIn show={titleDone} delay={0}>
          <p style={{ color: C.textSecondary, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Si no está en la lista, elegí "Otra".
          </p>
        </FadeIn>
        <FadeIn show={titleDone} delay={220}>
          <select value={uni} onChange={e => setUni(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer", textAlign: "center", fontSize: "1rem" }}>
            <option value="">Seleccioná una opción</option>
            {UNIVERSIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            <option value="otra">Otra</option>
          </select>
        </FadeIn>
        <FadeIn show={titleDone} delay={450}>
          {continueBtn()}
        </FadeIn>
      </div>
    ),

    // Slide 9: Ready
    9: (
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

function SpacedTimeline() {
  const LABELS = ["1d", "3d", "7d", "14d", "21d"];

  // Each frame = array of 5 node states: "dim" | "green" | "yellow"
  const EASY = [
    ["dim",   "dim",   "dim",   "dim",   "dim"],
    ["green", "dim",   "dim",   "dim",   "dim"],
    ["green", "green", "dim",   "dim",   "dim"],
    ["green", "green", "green", "dim",   "dim"],
    ["green", "green", "green", "green", "dim"],
    ["green", "green", "green", "green", "green"],
  ];

  // Fails at 3d, 7d, 14d before eventually graduating
  const HARD = [
    ["dim",    "dim",    "dim",    "dim",   "dim"],
    ["green",  "dim",    "dim",    "dim",   "dim"],   // 1d ✓
    ["green",  "yellow", "dim",    "dim",   "dim"],   // 3d ✗ (intento)
    ["yellow", "dim",    "dim",    "dim",   "dim"],   // reset → 1d
    ["green",  "dim",    "dim",    "dim",   "dim"],   // 1d ✓ de nuevo
    ["green",  "green",  "dim",    "dim",   "dim"],   // 3d ✓
    ["green",  "green",  "yellow", "dim",   "dim"],   // 7d ✗
    ["green",  "yellow", "dim",    "dim",   "dim"],   // reset → 3d
    ["green",  "green",  "dim",    "dim",   "dim"],   // 3d ✓ de nuevo
    ["green",  "green",  "green",  "dim",   "dim"],   // 7d ✓
    ["green",  "green",  "green",  "yellow","dim"],   // 14d ✗
    ["green",  "green",  "yellow", "dim",   "dim"],   // reset → 7d
    ["green",  "green",  "green",  "dim",   "dim"],   // 7d ✓ de nuevo
    ["green",  "green",  "green",  "green", "dim"],   // 14d ✓
    ["green",  "green",  "green",  "green", "green"], // 21d ✓
  ];

  const [ef, setEf] = useState(0);
  const [hf, setHf] = useState(0);

  useEffect(() => {
    const EASY_MS = 980;
    const HARD_MS = 680;
    const PAUSE   = 2200;
    let eT, hT;

    let i = 0;
    const nextEasy = () => {
      i++;
      if (i < EASY.length) { setEf(i); eT = setTimeout(nextEasy, EASY_MS); }
    };
    eT = setTimeout(nextEasy, EASY_MS);

    let j = 0;
    const nextHard = () => {
      j++;
      if (j < HARD.length) { setHf(j); hT = setTimeout(nextHard, HARD_MS); }
    };
    hT = setTimeout(nextHard, HARD_MS);

    return () => { clearTimeout(eT); clearTimeout(hT); };
  }, []);

  const EASY_COLOR = "#36D87A"; // verde teal
  const HARD_COLOR = "#F97316"; // naranja

  // Cada color tiene versión brillante (borde) y opaca (fondo)
  const nodeStyle = (s, pathColor) => {
    if (s === "dim")    return { bg: C.bgElevated,              border: `1.5px solid ${C.border}`,         text: C.muted  };
    if (s === "green")  return { bg: `${pathColor}22`,          border: `2px solid ${pathColor}`,           text: pathColor };
    /* yellow */        return { bg: `${WARNING}22`,            border: `2px solid ${WARNING}`,             text: WARNING  };
  };
  const lineBg = (a, b, pathColor) => {
    if (a === "green" && b === "green") return pathColor;
    if (a === "yellow" || b === "yellow") return WARNING;
    return C.border;
  };

  const renderRow = (rowLabel, frames, fi, pathColor) => {
    const frame = frames[fi];
    return (
      <div style={{ display: "flex", alignItems: "center", marginBottom: "0.9rem" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: C.muted,
          width: 46, textAlign: "right", paddingRight: 10, flexShrink: 0 }}>
          {rowLabel}
        </span>
        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
          {LABELS.map((lbl, i) => {
            const ns = nodeStyle(frame[i], pathColor);
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div style={{ flex: 1, height: 2, minWidth: 8,
                    background: lineBg(frame[i - 1], frame[i], pathColor),
                    transition: "background 0.4s ease" }} />
                )}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: ns.bg, border: ns.border,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: ns.text, fontSize: "0.6rem", fontWeight: 700,
                  transition: "all 0.4s ease",
                }}>
                  {lbl}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0.75rem 0 0.25rem" }}>
      {renderRow("Fácil",   EASY, ef, EASY_COLOR)}
      {renderRow("Difícil", HARD, hf, HARD_COLOR)}
    </div>
  );
}

function BeltSequence() {
  const belts = [
    { name: "Blanco",  img: "/belt_white.png"  },
    { name: "Azul",    img: "/belt_blue.png"   },
    { name: "Violeta", img: "/belt_purple.png" },
    { name: "Marrón",  img: "/belt_brown.png"  },
    { name: "Negro",   img: "/belt_black.png"  },
  ];
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const timers = belts.map((_, i) =>
      setTimeout(() => setLit(i + 1), 680 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, []);

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

function ItemStates() {
  const STATES = [
    { label: "Nuevo",       bg: "rgba(29,78,216,0.25)",  border: "#3B82F6",  text: "#BFDBFE"      },
    { label: "Pendiente",   bg: "rgba(180,83,9,0.25)",   border: "#B45309",  text: "#FDE68A"      },
    { label: "Aprendiendo", bg: "rgba(101,163,13,0.25)", border: "#84CC16",  text: "#D9F99D"      },
    { label: "Graduado",    bg: "rgba(21,128,61,0.25)",  border: "#22C55E",  text: "#BBF7D0"      },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= STATES.length - 1) return;
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
                      {currentIdx === exercises.length - 1 ? "Terminar" : "Siguiente →"}
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
    playConteo(); // sound starts exactly with animation
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
              Continuar →
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
              <div>
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
                style={{ width: 100, height: "auto", opacity: 0.85,
                  marginLeft: "auto", marginRight: 20 }} />
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
            <div style={{ ...card, marginBottom: "1rem" }}>
              {/* Header row: left info + belt icon */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "0.85rem" }}>
                <div>
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
                  style={{ width: 100, height: "auto", opacity: 0.85,
                    marginLeft: "auto", marginRight: 20 }} />
              </div>
              <ProgressGrid skillStates={skillStates} revealedKeys={revealedKeys} />
            </div>
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
    await startSession(name);
  }

  function handleComplete(summaryData) {
    setSummary(summaryData);
    setDebugLastEx(false);
    setScreen("summary");
  }

  function handleRegister() {
    setIsRegistered(true);
    setScreen("home");
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
    return <TutorialScreen onStart={handleTutorialStart} />;

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

  if (screen === "home")
    return <HomeScreen userName={userName} lastSummary={summary}
      onStartSession={handleNewSession} />;

  return null;
}

const root = globalThis.__ROOT ??= ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
