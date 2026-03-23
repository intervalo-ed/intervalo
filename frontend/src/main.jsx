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

const SKIN_COLORS = ["#FDDBB4", "#D4956A", "#A0622A", "#5C3317"];
const HAIR_COLORS = ["#1C1C1C", "#5C3317", "#C8A450", "#B0A090"];

const KIMONO_OPTIONS = [
  { value: "cream",    swatch: "#F2E8D0" },
  { value: "charcoal", swatch: "#2A2A3A" },
  { value: "blue",     swatch: "#0F2244" },
  { value: "red",      swatch: "#8B1A1A" },
];

const BELTS = [
  { name: "Blanco",  color: "#F5F5DC", text: "#7A6A30", total: 21, stripeAt: [3, 9], promoteAt: 18   },
  { name: "Azul",    color: "#1C3A8B", text: "#fff",    total: 18, stripeAt: [2, 6], promoteAt: 15   },
  { name: "Violeta", color: "#6B2D8B", text: "#fff",    total: 18, stripeAt: [2, 6], promoteAt: 15   },
  { name: "Marrón",  color: "#6B3A1F", text: "#fff",    total: 15, stripeAt: [2, 5], promoteAt: 12   },
  { name: "Negro",   color: "#111111", text: "#fff",    total: null, stripeAt: [],   promoteAt: null  },
];

const SKILL_LABELS = {
  CLSF: "Clasificación",
  LEXI: "Léxico",
  FORM: "Formulación",
  GRAF: "Graficación",
  RESV: "Resolución",
  DERI: "Derivación",
  INTG: "Integración",
  APLI: "Aplicación",
};

const FAMILY_LABELS = {
  linear: "Lineal", quadratic: "Cuadrática", polynomial: "Polinomial",
  exponential: "Exponencial", logarithmic: "Logarítmica",
  trigonometric: "Trigonométrica", rational: "Racional",
};

// White belt: 7 function families × 3 skills = 21 items
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
// Rayas: 2 grados internos antes de la promoción
const STRIPE_THRESHOLDS  = [3, 9];   // ítems graduados para primera y segunda raya
const PROMOTION_THRESHOLD = 18;       // ítems graduados para ascender al siguiente cinturón
const MASTERY_TOTAL       = 21;       // total de ítems del cinturón (últimos 3 son maestría opcional)

// ── Design tokens ──────────────────────────────────────────────────────────────

const C = {
  bg: "#F7F8FA", card: "#FFFFFF", nav: "#0A0A14",
  primary: "#6366f1", success: "#16a34a", successBg: "#dcfce7",
  error: "#dc2626", errorBg: "#fee2e2",
  border: "#E5E7EB", text: "#111827", muted: "#6B7280",
  pill: "#EEF2FF", pillText: "#6366f1",
};
const card = {
  background: C.card, borderRadius: 20,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06)",
  padding: "1.75rem",
};
const inputStyle = {
  width: "100%", padding: "0.7rem 1rem",
  border: `1.5px solid ${C.border}`, borderRadius: 10,
  fontSize: "0.95rem", outline: "none", color: C.text,
  background: "#fff", boxSizing: "border-box",
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

// ── BJJAvatar — pixel art ─────────────────────────────────────────────────────
// 12 cols × 18 rows, PX=9 → viewBox "0 0 108 162"
// _ transparent · S skin · H hair · G gi · g gi-dark · B belt · b belt-dark

function BJJAvatar({ gender = "male", skin = "#FDDBB4", hair = "#1C1C1C", kimono = "charcoal" }) {
  const GI = {
    cream:    { gi: "#F2E8D0", giD: "#D4C8A8" },
    charcoal: { gi: "#2A2A3A", giD: "#16161F" },
    blue:     { gi: "#0F2244", giD: "#071530" },
    red:      { gi: "#8B1A1A", giD: "#5A0F0F" },
  };
  const { gi, giD } = GI[kimono] || GI.charcoal;
  const COLORS = { S: skin, H: hair, G: gi, g: giD, B: "#E8E0B0", b: "#A8986A" };
  const f = gender === "female";

  // 12 cols × 18 rows
  // arms (cols 1-2, 9-10) extend independently from torso (cols 4-7)
  const rows = [
    f ? '___________' : '___________', //  0 hair
    f ? '____HHH____' : '____HHH____', //  1 face
    f ? '___HSSSH___' : '___HSSSH___', //  2 face
    f ? '___HSSSH___' : '___HSSSH___', //  3 face
    f ? '___HSSSH___' : '___HSSSH___', //  4 chin
    f ? '___HSSSH___' : '____SSS____',                       //  5 neck
    f ? '__GHHGHHG__' : '__GGGGGGG__',                       //  6 collar
    f ? '_GGGHGHGGG_' : '_GGGGGGGGG_',                       //  7 shoulders wide
    '_GGgGGGgGG_',                       //  8 arms + narrow torso
    '_GGgGGGgGG_',                       //  9 arms + torso
    '_GGgGGGgGG_',                       // 10 belt (torso-width)
    '_GGBGGGBGG_',                       // 11 arms + lower torso
    '_SSGBBBGSS_',                       // 12 arms continue, torso ends
    '___GGgGG___',                       // 13 long arms
    '___GGgGG___',                       // 14 legs full
    '___GGgGG___',                       // 15 legs crossing
    '___GGgGG___',                       // 16 feet
    '__SSS_SSS__',                       // 17 feet detail
  ];

  const PX = 9;
  return (
    <svg viewBox="0 0 108 162" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%" }}>
      <ellipse cx="54" cy="158" rx="40" ry="4" fill="rgba(0,0,0,0.08)" />
      {rows.map((row, r) =>
        [...row].map((ch, c) => {
          const fill = COLORS[ch];
          if (!fill) return null;
          return <rect key={`${r}-${c}`} x={c * PX} y={r * PX}
            width={PX} height={PX} fill={fill} shapeRendering="crispEdges" />;
        })
      )}
    </svg>
  );
}

// ── IntervaLoLogo — pixel art ──────────────────────────────────────────────────
const LETTER_PIXELS = {
  I: [[1,1,1,1],[0,1,1,0],[0,1,1,0],[0,1,1,0],[1,1,1,1]],
  N: [[1,0,0,1],[1,1,0,1],[1,0,1,1],[1,0,0,1],[1,0,0,1]],
  T: [[1,1,1,1],[0,1,1,0],[0,1,1,0],[0,1,1,0],[0,1,1,0]],
  E: [[1,1,1,1],[1,0,0,0],[1,1,1,0],[1,0,0,0],[1,1,1,1]],
  R: [[1,1,1,0],[1,0,0,1],[1,1,1,0],[1,0,1,0],[1,0,0,1]],
  V: [[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0],[0,1,1,0]],
  A: [[0,1,1,0],[1,0,0,1],[1,1,1,1],[1,0,0,1],[1,0,0,1]],
  L: [[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,1,1,1]],
  O: [[0,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0]],
};
const BELT_STRIPE = ['#E0DDD0','#1C3A8B','#6B2D8B','#6B3A1F','#111111'];

function IntervaLoLogo({ px = 4 }) {
  const gap = Math.max(2, px - 1);
  const lw = 4 * px, lh = 5 * px;
  const word = ['I','N','T','E','R','V','A','L','O'];
  const totalW = word.length * lw + (word.length - 1) * gap;
  const beltY = lh + px;
  const beltH = px;
  const beltW = totalW / BELT_STRIPE.length;
  return (
    <svg viewBox={`0 0 ${totalW} ${beltY + beltH}`}
      style={{ height: lh + beltH + px, display: "block" }}>
      {word.map((ch, li) => {
        const ox = li * (lw + gap);
        return LETTER_PIXELS[ch].flatMap((row, r) =>
          row.map((on, c) => on
            ? <rect key={`${li}-${r}-${c}`} x={ox + c * px} y={r * px}
                width={px} height={px} fill="#CC1111" shapeRendering="crispEdges" />
            : null)
        );
      })}
      {BELT_STRIPE.map((col, i) => (
        <rect key={i} x={i * beltW} y={beltY} width={beltW} height={beltH} fill={col} />
      ))}
    </svg>
  );
}

// ── ColorSwatch ────────────────────────────────────────────────────────────────

function ColorSwatch({ color, selected, onClick, size = 28 }) {
  return (
    <button onClick={() => onClick(color)}
      style={{
        width: size, height: size, borderRadius: "50%", background: color,
        border: selected ? `2.5px solid ${C.primary}` : "2px solid rgba(0,0,0,0.12)",
        cursor: "pointer", outline: "none", flexShrink: 0,
        boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 4px ${C.primary}` : "none",
        transition: "all 0.15s",
      }} />
  );
}

// ── ToggleBtn ──────────────────────────────────────────────────────────────────

function ToggleBtn({ active, onClick, children, style = {} }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "0.45rem 0", borderRadius: 8, border: "none",
      background: active ? C.primary : C.bg,
      color: active ? "#fff" : C.muted,
      fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
      transition: "all 0.15s", ...style,
    }}>
      {children}
    </button>
  );
}

// ── FunctionPlot ───────────────────────────────────────────────────────────────

function FunctionPlot({ fnStr, view }) {
  const [xMin, xMax, yMin, yMax] = view;
  const W = 480, H = 280, PAD = 44;
  const pw = W - 2 * PAD, ph = H - 2 * PAD;
  const toX = x => PAD + ((x - xMin) / (xMax - xMin)) * pw;
  const toY = y => H - PAD - ((y - yMin) / (yMax - yMin)) * ph;

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
      style={{ width: "100%", borderRadius: 10, display: "block", background: "#F8FAFC" }}>
      {xTicks.map(x => <line key={`gx${x}`} x1={toX(x)} y1={PAD} x2={toX(x)} y2={H-PAD} stroke="#E2E8F0" strokeWidth="1" />)}
      {yTicks.map(y => <line key={`gy${y}`} x1={PAD} y1={toY(y)} x2={W-PAD} y2={toY(y)} stroke="#E2E8F0" strokeWidth="1" />)}
      <line x1={PAD} y1={ay} x2={W-PAD} y2={ay} stroke="#94A3B8" strokeWidth="1.5" />
      <line x1={ax} y1={PAD} x2={ax} y2={H-PAD} stroke="#94A3B8" strokeWidth="1.5" />
      <polygon points={`${W-PAD+1},${ay} ${W-PAD-7},${ay-4} ${W-PAD-7},${ay+4}`} fill="#94A3B8" />
      <polygon points={`${ax},${PAD-1} ${ax-4},${PAD+7} ${ax+4},${PAD+7}`} fill="#94A3B8" />
      {xTicks.map(x => (
        <g key={`tx${x}`}>
          <line x1={toX(x)} y1={ay-4} x2={toX(x)} y2={ay+4} stroke="#94A3B8" strokeWidth="1" />
          <text x={toX(x)} y={ay+15} textAnchor="middle" fontSize="11" fill="#94A3B8">{x}</text>
        </g>
      ))}
      {yTicks.map(y => (
        <g key={`ty${y}`}>
          <line x1={ax-4} y1={toY(y)} x2={ax+4} y2={toY(y)} stroke="#94A3B8" strokeWidth="1" />
          <text x={ax-8} y={toY(y)+4} textAnchor="end" fontSize="11" fill="#94A3B8">{y}</text>
        </g>
      ))}
      <clipPath id="plot-area"><rect x={PAD} y={PAD} width={pw} height={ph} /></clipPath>
      {segments.map((s, i) => (
        <polyline key={i} points={s.map(([x,y]) => `${x},${y}`).join(" ")}
          fill="none" stroke="#6366f1" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" clipPath="url(#plot-area)" />
      ))}
    </svg>
  );
}

// ── HomeScreen — two-step setup ────────────────────────────────────────────────

function HomeScreen({ onStart }) {
  const [step, setStep]       = useState(1);
  const [name, setName]       = useState("");
  const [gender, setGender]   = useState("male");
  const [skin, setSkin]       = useState(SKIN_COLORS[0]);
  const [hair, setHair]       = useState(HAIR_COLORS[0]);
  const [kimono, setKimono]   = useState("charcoal");
  const [uni, setUni]         = useState("");
  const [career, setCareer]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const step1Valid = name.trim().length > 0;
  const step2Valid = (uni || uni === "otra") && career;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!step2Valid) return;
    setLoading(true); setError(null);
    try {
      await onStart({ name: name.trim(), university: uni, career,
        avatar: { gender, skin, hair, kimono } });
    } catch {
      setError("No se pudo conectar con el servidor.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: C.nav, height: 52, display: "flex",
        alignItems: "center", justifyContent: "center" }}>
        <IntervaLoLogo px={4} />
      </nav>

      <div style={{ display: "flex", justifyContent: "center", padding: "2rem 1rem 3rem" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem",
            justifyContent: "center", marginBottom: "1.5rem" }}>
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: s <= step ? C.primary : C.border,
                  color: s <= step ? "#fff" : C.muted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.8rem", transition: "all 0.2s",
                }}>{s}</div>
                {s < 2 && <div style={{ width: 40, height: 2,
                  background: step >= 2 ? C.primary : C.border,
                  borderRadius: 999, transition: "all 0.3s" }} />}
              </React.Fragment>
            ))}
          </div>

          <div style={{ ...card }}>

            {/* ── STEP 1: Avatar + name ── */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: C.text,
                  margin: "0 0 1.5rem", textAlign: "center" }}>
                  Creá tu personaje
                </h2>

                {/* Avatar preview */}
                <div style={{ width: 140, height: 140, margin: "0 auto 1.5rem" }}>
                  <BJJAvatar gender={gender} skin={skin} hair={hair} kimono={kimono} />
                </div>

                {/* Controls */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                  {/* Gender */}
                  <div>
                    <div style={labelSt}>Género</div>
                    <div style={{ display: "flex", gap: "0.4rem",
                      background: C.bg, borderRadius: 10, padding: "0.3rem" }}>
                      <ToggleBtn active={gender === "male"} onClick={() => setGender("male")}>
                        Masculino
                      </ToggleBtn>
                      <ToggleBtn active={gender === "female"} onClick={() => setGender("female")}>
                        Femenino
                      </ToggleBtn>
                    </div>
                  </div>

                  {/* Piel · Pelo · Kimono — 3 columnas en una línea */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[
                      { label: "Color de piel", items: SKIN_COLORS,
                        isActive: c => skin === c, onPick: setSkin },
                      { label: "Color de pelo", items: HAIR_COLORS,
                        isActive: c => hair === c, onPick: setHair },
                      { label: "Kimono",
                        items: KIMONO_OPTIONS.map(k => k.swatch),
                        isActive: c => KIMONO_OPTIONS.find(k => k.swatch === c)?.value === kimono,
                        onPick: c => setKimono(KIMONO_OPTIONS.find(k => k.swatch === c)?.value) },
                    ].map(({ label, items, isActive, onPick }) => (
                      <div key={label} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ ...labelSt, textAlign: "center", marginBottom: "0.5rem" }}>
                          {label}
                        </div>
                        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center",
                          flexWrap: "wrap" }}>
                          {items.map(c => (
                            <ColorSwatch key={c} color={c} selected={isActive(c)} onClick={onPick} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Name */}
                  <div>
                    <label htmlFor="name" style={labelSt}>Tu nombre</label>
                    <input id="name" type="text" value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ej. Martín García"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = C.primary}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                </div>

                <button onClick={() => setStep(2)} disabled={!step1Valid}
                  style={{
                    width: "100%", marginTop: "1.5rem", padding: "0.85rem",
                    background: step1Valid ? C.primary : "#C7D2FE",
                    color: "#fff", border: "none", borderRadius: 12,
                    fontSize: "1rem", fontWeight: 700,
                    cursor: step1Valid ? "pointer" : "not-allowed",
                  }}>
                  Siguiente →
                </button>
              </div>
            )}

            {/* ── STEP 2: University + career ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                {/* Back + small avatar */}
                <div style={{ display: "flex", alignItems: "center",
                  gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ background: "none", border: "none", color: C.muted,
                      cursor: "pointer", fontSize: "0.9rem", padding: 0 }}>
                    ← Volver
                  </button>
                  <div style={{ flex: 1 }} />
                  <div style={{ width: 40, height: 40, borderRadius: "50%",
                    background: C.bg, overflow: "hidden", padding: 3 }}>
                    <BJJAvatar gender={gender} skin={skin} hair={hair} kimono={kimono} />
                  </div>
                  <span style={{ fontWeight: 600, color: C.text, fontSize: "0.9rem" }}>{name}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* University */}
                  <div>
                    <label style={labelSt}>¿En qué universidad estudiás?</label>
                    <select value={uni} onChange={e => setUni(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Seleccioná una opción</option>
                      {UNIVERSIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                      <option value="otra">Otra</option>
                    </select>
                  </div>

                  {/* Career */}
                  <div>
                    <div style={labelSt}>¿Qué tipo de carrera estudiás?</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
                      {CARRERAS.map(c => (
                        <button key={c.value} type="button"
                          onClick={() => setCareer(c.value)}
                          style={{
                            padding: "0.5rem 1rem", borderRadius: 10, border: "none",
                            background: career === c.value ? C.primary : C.bg,
                            color: career === c.value ? "#fff" : C.text,
                            fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                            transition: "all 0.15s",
                          }}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p style={{ color: C.error, background: C.errorBg,
                      borderRadius: 8, padding: "0.6rem 0.9rem",
                      fontSize: "0.875rem", margin: 0 }}>
                      {error}
                    </p>
                  )}

                  <button type="submit" disabled={loading || !step2Valid}
                    style={{
                      width: "100%", padding: "0.9rem",
                      background: loading || !step2Valid ? "#C7D2FE" : C.primary,
                      color: "#fff", border: "none", borderRadius: 12,
                      fontSize: "1rem", fontWeight: 700,
                      cursor: loading || !step2Valid ? "not-allowed" : "pointer",
                    }}>
                    {loading ? "Iniciando…" : "Comenzar clase →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SessionScreen ──────────────────────────────────────────────────────────────

function SessionScreen({ sessionId, userName, exercises, avatar, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const [result, setResult]         = useState(null);
  const [elapsed, setElapsed]       = useState(0);
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
  }

  async function handleNext() {
    if (currentIdx === exercises.length - 1) await onComplete(sessionId);
    else setCurrentIdx(i => i + 1);
  }

  const ex    = exercises[currentIdx];
  const total = exercises.length;
  const pct   = (currentIdx / total) * 100;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ background: C.nav, padding: "0 1.5rem", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <IntervaLoLogo px={4} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {avatar && (
            <div style={{ width: 32, height: 32, borderRadius: "50%",
              background: "#ffffff18", overflow: "hidden", padding: 2 }}>
              <BJJAvatar gender={avatar.gender} skin={avatar.skin}
                hair={avatar.hair} kimono={avatar.kimono} />
            </div>
          )}
          <span style={{ color: "#ffffff99", fontSize: "0.85rem" }}>{userName}</span>
        </div>
      </nav>

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
                const isCorrect  = i === ex.correct_index;
                const isSelected = i === selected;
                let bg = C.card, border = `1.5px solid ${C.border}`,
                  color = C.text, opacity = 1;
                if (answered) {
                  if (isCorrect)       { bg = C.successBg; border = `1.5px solid ${C.success}`; color = C.success; }
                  else if (isSelected) { bg = C.errorBg;   border = `1.5px solid ${C.error}`;   color = C.error; }
                  else                 { opacity = 0.4; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
                    style={{ width: "100%", padding: "0.8rem 1rem", background: bg,
                      border, borderRadius: 10, fontSize: "0.93rem", fontWeight: 500,
                      color, cursor: answered ? "default" : "pointer", textAlign: "left",
                      opacity, transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center",
                      justifyContent: "center", width: 24, height: 24, borderRadius: "50%",
                      flexShrink: 0, fontSize: "0.72rem", fontWeight: 700,
                      transition: "all 0.15s",
                      background: answered
                        ? isCorrect ? C.success : isSelected ? C.error : C.border
                        : C.border,
                      color: answered && (isCorrect || isSelected) ? "#fff" : C.muted }}>
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
                  marginBottom: "0.9rem",
                  background: result.correct ? C.successBg : C.errorBg,
                  color: result.correct ? C.success : C.error }}>
                  {result.correct ? "✓ " : "✗ "}
                  {ex.has_math ? <MathText text={result.feedback} /> : result.feedback}
                </p>
                <button onClick={handleNext}
                  style={{ width: "100%", padding: "0.85rem", background: C.primary,
                    color: "#fff", border: "none", borderRadius: 10,
                    fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>
                  {currentIdx === exercises.length - 1 ? "Ver resultados →" : "Siguiente →"}
                </button>
              </div>
            )}
          </div>

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

function SummaryScreen({ summary, avatar, onRestart }) {
  const { user_name, total, correct, incorrect, items, xp_earned = 0, level_info } = summary;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const scoreColor = pct >= 70 ? C.success : pct >= 40 ? "#D97706" : C.error;
  const scoreBg    = pct >= 70 ? C.successBg : pct >= 40 ? "#FEF3C7" : C.errorBg;

  // ── XP & belt progress ──────────────────────────────────────────────────────
  const xp = xp_earned;

  const skillStates = summary.skill_states || {};
  // Items exercised this session get a visual highlight in the grid
  const touchedKeys = new Set(items.map(it => `${it.topic ?? it.family}:${it.skill}`));

  // ── Belt stripe calculation — counts across the full belt, not just this session ──
  const graduatedCount = Object.values(skillStates)
    .filter(s => s?.phase === "review").length;
  const stripes  = STRIPE_THRESHOLDS.filter(t => graduatedCount >= t).length; // 0, 1 o 2
  const promoted = graduatedCount >= PROMOTION_THRESHOLD;

  // ── Item color by maturity ────────────────────────────────────────────────
  function itemCell(entry) {
    if (!entry) return { bg: "#E5E7EB", label: "—", textColor: "#9CA3AF" };

    if (entry.phase === "review") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const diff  = entry.next_review
        ? Math.round((new Date(entry.next_review + "T00:00:00") - today) / 86400000)
        : 999;
      if (diff <= 0)  return { bg: "#FCD34D", label: "Hoy",        textColor: "#78350F" };
      if (diff <= 2)  return { bg: "#86EFAC", label: `${diff}d`,   textColor: "#14532D" };
      if (diff <= 6)  return { bg: "#4ADE80", label: `${diff}d`,   textColor: "#14532D" };
      if (diff <= 13) return { bg: "#22C55E", label: `${diff}d`,   textColor: "#fff" };
      if (diff <= 20) return { bg: "#16A34A", label: `${diff}d`,   textColor: "#fff" };
      return                  { bg: "#15803D", label: `${diff}d`,  textColor: "#fff" };
    }

    // Learning phase
    const si = entry.step_index || 0;
    const learningBg = ["#D1FAE5", "#A7F3D0", "#6EE7B7"][si] || "#D1FAE5";
    return { bg: learningBg, label: `${si + 1}/3`, textColor: "#065F46" };
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ background: C.nav, height: 52, display: "flex",
        alignItems: "center", justifyContent: "center" }}>
        <IntervaLoLogo px={4} />
      </nav>

      <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 1rem 3rem" }}>
        <div style={{ width: "100%", maxWidth: 540 }}>

          {/* Header card */}
          <div style={{ ...card, marginBottom: "1rem", textAlign: "center" }}>
            {avatar && (
              <div style={{ width: 100, height: 100, margin: "0 auto 0.75rem" }}>
                <BJJAvatar gender={avatar.gender} skin={avatar.skin}
                  hair={avatar.hair} kimono={avatar.kimono} />
              </div>
            )}
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: C.text, margin: "0 0 0.25rem" }}>
              ¡Clase completada!
            </h2>
            <p style={{ color: C.muted, margin: "0 0 1.25rem" }}>{user_name}</p>

            {/* Score circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", width: 106, height: 106, borderRadius: "50%",
              background: scoreBg, border: `4px solid ${scoreColor}`,
              margin: "0 auto 1.1rem" }}>
              <span style={{ fontSize: "1.7rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                {correct}/{total}
              </span>
              <span style={{ fontSize: "0.75rem", color: scoreColor, fontWeight: 600 }}>{pct}%</span>
            </div>

            <div style={{ width: "100%", height: 7, background: C.border,
              borderRadius: 999, overflow: "hidden", marginBottom: "1rem" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: scoreColor,
                borderRadius: 999, transition: "width 0.6s ease" }} />
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <div style={{ background: C.successBg, borderRadius: 10,
                padding: "0.5rem 1.1rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: C.success }}>{correct}</div>
                <div style={{ fontSize: "0.72rem", color: C.success }}>Correctas</div>
              </div>
              <div style={{ background: C.errorBg, borderRadius: 10,
                padding: "0.5rem 1.1rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: C.error }}>{incorrect}</div>
                <div style={{ fontSize: "0.72rem", color: C.error }}>Incorrectas</div>
              </div>
            </div>
          </div>

          {/* XP + Level card */}
          <div style={{ ...card, marginBottom: "1rem" }}>
            {/* XP earned row */}
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Experiencia ganada
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: C.primary, lineHeight: 1.1 }}>
                  +{xp} XP
                </div>
              </div>
              <div style={{ fontSize: "2rem" }}>⚡</div>
            </div>

            {/* Level progress bar */}
            {level_info && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", marginBottom: "0.4rem" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.text }}>
                    Nivel {level_info.level}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: C.muted }}>
                    {level_info.xp_in_level} / {level_info.xp_required} XP
                  </div>
                </div>
                <div style={{ width: "100%", height: 10, background: C.border,
                  borderRadius: 999, overflow: "hidden" }}>
                  <div style={{
                    width: `${Math.min(level_info.progress_pct, 100)}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${C.primary}, #7C3AED)`,
                    borderRadius: 999,
                    transition: "width 0.8s ease",
                  }} />
                </div>
                <div style={{ fontSize: "0.68rem", color: C.muted, marginTop: "0.35rem",
                  textAlign: "right" }}>
                  {level_info.xp_missing > 0
                    ? `Faltan ${level_info.xp_missing} XP para el nivel ${level_info.level + 1}`
                    : `¡Nivel ${level_info.level} completado!`}
                </div>
              </div>
            )}
          </div>

          {/* Belt + topic progress card */}
          <div style={{ ...card, marginBottom: "1rem" }}>

            {/* Belt stripe header */}
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
                      background: i < stripes ? "#D97706" : "#E5E7EB",
                      border: i < stripes ? "none" : "1px solid #D1D5DB",
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

            {/* Topic × Skill grid */}
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
                  gridTemplateColumns: "1fr 52px 52px 52px", gap: "3px",
                  alignItems: "center" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text,
                    paddingLeft: "4px" }}>
                    {label}
                  </div>
                  {WHITE_BELT_SKILLS.map(skill => {
                    const k = `${topicKey}:${skill}`;
                    const entry = skillStates[k];
                    const wasTouched = touchedKeys.has(k);
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
                { bg: "#E5E7EB", label: "Sin iniciar", textColor: "#9CA3AF" },
                { bg: "#D1FAE5", label: "Aprendiendo", textColor: "#065F46" },
                { bg: "#FCD34D", label: "Repasar hoy", textColor: "#78350F" },
                { bg: "#22C55E", label: "En progreso", textColor: "#fff" },
                { bg: "#15803D", label: "Maduro",      textColor: "#fff" },
              ].map(({ bg, label: ll, textColor }) => (
                <div key={ll} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: bg,
                    border: bg === "#E5E7EB" ? "1px solid #D1D5DB" : "none" }} />
                  <span style={{ fontSize: "0.65rem", color: C.muted }}>{ll}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Items detail */}
          <div style={{ ...card, marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.text,
              margin: "0 0 0.85rem" }}>
              Detalle por ejercicio
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.5rem 0.7rem", borderRadius: 8,
                  background: item.correct ? "#F0FDF4" : "#FFF5F5" }}>
                  <span style={{ color: item.correct ? C.success : C.error, flexShrink: 0 }}>
                    {item.correct ? "✓" : "✗"}
                  </span>
                  <span style={{ fontWeight: 600, color: C.text, fontSize: "0.85rem", flex: 1 }}>
                    {FAMILY_LABELS[item.topic ?? item.family] || item.topic || item.family}
                    <span style={{ fontWeight: 400, color: C.muted, marginLeft: "0.3rem" }}>
                      — {SKILL_LABELS[item.skill] || item.skill}
                    </span>
                  </span>
                  <span style={{ background: item.phase === "review" ? "#DBEAFE" : C.pill,
                    color: item.phase === "review" ? "#1D4ED8" : C.pillText,
                    borderRadius: 999, padding: "0.15rem 0.5rem",
                    fontSize: "0.68rem", fontWeight: 600, flexShrink: 0 }}>
                    {item.phase === "review" ? "repaso" : "aprendiendo"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={onRestart}
            style={{ width: "100%", padding: "0.9rem", background: C.primary,
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>
            Nueva clase
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

function App() {
  const [screen, setScreen]   = useState("home");
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [avatar, setAvatar]   = useState(null);

  async function handleStart({ name, university, career, avatar: av }) {
    const res = await fetch(`${API}/session/start`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: name }),
    });
    if (!res.ok) throw new Error("Error al iniciar sesión");
    setSession(await res.json());
    setAvatar(av);
    setScreen("session");
  }

  async function handleComplete(sessionId) {
    const res = await fetch(`${API}/session/${sessionId}/summary`);
    if (!res.ok) throw new Error("Error al obtener resumen");
    setSummary(await res.json());
    setScreen("summary");
  }

  if (screen === "home")
    return <HomeScreen onStart={handleStart} />;
  if (screen === "session")
    return <SessionScreen sessionId={session.session_id} userName={session.user_name}
      exercises={session.exercises} avatar={avatar} onComplete={handleComplete} />;
  if (screen === "summary")
    return <SummaryScreen summary={summary} avatar={avatar}
      onRestart={() => { setScreen("home"); setSession(null); setSummary(null); setAvatar(null); }} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
