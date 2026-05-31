import React, { useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api.js";
import {
  C, fonts, card, inputStyle, labelStyle,
  BELT_COLORS, BELT_LABELS, SKILL_LABELS, topicLabel,
} from "./theme.js";
import { MathText, ExplanationText } from "./components/Math.jsx";
import ExerciseForm from "./components/ExerciseForm.jsx";

const BELT_ORDER = ["white", "blue", "violet", "brown", "black"];
const beltColor = (key) => BELT_COLORS[BELT_ORDER.indexOf(key)] || C.muted;

// ── Botones ───────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", disabled, style }) {
  const base = {
    border: "none", borderRadius: 9, padding: "0.55rem 0.95rem",
    fontSize: "0.85rem", fontWeight: 600, cursor: disabled ? "default" : "pointer",
    fontFamily: fonts.body, opacity: disabled ? 0.5 : 1, transition: "background 0.15s",
  };
  const variants = {
    primary: { background: C.primary, color: "#fff" },
    ghost: { background: "transparent", color: C.textSecondary, border: `1px solid ${C.border}` },
    danger: { background: C.errorBg, color: C.error },
    soft: { background: C.primarySoft, color: C.pillText },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Toast({ msg, kind }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 100,
      background: kind === "error" ? C.error : C.text, color: "#fff",
      padding: "0.7rem 1.1rem", borderRadius: 10, fontSize: "0.85rem",
      boxShadow: "0 6px 24px rgba(0,0,0,0.2)", maxWidth: 420,
    }}>
      {msg}
    </div>
  );
}

// ── Sidebar (árbol Curso → Belt → Topic → Skill) ───────────────────────────
function Sidebar({ catalog, counts, selected, onSelect, onExpandTopic, onHome }) {
  const [openBelts, setOpenBelts] = useState(() => new Set(["white"]));
  const [openTopics, setOpenTopics] = useState(() => new Set());

  const toggleBelt = (k) =>
    setOpenBelts((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  const toggleTopic = (belt, topic) => {
    const key = `${belt}/${topic}`;
    setOpenTopics((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else {
        n.add(key);
        onExpandTopic(belt, topic);
      }
      return n;
    });
  };

  return (
    <aside style={{
      width: 290, flexShrink: 0, background: C.bgCard, borderRight: `1px solid ${C.border}`,
      height: "100vh", overflowY: "auto", padding: "1rem 0.5rem",
    }}>
      <div style={{ padding: "0.25rem 0.75rem 1rem", cursor: "pointer" }} onClick={onHome} title="Ir al dashboard">
        <div style={{ fontFamily: fonts.heading, fontSize: "1.25rem", fontWeight: 700 }}>intervalo</div>
        <div style={{ display: "flex", height: 3, width: 90, borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
          {BELT_COLORS.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
        </div>
        <div style={{ fontSize: "0.7rem", color: C.muted, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Content Studio
        </div>
      </div>

      {catalog.belts.map((belt) => (
        <div key={belt.key}>
          <Row indent={0} onClick={() => toggleBelt(belt.key)} bold>
            <Caret open={openBelts.has(belt.key)} />
            <span style={{ width: 10, height: 10, borderRadius: 3, background: beltColor(belt.key), border: belt.key === "white" ? `1px solid ${C.borderStrong}` : "none" }} />
            {BELT_LABELS[belt.key] || belt.key}
          </Row>
          {openBelts.has(belt.key) &&
            belt.topics.map((topic) => {
              const tkey = `${belt.key}/${topic.key}`;
              const topicCounts = counts[tkey];
              const total = topicCounts ? Object.values(topicCounts).reduce((a, b) => a + b, 0) : null;
              return (
                <div key={topic.key}>
                  <Row indent={1} onClick={() => toggleTopic(belt.key, topic.key)}>
                    <Caret open={openTopics.has(tkey)} />
                    <span style={{ flex: 1 }}>{topicLabel(topic.key)}</span>
                    {total != null && <Badge>{total}</Badge>}
                  </Row>
                  {openTopics.has(tkey) &&
                    topic.skills.map((skill) => {
                      const isSel =
                        selected.belt === belt.key && selected.topic === topic.key && selected.skill === skill;
                      const n = topicCounts ? topicCounts[skill] || 0 : null;
                      return (
                        <Row
                          key={skill}
                          indent={2}
                          active={isSel}
                          onClick={() => onSelect(belt.key, topic.key, skill)}
                        >
                          <span style={{ flex: 1, fontSize: "0.84rem" }}>{SKILL_LABELS[skill] || skill}</span>
                          {n != null && <Badge dim={n === 0}>{n}</Badge>}
                        </Row>
                      );
                    })}
                </div>
              );
            })}
        </div>
      ))}
    </aside>
  );
}

function Row({ children, indent, onClick, active, bold }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer",
        padding: "0.4rem 0.75rem", paddingLeft: 0.75 + indent * 1 + "rem",
        borderRadius: 8, fontSize: "0.86rem", fontWeight: bold ? 700 : 500,
        background: active ? C.primarySoft : "transparent",
        color: active ? C.pillText : C.text,
      }}
    >
      {children}
    </div>
  );
}
function Caret({ open }) {
  return <span style={{ fontSize: "0.6rem", color: C.muted, width: 10 }}>{open ? "▼" : "▶"}</span>;
}
function Badge({ children, dim }) {
  return (
    <span style={{
      fontSize: "0.7rem", fontWeight: 600, padding: "0.05rem 0.4rem", borderRadius: 999,
      background: dim ? C.bgElevated : C.primarySoft, color: dim ? C.muted : C.pillText,
    }}>{children}</span>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
const KPIS = [
  { key: "coverage", label: "Cobertura (cantidad)" },
  { key: "reviewed", label: "% Revisado" },
  { key: "graph", label: "% Gráfico" },
  { key: "explanation", label: "% Con explicación" },
];

// ratio 0..1 → rojo→ámbar→verde (para fondo claro). null → celda vacía.
function heatColor(ratio) {
  if (ratio == null) return C.bgElevated;
  const r = Math.max(0, Math.min(1, ratio));
  let c1, c2, t;
  if (r < 0.5) { c1 = [224, 72, 76]; c2 = [240, 180, 60]; t = r / 0.5; }
  else { c1 = [240, 180, 60]; c2 = [31, 168, 90]; t = (r - 0.5) / 0.5; }
  const m = c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
  return `rgba(${m[0]},${m[1]},${m[2]},0.9)`;
}

function cellMetric(cell, kpi, target) {
  if (!cell || cell.count === 0) {
    return kpi === "coverage" ? { ratio: 0, label: "0" } : { ratio: null, label: "—" };
  }
  if (kpi === "coverage") return { ratio: Math.min(cell.count / target, 1), label: String(cell.count) };
  const num = kpi === "reviewed" ? cell.reviewed : kpi === "graph" ? cell.graph : cell.with_explanation;
  const pct = num / cell.count;
  return { ratio: pct, label: Math.round(pct * 100) + "%" };
}

function KpiCard({ label, value, sub }) {
  return (
    <div style={{ ...card, padding: "0.9rem 1.1rem", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: "0.72rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: "0.2rem" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.78rem", color: C.textSecondary, marginTop: "0.1rem" }}>{sub}</div>}
    </div>
  );
}

function Dashboard({ catalog, stats, onSelectCell }) {
  const [heatmap, setHeatmap] = useState(false);
  const [kpi, setKpi] = useState("coverage");
  const [target, setTarget] = useState(5);

  if (!stats) {
    return <main style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", padding: "1.5rem 2rem" }}>
      <div style={{ color: C.muted }}>Cargando métricas…</div>
    </main>;
  }

  const t = stats.totals;
  const cells = stats.cells;
  const pct = (num, den) => (den ? Math.round((num / den) * 100) + "%" : "—");
  const itemsCovered = Object.values(cells).filter((c) => c.count >= target).length;

  return (
    <main style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", padding: "1.5rem 2rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.5rem" }}>Dashboard de contenido</h2>
        <span style={{ fontSize: "0.8rem", color: C.muted }}>{t.count} ejercicios · {t.items} items</span>
      </div>

      {/* KPI cards */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <KpiCard label="Ejercicios" value={t.count} sub={`en ${t.items} items`} />
        <KpiCard label="Revisados" value={pct(t.reviewed, t.count)} sub={`${t.reviewed} / ${t.count}`} />
        <KpiCard label="Cobertura" value={pct(itemsCovered, t.items)} sub={`${itemsCovered} / ${t.items} items ≥ ${target}`} />
        <KpiCard label="Gráficos" value={pct(t.graph, t.count)} sub={`${t.graph} de ${t.count}`} />
        <KpiCard label="Con explicación" value={pct(t.with_explanation, t.count)} sub={`${t.with_explanation} de ${t.count}`} />
      </div>

      {/* Controles */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.88rem", fontWeight: 600 }}>
          <input type="checkbox" checked={heatmap} onChange={(e) => setHeatmap(e.target.checked)} style={{ accentColor: C.primary }} />
          Heatmap
        </label>
        <select
          value={kpi}
          onChange={(e) => setKpi(e.target.value)}
          disabled={!heatmap}
          style={{ ...inputStyle, width: "auto", opacity: heatmap ? 1 : 0.5 }}
        >
          {KPIS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.85rem", color: C.textSecondary }}>
          Objetivo / item
          <input
            type="number" min={1}
            value={target}
            onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 1))}
            style={{ ...inputStyle, width: 64, padding: "0.35rem 0.5rem" }}
          />
        </label>
        {heatmap && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginLeft: "auto" }}>
            <span style={{ fontSize: "0.72rem", color: C.muted }}>menos</span>
            <div style={{ width: 120, height: 10, borderRadius: 5, background: "linear-gradient(90deg, rgba(224,72,76,0.9), rgba(240,180,60,0.9), rgba(31,168,90,0.9))" }} />
            <span style={{ fontSize: "0.72rem", color: C.muted }}>más</span>
          </div>
        )}
      </div>

      {/* Grilla por cinturón */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {catalog.belts.map((belt) => {
          const br = stats.belts[belt.key] || {};
          return (
            <div key={belt.key} style={{ ...card, padding: "1rem 1.1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: beltColor(belt.key), border: belt.key === "white" ? `1px solid ${C.borderStrong}` : "none" }} />
                <strong style={{ fontSize: "0.98rem" }}>{BELT_LABELS[belt.key] || belt.key}</strong>
                <span style={{ fontSize: "0.78rem", color: C.muted }}>
                  {br.count || 0} ejercicios · {pct(br.reviewed || 0, br.count || 0)} revisado
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {belt.topics.map((topic) => {
                  const colTemplate = `minmax(120px, 1fr) ${topic.skills.map(() => "44px").join(" ")}`;
                  return (
                    <div key={topic.key} style={{ display: "grid", gridTemplateColumns: colTemplate, gap: "3px", alignItems: "center" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.textSecondary, paddingLeft: "4px" }}>
                        {topicLabel(topic.key)}
                      </div>
                      {topic.skills.map((skill) => {
                        const cell = cells[`${belt.key}/${topic.key}/${skill}`];
                        const m = cellMetric(cell, kpi, target);
                        const count = cell ? cell.count : 0;
                        const bg = heatmap ? heatColor(m.ratio) : (count === 0 ? C.bgElevated : C.primarySoft);
                        const fg = heatmap ? (m.ratio == null ? C.muted : "#fff") : (count === 0 ? C.muted : C.pillText);
                        return (
                          <div
                            key={skill}
                            title={`${SKILL_LABELS[skill] || skill} · ${count} ejercicios`}
                            onClick={() => onSelectCell(belt.key, topic.key, skill)}
                            style={{
                              background: bg, color: fg, borderRadius: 6, height: 30,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
                              transition: "background 0.2s",
                            }}
                          >
                            {heatmap ? m.label : count}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

// ── Panel principal ─────────────────────────────────────────────────────────
function MainPanel({
  catalog, selected, exercises, tooltip, draft,
  onNew, onAI, onEdit, onDuplicate, onDelete, onToggleReviewed, onSaveDraft, onCancelDraft, onDraftChange,
  onSaveTooltip, busy,
}) {
  const [tipDraft, setTipDraft] = useState(tooltip);
  const [editTip, setEditTip] = useState(false);
  useEffect(() => { setTipDraft(tooltip); setEditTip(false); }, [tooltip, selected.belt, selected.topic]);

  if (!selected.skill) {
    return (
      <Empty>
        <h2 style={{ fontFamily: fonts.body, fontWeight: 700, marginBottom: "0.5rem" }}>Content Studio</h2>
        <p style={{ color: C.textSecondary, maxWidth: 420 }}>
          Elegí una habilidad en el árbol de la izquierda para ver y editar sus ejercicios,
          o generá nuevos con IA. El humano es el director creativo: la IA propone y vos aprobás.
        </p>
      </Empty>
    );
  }

  const skillExercises = exercises.filter((e) => e.skill === selected.skill);
  const beltObj = catalog.belts.find((b) => b.key === selected.belt);
  const topicObj = beltObj?.topics.find((t) => t.key === selected.topic);
  const validSkills = topicObj?.skills || [];

  return (
    <main style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", padding: "1.5rem 2rem" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: C.muted, marginBottom: "0.4rem" }}>
        <span style={{ color: beltColor(selected.belt) === "#E0DDD0" ? C.text : beltColor(selected.belt), fontWeight: 600 }}>
          {BELT_LABELS[selected.belt]}
        </span>
        <span>/</span>
        <span>{topicLabel(selected.topic)}</span>
        <span>/</span>
        <span style={{ color: C.textSecondary }}>{SKILL_LABELS[selected.skill] || selected.skill}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: "1.5rem" }}>
          {topicLabel(selected.topic)}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Btn onClick={onAI} disabled={!!draft}>+ Nuevo ejercicio</Btn>
        </div>
      </div>

      {/* Tooltip del tema */}
      <div style={{ ...card, padding: "1rem 1.1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editTip ? "0.6rem" : 0 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Tooltip del tema</label>
          {!editTip ? (
            <Btn variant="ghost" onClick={() => setEditTip(true)} style={{ padding: "0.3rem 0.7rem" }}>Editar</Btn>
          ) : (
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <Btn variant="ghost" onClick={() => { setTipDraft(tooltip); setEditTip(false); }} style={{ padding: "0.3rem 0.7rem" }}>Cancelar</Btn>
              <Btn onClick={() => { onSaveTooltip(tipDraft); setEditTip(false); }} style={{ padding: "0.3rem 0.7rem" }}>Guardar</Btn>
            </div>
          )}
        </div>
        {editTip ? (
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: "vertical", fontFamily: fonts.mono, fontSize: "0.8rem" }}
            value={tipDraft}
            onChange={(e) => setTipDraft(e.target.value)}
          />
        ) : (
          <div style={{ fontSize: "0.88rem", color: C.textSecondary }}>
            <ExplanationText text={tooltip} />
          </div>
        )}
      </div>

      {/* Editor de draft (manual o IA) */}
      {draft && (
        <div style={{ ...card, padding: "1.25rem", marginBottom: "1.5rem", borderColor: C.primary }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <strong style={{ fontSize: "0.95rem" }}>
              {draft.source === "ai" ? "✨ Propuesta de IA — revisá y aprobá" : draft.originIndex == null ? "Nuevo ejercicio" : "Editando ejercicio"}
            </strong>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Btn variant="ghost" onClick={onCancelDraft}>Cancelar</Btn>
              <Btn onClick={onSaveDraft} disabled={busy}>
                {draft.source === "ai" ? "Aprobar y guardar" : "Guardar"}
              </Btn>
            </div>
          </div>
          <ExerciseForm value={draft.exercise} skills={validSkills} onChange={onDraftChange} />
        </div>
      )}

      {/* Lista de ejercicios */}
      <div style={{ fontSize: "0.78rem", color: C.muted, marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {skillExercises.length} ejercicio{skillExercises.length === 1 ? "" : "s"} en {SKILL_LABELS[selected.skill] || selected.skill}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {skillExercises.map((ex) => {
          const realIndex = exercises.indexOf(ex);
          return (
            <div key={ex.external_id} style={{ ...card, padding: "0.9rem 1.1rem", borderLeft: `3px solid ${ex.reviewed ? C.success : C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.7rem", color: C.muted, fontFamily: fonts.mono, marginBottom: "0.3rem" }}>
                    {ex.external_id} · {ex.subtype}
                  </div>
                  <div style={{ fontSize: "0.95rem" }}><MathText text={ex.question} /></div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem", alignItems: "flex-start" }}>
                  <button
                    onClick={() => onToggleReviewed(realIndex)}
                    disabled={!!draft || busy}
                    title={ex.reviewed ? "Marcar como no revisado" : "Marcar como revisado"}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.3rem", cursor: draft ? "default" : "pointer",
                      border: `1px solid ${ex.reviewed ? C.success : C.border}`,
                      background: ex.reviewed ? C.successBg : "transparent",
                      color: ex.reviewed ? C.success : C.muted,
                      borderRadius: 9, padding: "0.35rem 0.6rem", fontSize: "0.8rem", fontWeight: 600,
                      fontFamily: fonts.body,
                    }}
                  >
                    Revisado
                  </button>
                  <Btn variant="ghost" onClick={() => onEdit(realIndex)} disabled={!!draft} style={{ padding: "0.35rem 0.6rem" }}>Editar</Btn>
                  <Btn variant="ghost" onClick={() => onDuplicate(realIndex)} disabled={!!draft} style={{ padding: "0.35rem 0.6rem" }}>Duplicar</Btn>
                  <Btn variant="danger" onClick={() => onDelete(realIndex)} disabled={!!draft} style={{ padding: "0.35rem 0.6rem" }}>Borrar</Btn>
                </div>
              </div>
            </div>
          );
        })}
        {skillExercises.length === 0 && !draft && (
          <div style={{ color: C.muted, fontSize: "0.9rem", padding: "1rem 0" }}>
            No hay ejercicios para esta habilidad todavía. Creá uno o generalo con IA.
          </div>
        )}
      </div>
    </main>
  );
}

function Empty({ children }) {
  return (
    <main style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "2rem" }}>
      {children}
    </main>
  );
}

// ── Modal IA ──────────────────────────────────────────────────────────────
function AIModal({ selected, onClose, onGenerate, onBlank, busy }) {
  const [prompt, setPrompt] = useState("");
  const [subtype, setSubtype] = useState("text");
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(19,19,36,0.35)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }} onClick={onClose}>
      <div style={{ ...card, padding: "1.5rem", width: 540, maxWidth: "100%" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: fonts.body, fontWeight: 700, marginBottom: "0.3rem" }}>Nuevo ejercicio con IA</h3>
        <p style={{ fontSize: "0.82rem", color: C.muted, marginBottom: "1rem" }}>
          {BELT_LABELS[selected.belt]} · {topicLabel(selected.topic)} · {SKILL_LABELS[selected.skill] || selected.skill}
        </p>
        <label style={labelStyle}>Subtipo</label>
        <select style={{ ...inputStyle, marginBottom: "0.8rem" }} value={subtype} onChange={(e) => setSubtype(e.target.value)}>
          <option value="text">Texto</option>
          <option value="graph">Gráfico</option>
        </select>
        <label style={labelStyle}>Instrucción</label>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
          placeholder="Ej: creá un ejercicio sobre identificar la pendiente a partir del gráfico de una recta"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          autoFocus
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <button
            onClick={onBlank}
            disabled={busy}
            style={{ background: "none", border: "none", color: C.muted, fontSize: "0.8rem", cursor: busy ? "default" : "pointer", textDecoration: "underline", fontFamily: fonts.body, padding: 0 }}
          >
            o empezá en blanco
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn onClick={() => onGenerate(prompt, subtype)} disabled={busy || !prompt.trim()}>
              {busy ? "Generando…" : "Generar propuesta"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────
function App() {
  const [catalog, setCatalog] = useState(null);
  const [selected, setSelected] = useState({ belt: null, topic: null, skill: null });
  const [cache, setCache] = useState({}); // "belt/topic" -> exercises[]
  const [draft, setDraft] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const flash = (msg, kind = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };
  const fail = (e) => flash(e.message || String(e), "error");

  const refreshStats = () => api.getStats().then(setStats).catch((e) => console.error(e));

  useEffect(() => {
    api.getCatalog().then(setCatalog).catch((e) => setError(e.message));
    refreshStats();
  }, []);

  // Refrescar métricas cada vez que se vuelve al dashboard (sin item seleccionado).
  useEffect(() => {
    if (!selected.skill) refreshStats();
  }, [selected.skill]);

  const tkey = selected.belt && selected.topic ? `${selected.belt}/${selected.topic}` : null;
  const exercises = tkey ? cache[tkey] || [] : [];

  // Conteos por skill para el árbol.
  const counts = useMemo(() => {
    const out = {};
    for (const key of Object.keys(cache)) {
      const byskill = {};
      for (const e of cache[key]) byskill[e.skill] = (byskill[e.skill] || 0) + 1;
      out[key] = byskill;
    }
    return out;
  }, [cache]);

  const tooltip = useMemo(() => {
    if (!catalog || !selected.topic) return "";
    const b = catalog.belts.find((x) => x.key === selected.belt);
    const t = b?.topics.find((x) => x.key === selected.topic);
    return t?.tooltip || "";
  }, [catalog, selected]);

  const loadTopic = async (belt, topic) => {
    const key = `${belt}/${topic}`;
    if (cache[key]) return cache[key];
    try {
      const ex = await api.getExercises(belt, topic);
      setCache((c) => ({ ...c, [key]: ex }));
      return ex;
    } catch (e) {
      fail(e);
      return [];
    }
  };

  const select = async (belt, topic, skill) => {
    if (draft && !confirm("Tenés cambios sin guardar. ¿Descartar?")) return;
    setDraft(null);
    await loadTopic(belt, topic);
    setSelected({ belt, topic, skill });
  };

  const persist = async (nextList) => {
    setBusy(true);
    try {
      const res = await api.saveExercises(selected.belt, selected.topic, nextList);
      setCache((c) => ({ ...c, [tkey]: res.exercises }));
      flash("Guardado");
      return true;
    } catch (e) {
      fail(e);
      return false;
    } finally {
      setBusy(false);
    }
  };

  // ── Acciones de ejercicios ──
  const startNew = async () => {
    const skill = selected.skill;
    let external_id = `${selected.belt}_${selected.topic}_${skill.toLowerCase()}_NN`;
    try {
      const r = await api.nextId(selected.belt, selected.topic, skill);
      external_id = r.external_id;
    } catch (e) { /* fallback al placeholder */ }
    setDraft({
      originIndex: null,
      source: "manual",
      exercise: {
        external_id, belt: selected.belt, topic: selected.topic, skill,
        subtype: "text", question: "", options: ["", "", "", ""], correct_index: 0,
        has_math: true, feedback_correct: "", feedback_incorrect: "",
        graph_fn: null, graph_view: null, explanation: "", reviewed: false,
      },
    });
  };

  const startEdit = (index) => {
    setDraft({ originIndex: index, source: "manual", exercise: structuredClone(exercises[index]) });
  };

  const duplicate = async (index) => {
    const copy = structuredClone(exercises[index]);
    try {
      const r = await api.nextId(selected.belt, selected.topic, copy.skill);
      copy.external_id = r.external_id;
    } catch (e) { copy.external_id = copy.external_id + "_copy"; }
    setDraft({ originIndex: null, source: "manual", exercise: copy });
  };

  const remove = async (index) => {
    if (!confirm(`¿Borrar ${exercises[index].external_id}?`)) return;
    const next = exercises.filter((_, i) => i !== index);
    await persist(next);
  };

  const toggleReviewed = async (index) => {
    const next = exercises.map((e, i) =>
      i === index ? { ...e, reviewed: !e.reviewed } : e
    );
    await persist(next);
  };

  const saveDraft = async () => {
    const ex = draft.exercise;
    let next;
    if (draft.originIndex == null) next = [...exercises, ex];
    else next = exercises.map((e, i) => (i === draft.originIndex ? ex : e));
    const ok = await persist(next);
    if (ok) {
      setDraft(null);
      setSelected((s) => ({ ...s, skill: ex.skill }));
    }
  };

  // ── IA ──
  const generate = async (prompt, subtype) => {
    setBusy(true);
    try {
      const r = await api.aiGenerate({
        belt: selected.belt, topic: selected.topic, skill: selected.skill,
        prompt, subtype, mode: "create",
      });
      setAiOpen(false);
      setDraft({ originIndex: null, source: "ai", exercise: { reviewed: false, ...r.exercise } });
      flash("Propuesta lista — revisá y aprobá");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: "3rem", fontFamily: fonts.body }}>
        <h2 style={{ color: C.error }}>No se pudo conectar al server</h2>
        <p style={{ color: C.textSecondary }}>{error}</p>
        <p style={{ color: C.muted, fontSize: "0.85rem", marginTop: "1rem" }}>
          Levantá el server: <code style={{ fontFamily: fonts.mono }}>cd studio/server && uvicorn app:app --port 8077</code>
        </p>
      </div>
    );
  }
  if (!catalog) return <div style={{ padding: "3rem", color: C.muted }}>Cargando catálogo…</div>;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        catalog={catalog}
        counts={counts}
        selected={selected}
        onSelect={select}
        onExpandTopic={loadTopic}
        onHome={() => { setDraft(null); setSelected({ belt: null, topic: null, skill: null }); }}
      />
      {!selected.skill ? (
        <Dashboard catalog={catalog} stats={stats} onSelectCell={select} />
      ) : (
        <MainPanel
          catalog={catalog}
          selected={selected}
          exercises={exercises}
          tooltip={tooltip}
          draft={draft}
          busy={busy}
          onNew={startNew}
          onAI={() => setAiOpen(true)}
          onEdit={startEdit}
          onDuplicate={duplicate}
          onDelete={remove}
          onToggleReviewed={toggleReviewed}
          onSaveDraft={saveDraft}
          onCancelDraft={() => setDraft(null)}
          onDraftChange={(ex) => setDraft((d) => ({ ...d, exercise: ex }))}
          onSaveTooltip={async (tip) => {
            try {
              await api.saveTooltip(selected.belt, selected.topic, tip);
              // refrescar catálogo local
              setCatalog((prev) => {
                const next = structuredClone(prev);
                const b = next.belts.find((x) => x.key === selected.belt);
                const t = b.topics.find((x) => x.key === selected.topic);
                t.tooltip = tip;
                return next;
              });
              flash("Tooltip guardado");
            } catch (e) { fail(e); }
          }}
        />
      )}
      {aiOpen && (
        <AIModal
          selected={selected}
          busy={busy}
          onClose={() => setAiOpen(false)}
          onGenerate={generate}
          onBlank={() => { setAiOpen(false); startNew(); }}
        />
      )}
      <Toast msg={toast?.msg} kind={toast?.kind} />
    </div>
  );
}

const container = document.getElementById("root");
if (!container._root) container._root = createRoot(container);
container._root.render(<App />);
