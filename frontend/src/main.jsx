import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import katex from "katex";
import "katex/dist/katex.min.css";

const API = "http://localhost:8000";

// ── Constants ──────────────────────────────────────────────────────────────────

const UNIVERSIDADES = [
  "UBA", "UTN", "UNLP", "UNAHUR", "UNGS", "UNQ",
  "UNLAM", "UNSAM", "UNLu", "UNMdP", "UNLa",
];

const CARRERAS = [
  { value: "ciencias",    label: "Ciencias" },
  { value: "tecnologia",  label: "Tecnología" },
  { value: "ingenieria",  label: "Ingeniería" },
  { value: "matematica",  label: "Matemática" },
  { value: "otra",        label: "Otra" },
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
  options: ["f(x) = 5x − 2", "f(x) = x²", "f(x) = 3ˣ", "f(x) = log(x)"],
  correct_index: 0,
  has_math: false,
  skill: "CLSF",
  graph_fn: null,
  graph_view: null,
  feedback_correct: "¡Correcto! Una función lineal tiene la forma f(x) = mx + b, donde m y b son constantes.",
  feedback_incorrect: "Una función lineal tiene la forma f(x) = mx + b. La opción correcta es f(x) = 5x − 2.",
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
  width: "100%", padding: "0.7rem 1rem",
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
        fontFamily: fonts.heading, fontWeight: 600, fontSize: size,
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

function itemCell(entry) {
  if (!entry) return { bg: C.bgElevated, label: "—", textColor: C.muted };

  if (entry.phase === "review") {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = entry.next_review
      ? Math.round((new Date(entry.next_review + "T00:00:00") - today) / 86400000)
      : 999;
    if (diff <= 0)  return { bg: "#FCD34D", label: "Hoy",      textColor: "#78350F" };
    if (diff <= 2)  return { bg: "#86EFAC", label: `${diff}d`,  textColor: "#14532D" };
    if (diff <= 6)  return { bg: "#4ADE80", label: `${diff}d`,  textColor: "#14532D" };
    if (diff <= 13) return { bg: "#22C55E", label: `${diff}d`,  textColor: "#fff" };
    if (diff <= 20) return { bg: "#16A34A", label: `${diff}d`,  textColor: "#fff" };
    return                  { bg: "#15803D", label: `${diff}d`, textColor: "#fff" };
  }

  const si = entry.step_index || 0;
  const learningBg = ["#065F46", "#047857", "#059669"][si] || "#065F46";
  return { bg: learningBg, label: `${si + 1}/3`, textColor: "#D1FAE5" };
}

function ProgressGrid({ skillStates, touchedKeys }) {
  const touched = touchedKeys || new Set();
  return (
    <div>
      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 52px 52px",
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
            gridTemplateColumns: "1fr 52px 52px 52px", gap: "3px", alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.textSecondary, paddingLeft: "4px" }}>
              {label}
            </div>
            {WHITE_BELT_SKILLS.map(skill => {
              const k = `${topicKey}:${skill}`;
              const entry = skillStates[k];
              const wasTouched = touched.has(k);
              const { bg, label: cellLabel, textColor } = itemCell(entry);
              return (
                <div key={skill} style={{
                  background: bg, borderRadius: 6, height: 26,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700, color: textColor,
                  transition: "background 0.4s ease",
                  outline: wasTouched ? `2px solid ${C.primary}` : "none",
                  outlineOffset: "-2px",
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
        flexWrap: "wrap", borderTop: `1px solid ${C.border}`, paddingTop: "0.7rem" }}>
        {[
          { bg: C.bgElevated, label: "Sin iniciar", textColor: C.muted },
          { bg: "#065F46", label: "Aprendiendo", textColor: "#D1FAE5" },
          { bg: "#FCD34D", label: "Repasar hoy", textColor: "#78350F" },
          { bg: "#22C55E", label: "En progreso", textColor: "#fff" },
          { bg: "#15803D", label: "Maduro",      textColor: "#fff" },
        ].map(({ bg, label: ll, textColor }) => (
          <div key={ll} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: bg,
              border: bg === C.bgElevated ? `1px solid ${C.border}` : "none" }} />
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
      animation: `${anim} 0.3s ease-out`,
    }}>
      {children}
    </div>
  );
}

// ── TutorialScreen ─────────────────────────────────────────────────────────────

const TOTAL_SLIDES = 9;

function TutorialScreen({ onStart }) {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [career, setCareer] = useState("");
  const [uni, setUni] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tutorial exercise state
  const [exAnswered, setExAnswered] = useState(false);
  const [exSelected, setExSelected] = useState(null);

  function canAdvance() {
    if (slide === 0) return name.trim().length > 0;
    if (slide === 5) return exAnswered;
    if (slide === 6) return career !== "";
    if (slide === 7) return uni !== "";
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
    setLoading(true); setError(null);
    try {
      await onStart({ name: name.trim(), university: uni, career });
    } catch {
      setError("No se pudo conectar con el servidor.");
      setLoading(false);
    }
  }

  function handleExAnswer(idx) {
    if (exAnswered) return;
    setExSelected(idx);
    setExAnswered(true);
  }

  // Progress dots
  const dots = (
    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginBottom: "2rem" }}>
      {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
        <div key={i} style={{
          width: i === slide ? 24 : 8, height: 8, borderRadius: 999,
          background: i <= slide ? C.primary : C.border,
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );

  const continueBtn = (label = "Continuar", onClick = goNext) => (
    <button onClick={onClick} disabled={!canAdvance()}
      style={{
        width: "100%", padding: "0.9rem", marginTop: "2rem",
        background: canAdvance() ? C.primary : C.border,
        color: canAdvance() ? "#fff" : C.muted,
        border: "none", borderRadius: 12, fontSize: "1rem",
        fontWeight: 700, cursor: canAdvance() ? "pointer" : "not-allowed",
        fontFamily: fonts.body, transition: "all 0.2s",
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
        <Logo size="2rem" />
        <h1 style={{ fontFamily: fonts.heading, fontSize: "1.4rem", fontWeight: 600,
          color: "rgba(244,247,251,0.75)", margin: "2rem 0 0.75rem" }}>
          ¡Hola!
        </h1>
        <p style={{ color: C.textSecondary, fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          ¿Cómo te gustaría que te llamen?
        </p>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Tu nombre"
          autoFocus
          onKeyDown={e => e.key === "Enter" && canAdvance() && goNext()}
          style={{
            ...inputStyle, textAlign: "center", fontSize: "1.2rem",
            padding: "0.9rem 1rem", borderRadius: 14,
          }}
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        {continueBtn()}
      </div>
    ),

    // Slide 1: Welcome with name
    1: (
      <div style={{ textAlign: "center" }}>
        <Logo size="1.6rem" />
        <h1 style={{ fontFamily: fonts.heading, fontSize: "1.7rem", fontWeight: 800,
          color: C.text, margin: "2rem 0 0.75rem" }}>
          ¡Bienvenido, {name.trim() || "..."}!
        </h1>
        <p style={{ color: C.textSecondary, fontSize: "1.05rem", lineHeight: 1.7 }}>
          <strong style={{ color: C.text }}>Intervalo</strong> es un sistema de repaso adaptativo
          para Análisis Matemático I. Sesiones cortas y frecuentes que te preparan para los exámenes.
        </p>
        {continueBtn()}
      </div>
    ),

    // Slide 2: Evocación Activa
    2: (
      <div>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "1rem", textAlign: "center" }}>
          Evocación Activa
        </h2>
        <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, textAlign: "center", marginBottom: "1.5rem" }}>
          Resolver desde la memoria es más efectivo que releer apuntes.
          Vas a recuperar conceptos sin material de consulta.
        </p>
        <FlipCard
          front={
            <div style={{ padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: C.muted,
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Pregunta
              </div>
              <p style={{ color: C.text, fontSize: "1rem", fontWeight: 600 }}>
                ¿Qué forma tiene una función lineal?
              </p>
              <p style={{ color: C.muted, fontSize: "0.8rem", marginTop: "1rem" }}>Tocá para ver la respuesta</p>
            </div>
          }
          back={
            <div style={{ padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: C.primary,
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Respuesta
              </div>
              <p style={{ color: C.text, fontSize: "1rem", fontWeight: 600 }}>
                f(x) = mx + b
              </p>
              <p style={{ color: C.textSecondary, fontSize: "0.85rem", marginTop: "0.5rem" }}>
                donde m es la pendiente y b la ordenada al origen
              </p>
            </div>
          }
        />
        {continueBtn()}
      </div>
    ),

    // Slide 3: Repetición Espaciada
    3: (
      <div>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "1rem", textAlign: "center" }}>
          Repetición Espaciada
        </h2>
        <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, textAlign: "center", marginBottom: "1.5rem" }}>
          El algoritmo ajusta qué repasar y cuándo. Lo difícil aparece más seguido, lo dominado se espacia.
        </p>
        <SpacedTimeline />
        {continueBtn()}
      </div>
    ),

    // Slide 4: Gamificación
    4: (
      <div>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "1rem", textAlign: "center" }}>
          Gamificación
        </h2>
        <p style={{ color: C.textSecondary, fontSize: "1rem", lineHeight: 1.7, textAlign: "center", marginBottom: "1.5rem" }}>
          Tu progreso se mide a través de ítems. Cada ítem evalúa una habilidad sobre un tema.
          A medida que demostrás dominio sostenido, los ítems se gradúan y avanzás de cinturón.
        </p>
        <BeltSequence />
        {continueBtn()}
      </div>
    ),

    // Slide 5: Example exercise
    5: (
      <div>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.3rem", fontWeight: 800,
          color: C.text, marginBottom: "0.5rem", textAlign: "center" }}>
          Así se ve un ejercicio
        </h2>
        <p style={{ color: C.muted, fontSize: "0.85rem", textAlign: "center", marginBottom: "1.25rem" }}>
          Probá resolver este ejemplo
        </p>
        <ExerciseCard
          exercise={TUTORIAL_EXERCISE}
          answered={exAnswered}
          selected={exSelected}
          onAnswer={handleExAnswer}

        />
        {continueBtn()}
      </div>
    ),

    // Slide 6: Career
    6: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "0.75rem" }}>
          ¿Qué tipo de carrera estudiás?
        </h2>
        <p style={{ color: C.textSecondary, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
          Para personalizar tu experiencia
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", justifyContent: "center" }}>
          {CARRERAS.map(c => (
            <button key={c.value} onClick={() => setCareer(c.value)}
              style={{
                padding: "0.65rem 1.2rem", borderRadius: 12,
                border: career === c.value ? `2px solid ${C.primary}` : `2px solid ${C.border}`,
                background: career === c.value ? C.primary : C.bgElevated,
                color: career === c.value ? "#fff" : C.text,
                fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
                fontFamily: fonts.body, transition: "all 0.15s",
              }}>
              {c.label}
            </button>
          ))}
        </div>
        {continueBtn()}
      </div>
    ),

    // Slide 7: University
    7: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
          color: C.text, marginBottom: "0.75rem" }}>
          ¿En qué universidad?
        </h2>
        <p style={{ color: C.textSecondary, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
          Si no está en la lista, elegí "Otra"
        </p>
        <select value={uni} onChange={e => setUni(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer", textAlign: "center", fontSize: "1rem" }}>
          <option value="">Seleccioná una opción</option>
          {UNIVERSIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          <option value="otra">Otra</option>
        </select>
        {continueBtn()}
      </div>
    ),

    // Slide 8: Ready
    8: (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: "1.6rem", fontWeight: 800,
          color: C.text, marginBottom: "0.75rem" }}>
          ¡Todo listo!
        </h2>
        <p style={{ color: C.textSecondary, fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
          Tu primer repaso tiene 12 ejercicios y te va a tomar menos de 3 minutos. ¿Arrancamos?
        </p>
        {error && (
          <p style={{ color: C.error, background: C.errorBg, borderRadius: 8,
            padding: "0.6rem 0.9rem", fontSize: "0.875rem", margin: "1rem 0" }}>
            {error}
          </p>
        )}
        {continueBtn(loading ? "Iniciando…" : "Iniciar Repaso →", handleStart)}
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
        transition: "transform 0.5s ease",
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
  const intervals = [
    { label: "1d", desc: "Día 1" },
    { label: "3d", desc: "Día 3" },
    { label: "7d", desc: "Día 7" },
    { label: "21d", desc: "Día 21" },
  ];
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const timers = intervals.map((_, i) =>
      setTimeout(() => setVisible(i + 1), 400 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      gap: 0, padding: "1rem 0" }}>
      {intervals.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div style={{
              flex: 1, height: 2, background: i < visible ? C.primary : C.border,
              transition: "background 0.4s ease", maxWidth: 60,
            }} />
          )}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            opacity: i < visible ? 1 : 0.2, transition: "opacity 0.5s ease",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: i < visible ? C.primary : C.border,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "0.7rem", fontWeight: 700,
              transition: "all 0.4s ease",
            }}>
              {item.label}
            </div>
            <span style={{ fontSize: "0.65rem", color: C.muted }}>{item.desc}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function BeltSequence() {
  const beltNames = ["Blanco", "Azul", "Violeta", "Marrón", "Negro"];
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const timers = beltNames.map((_, i) =>
      setTimeout(() => setLit(i + 1), 500 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center",
      padding: "1rem 0", flexWrap: "wrap" }}>
      {beltNames.map((name, i) => (
        <div key={name} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          opacity: i < lit ? 1 : 0.2, transition: "opacity 0.5s ease",
          transform: i < lit ? "scale(1)" : "scale(0.85)",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: BELT_COLORS[i],
            border: i === 0 ? `2px solid ${C.border}` : "none",
            boxShadow: i < lit ? `0 0 12px ${BELT_COLORS[i]}44` : "none",
            transition: "all 0.4s ease",
          }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: C.textSecondary }}>{name}</span>
        </div>
      ))}
    </div>
  );
}

// ── ExerciseCard (shared between tutorial and session) ─────────────────────────

function ExerciseCard({ exercise: ex, answered, selected, onAnswer }) {
  const isCorrect = selected === ex.correct_index;
  const feedbackText = isCorrect ? ex.feedback_correct : ex.feedback_incorrect;

  return (
    <div style={{ ...card, padding: "1.25rem" }}>
      <span style={{ background: C.pill, color: C.pillText, borderRadius: 999,
        padding: "0.22rem 0.7rem", fontSize: "0.75rem", fontWeight: 600 }}>
        {SKILL_LABELS[ex.skill] ?? ex.skill}
      </span>

      <p style={{ fontSize: "1.05rem", fontWeight: 600, color: C.text,
        lineHeight: 1.6, margin: "0.9rem 0 1.25rem",
        fontFamily: fonts.body }}>
        {ex.has_math ? <MathText text={ex.question} /> : ex.question}
      </p>

      {ex.graph_fn && ex.graph_view && (
        <div style={{ marginBottom: "1.25rem" }}>
          <FunctionPlot fnStr={ex.graph_fn} view={ex.graph_view} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {ex.options.map((opt, i) => {
          const optCorrect  = i === ex.correct_index;
          const optSelected = i === selected;
          let bg = C.bgElevated, border = `1.5px solid ${C.border}`,
            color = C.text, opacity = 1;
          if (answered) {
            if (optCorrect)       { bg = C.successBg; border = `1.5px solid ${C.success}`; color = C.success; }
            else if (optSelected) { bg = C.errorBg;   border = `1.5px solid ${C.error}`;   color = C.error; }
            else                  { opacity = 0.4; }
          }
          return (
            <button key={i} onClick={() => onAnswer(i)} disabled={answered}
              style={{ width: "100%", padding: "0.8rem 1rem", background: bg,
                border, borderRadius: 10, fontSize: "0.93rem", fontWeight: 500,
                color, cursor: answered ? "default" : "pointer", textAlign: "left",
                opacity, transition: "all 0.15s", fontFamily: fonts.body,
                display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center",
                justifyContent: "center", width: 24, height: 24, borderRadius: "50%",
                flexShrink: 0, fontSize: "0.72rem", fontWeight: 700,
                transition: "all 0.15s",
                background: answered
                  ? optCorrect ? C.success : optSelected ? C.error : C.border
                  : C.border,
                color: answered && (optCorrect || optSelected) ? "#fff" : C.muted }}>
                {["A","B","C","D"][i]}
              </span>
              {ex.has_math ? <MathText text={opt} /> : opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{ marginTop: "1rem" }}>
          <p style={{ padding: "0.7rem 1rem", borderRadius: 10,
            fontWeight: 600, fontSize: "0.88rem", lineHeight: 1.5,
            background: isCorrect ? C.successBg : C.errorBg,
            color: isCorrect ? C.success : C.error }}>
            {isCorrect ? "✓ " : "✗ "}
            {ex.has_math ? <MathText text={feedbackText} /> : feedbackText}
          </p>

        </div>
      )}
    </div>
  );
}

// ── SessionScreen ──────────────────────────────────────────────────────────────

function SessionScreen({ sessionId, userName, exercises, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const [result, setResult]         = useState(null);
  const [elapsed, setElapsed]       = useState(0);
  const [slideDir, setSlideDir]     = useState(1);
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0); setAnswered(false); setSelected(null); setResult(null);
    timerRef.current = setInterval(() =>
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 100);
    return () => clearInterval(timerRef.current);
  }, [currentIdx]);

  async function handleAnswer(idx) {
    if (answered) return;
    clearInterval(timerRef.current);
    const t = (Date.now() - startRef.current) / 1000;
    setAnswered(true); setSelected(idx);
    const ex = exercises[currentIdx];
    try {
      const res = await fetch(`${API}/session/answer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, exercise_id: ex.id,
          answer_index: idx, response_time_s: t }),
      });
      setResult(await res.json());
    } catch {
      const ok = idx === ex.correct_index;
      setResult({ correct: ok, feedback: ok ? "¡Correcto!" : "Incorrecto." });
    }
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  }

  async function handleNext() {
    if (currentIdx === exercises.length - 1) await onComplete(sessionId);
    else { setSlideDir(1); setCurrentIdx(i => i + 1); }
  }

  const ex    = exercises[currentIdx];
  const total = exercises.length;
  const pct   = (currentIdx / total) * 100;
  const isCorrect = selected === ex.correct_index;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: fonts.body }}>
      <Nav rightContent={
        <span style={{ color: C.textSecondary, fontSize: "0.85rem" }}>{userName}</span>
      } />

      <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 1rem 2rem" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
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
              borderRadius: 999, transition: "width 0.4s ease" }} />
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
                {ex.has_math ? <MathText text={ex.question} /> : ex.question}
              </p>

              {ex.graph_fn && ex.graph_view && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <FunctionPlot fnStr={ex.graph_fn} view={ex.graph_view} />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {ex.options.map((opt, i) => {
                  const optCorrect  = i === ex.correct_index;
                  const optSelected = i === selected;
                  let bg = C.bgElevated, border = `1.5px solid ${C.border}`,
                    color = C.text, opacity = 1;
                  if (answered) {
                    if (optCorrect)       { bg = C.successBg; border = `1.5px solid ${C.success}`; color = C.success; }
                    else if (optSelected) { bg = C.errorBg;   border = `1.5px solid ${C.error}`;   color = C.error; }
                    else                  { opacity = 0.4; }
                  }
                  return (
                    <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
                      style={{ width: "100%", padding: "0.8rem 1rem", background: bg,
                        border, borderRadius: 10, fontSize: "0.93rem", fontWeight: 500,
                        color, cursor: answered ? "default" : "pointer", textAlign: "left",
                        opacity, transition: "all 0.15s", fontFamily: fonts.body,
                        display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center",
                        justifyContent: "center", width: 24, height: 24, borderRadius: "50%",
                        flexShrink: 0, fontSize: "0.72rem", fontWeight: 700,
                        transition: "all 0.15s",
                        background: answered
                          ? optCorrect ? C.success : optSelected ? C.error : C.border
                          : C.border,
                        color: answered && (optCorrect || optSelected) ? "#fff" : C.muted }}>
                        {["A","B","C","D"][i]}
                      </span>
                      {ex.has_math ? <MathText text={opt} /> : opt}
                    </button>
                  );
                })}
              </div>

              {answered && result && (
                <div style={{ marginTop: "1.1rem" }}>
                  <p style={{ padding: "0.7rem 1rem", borderRadius: 10,
                    fontWeight: 600, fontSize: "0.88rem", lineHeight: 1.5,
                    marginBottom: "0.75rem",
                    background: result.correct ? C.successBg : C.errorBg,
                    color: result.correct ? C.success : C.error }}>
                    {result.correct ? "✓ " : "✗ "}
                    {ex.has_math ? <MathText text={result.feedback} /> : result.feedback}
                  </p>

                  <button onClick={handleNext}
                    style={{ width: "100%", padding: "0.85rem", background: C.primary,
                      color: "#fff", border: "none", borderRadius: 10,
                      fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                      fontFamily: fonts.body }}>
                    {currentIdx === exercises.length - 1 ? "Ver resultados →" : "Siguiente →"}
                  </button>
                </div>
              )}
            </div>
          </SlideTransition>

          <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", flexWrap: "wrap" }}>
            {exercises.map((_, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: "50%",
                background: i <= currentIdx ? C.primary : C.border,
                opacity: i <= currentIdx ? 1 : 0.45, transition: "all 0.2s" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SummaryScreen ──────────────────────────────────────────────────────────────

function XPCounter({ targetXP, levelInfo }) {
  const [displayXP, setDisplayXP] = useState(0);
  const [barPct, setBarPct] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(levelInfo ? levelInfo.level : 1);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (targetXP === 0) return;
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;

    // If level_info exists, calculate if we crossed a level boundary
    // We simulate XP filling from 0 to targetXP
    const finalPct = levelInfo ? Math.min(levelInfo.progress_pct, 100) : 0;
    const startLevel = levelInfo ? Math.max(1, levelInfo.level - (levelInfo.xp_in_level < targetXP ? 1 : 0)) : 1;
    const didLevelUp = levelInfo && startLevel < levelInfo.level;

    if (didLevelUp) setDisplayLevel(startLevel);

    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXP(Math.round(eased * targetXP));

      if (didLevelUp) {
        // First half: fill to 100%, second half: reset and fill to final
        if (progress < 0.5) {
          setBarPct(Math.min(100, eased * 200));
        } else if (progress < 0.55) {
          setBarPct(100);
          setShowLevelUp(true);
          setDisplayLevel(levelInfo.level);
        } else {
          setBarPct(finalPct * ((progress - 0.55) / 0.45));
        }
      } else {
        setBarPct(eased * finalPct);
      }

      if (current >= steps) {
        clearInterval(timer);
        setDisplayXP(targetXP);
        setBarPct(finalPct);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetXP]);

  return (
    <div style={{ ...card, marginBottom: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", fontWeight: 800, color: C.primary, lineHeight: 1,
        fontFamily: fonts.heading, marginBottom: "0.25rem" }}>
        +{displayXP} XP
      </div>
      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.muted,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
        Experiencia ganada
      </div>

      {levelInfo && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "baseline", marginBottom: "0.4rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: C.text }}>
              Nivel {displayLevel}
              {showLevelUp && (
                <span style={{ color: C.primary, marginLeft: "0.5rem", fontSize: "0.75rem" }}>
                  LEVEL UP!
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.68rem", color: C.muted }}>
              {levelInfo.xp_in_level} / {levelInfo.xp_required} XP
            </div>
          </div>
          <div style={{ width: "100%", height: 10, background: C.border,
            borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              width: `${barPct}%`, height: "100%",
              background: `linear-gradient(90deg, ${C.primary}, #7C3AED)`,
              borderRadius: 999, transition: "width 0.05s linear",
            }} />
          </div>
          <div style={{ fontSize: "0.68rem", color: C.muted, marginTop: "0.35rem", textAlign: "right" }}>
            {levelInfo.xp_missing > 0
              ? `Faltan ${levelInfo.xp_missing} XP para el nivel ${levelInfo.level + 1}`
              : `¡Nivel ${levelInfo.level} completado!`}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryScreen({ summary, onRestart, onRegister }) {
  const { user_name, total, correct, incorrect, items, xp_earned = 0, level_info } = summary;
  const skillStates = summary.skill_states || {};
  const touchedKeys = new Set(items.map(it => `${it.topic ?? it.family}:${it.skill}`));

  const graduatedCount = Object.values(skillStates)
    .filter(s => s?.phase === "review").length;
  const stripes  = STRIPE_THRESHOLDS.filter(t => graduatedCount >= t).length;
  const promoted = graduatedCount >= PROMOTION_THRESHOLD;

  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  function handleRegister() {
    setRegistering(true);
    setTimeout(() => {
      setRegistering(false);
      setRegistered(true);
      if (onRegister) onRegister();
    }, 1500);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: fonts.body }}>
      <Nav />

      <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 1rem 3rem" }}>
        <div style={{ width: "100%", maxWidth: 540 }}>

          {/* Header */}
          <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
            color: C.text, textAlign: "center", margin: "0 0 1.25rem" }}>
            ¡Repaso completado!
          </h2>

          {/* Animated XP + Level */}
          <XPCounter targetXP={xp_earned} levelInfo={level_info} />

          {/* Belt + topic progress card */}
          <div style={{ ...card, marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  Cinturón Blanco
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0, 1].map(i => (
                    <div key={i} style={{
                      width: 22, height: 10, borderRadius: 999,
                      background: i < stripes ? "#D97706" : C.border,
                      transition: "background 0.4s ease",
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: "0.68rem", color: C.muted, marginTop: "0.3rem" }}>
                  {graduatedCount} / {MASTERY_TOTAL} ítems
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.68rem", color: C.muted }}>
                  {promoted ? "Cinturón completado" : stripes < 2 ? "Próxima raya" : "Para ascender"}
                </div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: promoted ? C.success : C.text }}>
                  {promoted
                    ? "Promovido ✓"
                    : `${(stripes < 2 ? STRIPE_THRESHOLDS[stripes] : PROMOTION_THRESHOLD) - graduatedCount} ítems más`}
                </div>
              </div>
            </div>

            <ProgressGrid skillStates={skillStates} touchedKeys={touchedKeys} />
          </div>

          {/* Register with Google card */}
          {onRegister && !registered && (
            <div style={{ ...card, marginBottom: "1rem", textAlign: "center" }}>
              <h3 style={{ fontFamily: fonts.heading, fontSize: "1.1rem", fontWeight: 700,
                color: C.text, margin: "0 0 0.4rem" }}>
                Guardá tu progreso
              </h3>
              <p style={{ color: C.muted, fontSize: "0.88rem", margin: "0 0 1.25rem" }}>
                Registrate para no perder tu avance
              </p>
              <button onClick={handleRegister} disabled={registering}
                style={{
                  width: "100%", padding: "0.8rem 1rem", borderRadius: 12,
                  background: "#fff", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                  fontSize: "0.95rem", fontWeight: 600, color: "#333",
                  fontFamily: fonts.body, transition: "all 0.15s",
                  opacity: registering ? 0.7 : 1,
                }}>
                {registering ? (
                  <span>Registrando...</span>
                ) : (
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
            </div>
          )}

          <button onClick={onRestart}
            style={{ width: "100%", padding: "0.9rem", background: C.primary,
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: "1rem", fontWeight: 700, cursor: "pointer",
              fontFamily: fonts.body }}>
            {onRegister ? "Nueva clase" : "Volver al inicio"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HomeScreen (post-registration) ─────────────────────────────────────────────

function HomeScreen({ userName, lastSummary, onStartSession }) {
  const skillStates = lastSummary?.skill_states || {};
  const levelInfo = lastSummary?.level_info;
  const xpTotal = lastSummary?.xp_earned || 0;

  const graduatedCount = Object.values(skillStates)
    .filter(s => s?.phase === "review").length;
  const stripes = STRIPE_THRESHOLDS.filter(t => graduatedCount >= t).length;

  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: fonts.body }}>
      <Nav rightContent={
        levelInfo && (
          <span style={{ color: C.textSecondary, fontSize: "0.82rem", fontWeight: 600 }}>
            Nivel {levelInfo.level}
          </span>
        )
      } />

      <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 1rem 3rem" }}>
        <div style={{ width: "100%", maxWidth: 540 }}>

          {/* Welcome card */}
          <div style={{ ...card, marginBottom: "1rem", textAlign: "center" }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: "1.5rem", fontWeight: 800,
              color: C.text, margin: "0 0 0.5rem" }}>
              Hola, {userName}
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center",
              flexWrap: "wrap", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.85rem", color: C.textSecondary }}>
                Cinturón Blanco
              </span>
              {levelInfo && (
                <span style={{ fontSize: "0.85rem", color: C.textSecondary }}>
                  Nivel {levelInfo.level} · {xpTotal} XP
                </span>
              )}
            </div>
          </div>

          {/* Start session CTA */}
          <button onClick={onStartSession}
            style={{
              width: "100%", padding: "1.1rem", marginBottom: "1rem",
              background: C.primary, color: "#fff", border: "none", borderRadius: 14,
              fontSize: "1.1rem", fontWeight: 700, cursor: "pointer",
              fontFamily: fonts.body, transition: "all 0.15s",
            }}>
            Iniciar sesión →
          </button>

          {/* Progress grid */}
          <div style={{ ...card, marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted,
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              Progreso — Cinturón Blanco
            </div>
            <ProgressGrid skillStates={skillStates} />
          </div>

          {/* Share card */}
          <div style={{ ...card, textAlign: "center" }}>
            <p style={{ color: C.textSecondary, fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              Compartí Intervalo con tus compañeros
            </p>
            <button onClick={handleCopy}
              style={{
                padding: "0.6rem 1.5rem", borderRadius: 10,
                background: C.bgElevated, border: `1px solid ${C.border}`,
                color: copied ? C.success : C.textSecondary,
                fontSize: "0.88rem", fontWeight: 600, cursor: "pointer",
                fontFamily: fonts.body, transition: "all 0.2s",
              }}>
              {copied ? "✓ Enlace copiado" : "Copiar enlace"}
            </button>
          </div>
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

  async function handleComplete(sessionId) {
    const res = await fetch(`${API}/session/${sessionId}/summary`);
    if (!res.ok) throw new Error("Error al obtener resumen");
    setSummary(await res.json());
    setScreen("summary");
  }

  function handleRegister() {
    setIsRegistered(true);
    setScreen("home");
  }

  async function handleNewSession() {
    await startSession();
  }

  if (screen === "tutorial")
    return <TutorialScreen onStart={handleTutorialStart} />;

  if (screen === "session" && session)
    return <SessionScreen sessionId={session.session_id} userName={userName}
      exercises={session.exercises} onComplete={handleComplete} />;

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
