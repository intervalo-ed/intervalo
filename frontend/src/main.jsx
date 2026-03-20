import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import katex from "katex";
import "katex/dist/katex.min.css";

const API = "http://localhost:8000";

const SKILL_LABELS = {
  vocabulary: "Vocabulario",
  visual_recognition: "Reconocimiento visual",
  parameter_identification: "Identificación de parámetros",
};

const FAMILY_LABELS = {
  linear: "Lineal",
  quadratic: "Cuadrática",
  polynomial: "Polinómica",
  exponential: "Exponencial",
  logarithmic: "Logarítmica",
  trigonometric: "Trigonométrica",
  rational: "Racional",
};

// ── Math rendering ─────────────────────────────────────────────────────────────
function MathText({ text }) {
  // Splits on $...$ and renders math parts with KaTeX, plain text otherwise.
  const parts = text.split(/\$([^$]+)\$/g);
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 0 ? (
          part
        ) : (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part, { throwOnError: false }),
            }}
          />
        )
      )}
    </span>
  );
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const COLOR = {
  primary: "#6366f1",
  primaryHover: "#4f46e5",
  success: "#16a34a",
  successBg: "#dcfce7",
  error: "#dc2626",
  errorBg: "#fee2e2",
  bg: "#f1f5f9",
  card: "#ffffff",
  border: "#e2e8f0",
  textMuted: "#64748b",
  text: "#1e293b",
};

const cardStyle = {
  background: COLOR.card,
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  padding: "2rem",
};

// ── Function plot (SVG) ────────────────────────────────────────────────────────
function FunctionPlot({ fnStr, view }) {
  const [xMin, xMax, yMin, yMax] = view;
  const W = 480, H = 280, PAD = 44;
  const pw = W - 2 * PAD;
  const ph = H - 2 * PAD;

  const toX = (x) => PAD + ((x - xMin) / (xMax - xMin)) * pw;
  const toY = (y) => H - PAD - ((y - yMin) / (yMax - yMin)) * ph;

  // Compile function safely
  let fn;
  try {
    fn = new Function(
      "x",
      `const sin=Math.sin,cos=Math.cos,tan=Math.tan,pow=Math.pow,
             log=Math.log,log2=Math.log2,log10=Math.log10,
             exp=Math.exp,abs=Math.abs,sqrt=Math.sqrt,
             PI=Math.PI,E=Math.E;
       return ${fnStr};`
    );
  } catch {
    fn = () => 0;
  }

  // Sample function and split into continuous segments (handle discontinuities)
  const STEPS = 600;
  const segments = [];
  let seg = [];
  const margin = (yMax - yMin) * 2;
  for (let i = 0; i <= STEPS; i++) {
    const x = xMin + (i / STEPS) * (xMax - xMin);
    let y;
    try { y = fn(x); } catch { y = NaN; }
    if (!isFinite(y) || y < yMin - margin || y > yMax + margin) {
      if (seg.length > 1) segments.push(seg);
      seg = [];
    } else {
      seg.push([toX(x), toY(y)]);
    }
  }
  if (seg.length > 1) segments.push(seg);

  // Axis pixel positions
  const ax = toX(Math.max(xMin, Math.min(xMax, 0)));
  const ay = toY(Math.max(yMin, Math.min(yMax, 0)));

  // Integer ticks
  const xTicks = [], yTicks = [];
  const xStep = xMax - xMin > 10 ? 2 : 1;
  const yStep = yMax - yMin > 10 ? 2 : 1;
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += xStep)
    if (x !== 0) xTicks.push(x);
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep)
    if (y !== 0) yTicks.push(y);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", borderRadius: 10, display: "block", background: "#f8fafc" }}
    >
      {/* Grid lines */}
      {xTicks.map((x) => (
        <line key={`gx${x}`} x1={toX(x)} y1={PAD} x2={toX(x)} y2={H - PAD}
          stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {yTicks.map((y) => (
        <line key={`gy${y}`} x1={PAD} y1={toY(y)} x2={W - PAD} y2={toY(y)}
          stroke="#e2e8f0" strokeWidth="1" />
      ))}

      {/* Axes */}
      <line x1={PAD} y1={ay} x2={W - PAD} y2={ay} stroke="#94a3b8" strokeWidth="1.5" />
      <line x1={ax} y1={PAD} x2={ax} y2={H - PAD} stroke="#94a3b8" strokeWidth="1.5" />

      {/* Axis arrows */}
      <polygon points={`${W - PAD + 1},${ay} ${W - PAD - 7},${ay - 4} ${W - PAD - 7},${ay + 4}`}
        fill="#94a3b8" />
      <polygon points={`${ax},${PAD - 1} ${ax - 4},${PAD + 7} ${ax + 4},${PAD + 7}`}
        fill="#94a3b8" />

      {/* Tick marks + labels */}
      {xTicks.map((x) => (
        <g key={`tx${x}`}>
          <line x1={toX(x)} y1={ay - 4} x2={toX(x)} y2={ay + 4} stroke="#94a3b8" strokeWidth="1" />
          <text x={toX(x)} y={ay + 15} textAnchor="middle" fontSize="11" fill="#94a3b8">{x}</text>
        </g>
      ))}
      {yTicks.map((y) => (
        <g key={`ty${y}`}>
          <line x1={ax - 4} y1={toY(y)} x2={ax + 4} y2={toY(y)} stroke="#94a3b8" strokeWidth="1" />
          <text x={ax - 8} y={toY(y) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{y}</text>
        </g>
      ))}

      {/* Clip to plot area */}
      <clipPath id="plot-area">
        <rect x={PAD} y={PAD} width={pw} height={ph} />
      </clipPath>

      {/* Function curves */}
      {segments.map((s, i) => (
        <polyline
          key={i}
          points={s.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#plot-area)"
        />
      ))}
    </svg>
  );
}

// ── HomeScreen ─────────────────────────────────────────────────────────────────
function HomeScreen({ onStart }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onStart(name.trim());
    } catch (err) {
      setError("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: COLOR.bg,
      }}
    >
      <div style={{ ...cardStyle, width: "100%", maxWidth: 480 }}>
        {/* Logo / brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              background: COLOR.primary,
              borderRadius: 16,
              marginBottom: "1rem",
            }}
          >
            <span style={{ color: "#fff", fontSize: 32, fontWeight: 700 }}>G</span>
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: COLOR.text,
              letterSpacing: "-0.5px",
            }}
          >
            Gradus
          </h1>
          <p style={{ color: COLOR.textMuted, marginTop: "0.5rem", lineHeight: 1.5 }}>
            Plataforma de práctica adaptativa para funciones matemáticas.
          </p>
        </div>

        {/* Info badges */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          {["7 familias", "3 habilidades", "Algoritmo SM-2"].map((label) => (
            <span
              key={label}
              style={{
                background: "#ede9fe",
                color: COLOR.primary,
                borderRadius: 999,
                padding: "0.25rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="userName"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 600,
              color: COLOR.text,
              fontSize: "0.95rem",
            }}
          >
            Tu nombre
          </label>
          <input
            id="userName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. María García"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              border: `2px solid ${COLOR.border}`,
              borderRadius: 10,
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.2s",
              marginBottom: "1rem",
              color: COLOR.text,
            }}
            onFocus={(e) => (e.target.style.borderColor = COLOR.primary)}
            onBlur={(e) => (e.target.style.borderColor = COLOR.border)}
          />

          {error && (
            <p
              style={{
                color: COLOR.error,
                background: COLOR.errorBg,
                borderRadius: 8,
                padding: "0.6rem 0.9rem",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: loading || !name.trim() ? "#c7d2fe" : COLOR.primary,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: "1rem",
              fontWeight: 700,
              cursor: loading || !name.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Iniciando sesión…" : "Comenzar sesión →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── SessionScreen ──────────────────────────────────────────────────────────────
function SessionScreen({ sessionId, userName, exercises, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef(null);

  // Reset timer each time the exercise changes
  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsedSecs(0);
    setAnswered(false);
    setSelectedOption(null);
    setResult(null);

    intervalRef.current = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [currentIdx]);

  async function handleAnswer(optionIdx) {
    if (answered) return;
    clearInterval(intervalRef.current);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;

    setAnswered(true);
    setSelectedOption(optionIdx);

    const exercise = exercises[currentIdx];
    try {
      const res = await fetch(`${API}/session/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          exercise_id: exercise.id,
          answer_index: optionIdx,
          response_time_s: elapsed,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // Even if network fails, show local feedback
      const isCorrect = optionIdx === exercise.correct_index;
      setResult({
        correct: isCorrect,
        feedback: isCorrect ? "¡Correcto!" : "Incorrecto.",
      });
    }
  }

  async function handleNext() {
    const isLast = currentIdx === exercises.length - 1;
    if (isLast) {
      await onComplete(sessionId);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }

  const exercise = exercises[currentIdx];
  const total = exercises.length;
  const progressPct = (currentIdx / total) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLOR.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <span style={{ fontWeight: 700, color: COLOR.text, fontSize: "0.95rem" }}>
            Ejercicio {currentIdx + 1} de {total}
          </span>
          <span
            style={{
              background: "#ede9fe",
              color: COLOR.primary,
              borderRadius: 999,
              padding: "0.3rem 0.8rem",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {elapsedSecs}s
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: 6,
            background: COLOR.border,
            borderRadius: 999,
            marginBottom: "1.5rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: COLOR.primary,
              borderRadius: 999,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Exercise card */}
        <div style={{ ...cardStyle, marginBottom: "1rem" }}>
          {/* Skill type tag */}
          <div style={{ marginBottom: "1rem" }}>
            <span
              style={{
                background: "#ede9fe",
                color: COLOR.primary,
                borderRadius: 999,
                padding: "0.25rem 0.75rem",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              {SKILL_LABELS[exercise.skill] || exercise.skill}
            </span>
          </div>

          <p
            style={{
              fontSize: "1.15rem",
              fontWeight: 600,
              color: COLOR.text,
              lineHeight: 1.6,
              marginBottom: exercise.graph_fn ? "1rem" : "1.75rem",
            }}
          >
            {exercise.has_math ? <MathText text={exercise.question} /> : exercise.question}
          </p>

          {/* Graph for visual_recognition exercises */}
          {exercise.graph_fn && exercise.graph_view && (
            <div style={{ marginBottom: "1.75rem" }}>
              <FunctionPlot fnStr={exercise.graph_fn} view={exercise.graph_view} />
            </div>
          )}

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {exercise.options.map((option, idx) => {
              let bg = COLOR.card;
              let border = `2px solid ${COLOR.border}`;
              let color = COLOR.text;
              let opacity = 1;

              if (answered) {
                if (idx === exercise.correct_index) {
                  bg = COLOR.successBg;
                  border = `2px solid ${COLOR.success}`;
                  color = COLOR.success;
                } else if (idx === selectedOption) {
                  bg = COLOR.errorBg;
                  border = `2px solid ${COLOR.error}`;
                  color = COLOR.error;
                } else {
                  opacity = 0.45;
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  style={{
                    width: "100%",
                    padding: "0.85rem 1.1rem",
                    background: bg,
                    border,
                    borderRadius: 10,
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color,
                    cursor: answered ? "default" : "pointer",
                    textAlign: "left",
                    opacity,
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: answered
                        ? idx === exercise.correct_index
                          ? COLOR.success
                          : idx === selectedOption
                          ? COLOR.error
                          : COLOR.border
                        : COLOR.border,
                      color:
                        answered &&
                        (idx === exercise.correct_index || idx === selectedOption)
                          ? "#fff"
                          : COLOR.textMuted,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {["A", "B", "C", "D"][idx]}
                  </span>
                  {exercise.has_math ? <MathText text={option} /> : option}
                </button>
              );
            })}
          </div>

          {/* Feedback + Next */}
          {answered && result && (
            <div style={{ marginTop: "1.25rem" }}>
              <p
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: 10,
                  background: result.correct ? COLOR.successBg : COLOR.errorBg,
                  color: result.correct ? COLOR.success : COLOR.error,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                  lineHeight: 1.5,
                }}
              >
                {result.correct ? "✓ " : "✗ "}
                {exercise.has_math ? <MathText text={result.feedback} /> : result.feedback}
              </p>

              <button
                onClick={handleNext}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  background: COLOR.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {currentIdx === exercises.length - 1 ? "Ver resultados →" : "Siguiente →"}
              </button>
            </div>
          )}
        </div>

        {/* Dot progress */}
        <div
          style={{
            display: "flex",
            gap: "0.35rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {exercises.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background:
                  i < currentIdx
                    ? COLOR.primary
                    : i === currentIdx
                    ? COLOR.primary
                    : COLOR.border,
                opacity: i <= currentIdx ? 1 : 0.4,
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SummaryScreen ──────────────────────────────────────────────────────────────
function SummaryScreen({ summary, onRestart }) {
  const { user_name, total, correct, incorrect, items } = summary;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const scoreColor =
    pct >= 70 ? COLOR.success : pct >= 40 ? "#d97706" : COLOR.error;
  const scoreBg =
    pct >= 70 ? COLOR.successBg : pct >= 40 ? "#fef3c7" : COLOR.errorBg;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLOR.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Header card */}
        <div style={{ ...cardStyle, marginBottom: "1rem", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: COLOR.text,
              marginBottom: "0.25rem",
            }}
          >
            ¡Sesión completada!
          </h2>
          <p style={{ color: COLOR.textMuted, marginBottom: "1.5rem" }}>
            Hola, {user_name}
          </p>

          {/* Score circle */}
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: scoreBg,
              border: `4px solid ${scoreColor}`,
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: scoreColor,
                lineHeight: 1,
              }}
            >
              {correct}/{total}
            </span>
            <span style={{ fontSize: "0.8rem", color: scoreColor, fontWeight: 600 }}>
              {pct}%
            </span>
          </div>

          {/* Score bar */}
          <div
            style={{
              width: "100%",
              height: 10,
              background: COLOR.border,
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: scoreColor,
                borderRadius: 999,
                transition: "width 0.6s ease",
              }}
            />
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <div
              style={{
                background: COLOR.successBg,
                borderRadius: 10,
                padding: "0.6rem 1.2rem",
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: "1.4rem", fontWeight: 800, color: COLOR.success }}
              >
                {correct}
              </div>
              <div style={{ fontSize: "0.78rem", color: COLOR.success }}>Correctas</div>
            </div>
            <div
              style={{
                background: COLOR.errorBg,
                borderRadius: 10,
                padding: "0.6rem 1.2rem",
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: "1.4rem", fontWeight: 800, color: COLOR.error }}
              >
                {incorrect}
              </div>
              <div style={{ fontSize: "0.78rem", color: COLOR.error }}>Incorrectas</div>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div style={{ ...cardStyle, marginBottom: "1rem" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: COLOR.text,
              marginBottom: "1rem",
            }}
          >
            Detalle por ejercicio
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: 8,
                  background: item.correct ? "#f0fdf4" : "#fff5f5",
                }}
              >
                {/* Icon */}
                <span
                  style={{
                    fontSize: "1rem",
                    color: item.correct ? COLOR.success : COLOR.error,
                    flexShrink: 0,
                  }}
                >
                  {item.correct ? "✓" : "✗"}
                </span>
                {/* Labels */}
                <span
                  style={{
                    fontWeight: 600,
                    color: COLOR.text,
                    fontSize: "0.875rem",
                    flex: 1,
                  }}
                >
                  {FAMILY_LABELS[item.family] || item.family}
                  <span
                    style={{
                      fontWeight: 400,
                      color: COLOR.textMuted,
                      marginLeft: "0.35rem",
                    }}
                  >
                    — {SKILL_LABELS[item.skill] || item.skill}
                  </span>
                </span>
                {/* Phase badge */}
                <span
                  style={{
                    background: item.phase === "review" ? "#dbeafe" : "#ede9fe",
                    color: item.phase === "review" ? "#1d4ed8" : COLOR.primary,
                    borderRadius: 999,
                    padding: "0.2rem 0.6rem",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {item.phase === "review" ? "repaso" : "aprendiendo"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Restart */}
        <button
          onClick={onRestart}
          style={{
            width: "100%",
            padding: "0.9rem",
            background: COLOR.primary,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Nueva sesión
        </button>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState("home");
  const [sessionData, setSessionData] = useState(null);
  const [summary, setSummary] = useState(null);

  async function handleStart(userName) {
    const res = await fetch(`${API}/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: userName }),
    });
    if (!res.ok) throw new Error("Error al iniciar sesión");
    const data = await res.json();
    setSessionData(data);
    setScreen("session");
  }

  async function handleComplete(sessionId) {
    const res = await fetch(`${API}/session/${sessionId}/summary`);
    if (!res.ok) throw new Error("Error al obtener resumen");
    const data = await res.json();
    setSummary(data);
    setScreen("summary");
  }

  if (screen === "home") return <HomeScreen onStart={handleStart} />;
  if (screen === "session")
    return (
      <SessionScreen
        sessionId={sessionData.session_id}
        userName={sessionData.user_name}
        exercises={sessionData.exercises}
        onComplete={handleComplete}
      />
    );
  if (screen === "summary")
    return (
      <SummaryScreen
        summary={summary}
        onRestart={() => {
          setScreen("home");
          setSessionData(null);
          setSummary(null);
        }}
      />
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
