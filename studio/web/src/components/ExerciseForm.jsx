import { C, fonts, inputStyle, labelStyle, SKILL_LABELS } from "../theme.js";
import { MathText, ExplanationText } from "./Math.jsx";
import FunctionPlot from "./FunctionPlot.jsx";

const OPTION_LETTERS = ["A", "B", "C", "D"];

// Editor de un ejercicio con preview en vivo. Controlado: recibe `value` y
// emite el ejercicio completo por `onChange` en cada edición.
export default function ExerciseForm({ value, skills, onChange }) {
  const ex = value;
  const set = (patch) => onChange({ ...ex, ...patch });

  const setOption = (i, v) => {
    const options = [...(ex.options || ["", "", "", ""])];
    options[i] = v;
    set({ options });
  };

  const setGraphView = (i, v) => {
    const gv = Array.isArray(ex.graph_view) ? [...ex.graph_view] : [-4, 4, -8, 10];
    gv[i] = v === "" ? "" : Number(v);
    set({ graph_view: gv });
  };

  const isGraph = ex.subtype === "graph";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      {/* ── Formulario ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Habilidad</label>
            <select
              style={inputStyle}
              value={ex.skill || ""}
              onChange={(e) => set({ skill: e.target.value })}
            >
              {(skills || []).map((s) => (
                <option key={s} value={s}>
                  {SKILL_LABELS[s] || s}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Subtipo</label>
            <select
              style={inputStyle}
              value={ex.subtype || "text"}
              onChange={(e) => {
                const subtype = e.target.value;
                if (subtype === "graph") {
                  set({
                    subtype,
                    graph_fn: ex.graph_fn || "x",
                    graph_view: Array.isArray(ex.graph_view) ? ex.graph_view : [-4, 4, -8, 10],
                  });
                } else {
                  set({ subtype, graph_fn: null, graph_view: null });
                }
              }}
            >
              <option value="text">Texto</option>
              <option value="graph">Gráfico</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            external_id <span style={{ textTransform: "none", color: C.muted }}>(automático)</span>
          </label>
          <input style={{ ...inputStyle, color: C.muted, fontFamily: fonts.mono, fontSize: "0.8rem" }} value={ex.external_id || ""} readOnly />
        </div>

        <div>
          <label style={labelStyle}>Pregunta</label>
          <textarea
            style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
            value={ex.question || ""}
            onChange={(e) => set({ question: e.target.value })}
          />
        </div>

        <div>
          <label style={labelStyle}>Opciones (marcá la correcta)</label>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <input
                type="radio"
                name="correct"
                checked={ex.correct_index === i}
                onChange={() => set({ correct_index: i })}
                style={{ accentColor: C.success }}
              />
              <span style={{ width: 16, fontWeight: 700, color: C.muted }}>{OPTION_LETTERS[i]}</span>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={(ex.options || [])[i] || ""}
                onChange={(e) => setOption(i, e.target.value)}
              />
            </div>
          ))}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: C.textSecondary }}>
          <input
            type="checkbox"
            checked={!!ex.has_math}
            onChange={(e) => set({ has_math: e.target.checked })}
            style={{ accentColor: C.primary }}
          />
          Contiene matemática (has_math)
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: ex.reviewed ? C.success : C.textSecondary, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={!!ex.reviewed}
            onChange={(e) => set({ reviewed: e.target.checked })}
            style={{ accentColor: C.success }}
          />
          Revisado / aprobado por humano
        </label>

        {isGraph && (
          <div>
            <label style={labelStyle}>Función (sintaxis JS de x)</label>
            <input
              style={{ ...inputStyle, fontFamily: fonts.mono }}
              value={ex.graph_fn || ""}
              placeholder="3*x + 2"
              onChange={(e) => set({ graph_fn: e.target.value })}
            />
            <label style={{ ...labelStyle, marginTop: "0.5rem" }}>Ventana [xmin, xmax, ymin, ymax]</label>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["xmin", "xmax", "ymin", "ymax"].map((lbl, i) => (
                <input
                  key={lbl}
                  type="number"
                  style={{ ...inputStyle, fontFamily: fonts.mono }}
                  placeholder={lbl}
                  value={(ex.graph_view || [])[i] ?? ""}
                  onChange={(e) => setGraphView(i, e.target.value)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Feedback si acierta</label>
          <textarea
            style={{ ...inputStyle, minHeight: 52, resize: "vertical" }}
            value={ex.feedback_correct || ""}
            onChange={(e) => set({ feedback_correct: e.target.value })}
          />
        </div>
        <div>
          <label style={labelStyle}>Feedback si falla</label>
          <textarea
            style={{ ...inputStyle, minHeight: 52, resize: "vertical" }}
            value={ex.feedback_incorrect || ""}
            onChange={(e) => set({ feedback_incorrect: e.target.value })}
          />
        </div>
        <div>
          <label style={labelStyle}>Explicación (admite $$...$$ y **negrita**)</label>
          <textarea
            style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
            value={ex.explanation || ""}
            onChange={(e) => set({ explanation: e.target.value })}
          />
        </div>
      </div>

      {/* ── Preview ────────────────────────────────────────────── */}
      <div>
        <div style={{ position: "sticky", top: 0 }}>
          <label style={labelStyle}>Vista previa</label>
          <div
            style={{
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "1.25rem",
            }}
          >
            <div style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.9rem", lineHeight: 1.4 }}>
              <MathText text={ex.question} />
            </div>

            {isGraph && ex.graph_fn && (
              <div style={{ marginBottom: "0.9rem" }}>
                <FunctionPlot fnStr={ex.graph_fn} view={ex.graph_view} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(ex.options || []).map((opt, i) => {
                const correct = ex.correct_index === i;
                return (
                  <div
                    key={i}
                    style={{
                      padding: "0.6rem 0.8rem",
                      borderRadius: 10,
                      border: `1px solid ${correct ? C.success : C.border}`,
                      background: correct ? C.successBg : C.bgElevated,
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: correct ? C.success : C.muted }}>
                      {OPTION_LETTERS[i]}
                    </span>
                    <span><MathText text={opt} /></span>
                  </div>
                );
              })}
            </div>

            {ex.feedback_correct && (
              <div style={{ marginTop: "0.9rem", fontSize: "0.85rem", color: C.success }}>
                <strong>Acierto:</strong> <MathText text={ex.feedback_correct} />
              </div>
            )}
            {ex.feedback_incorrect && (
              <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: C.error }}>
                <strong>Error:</strong> <MathText text={ex.feedback_incorrect} />
              </div>
            )}

            {ex.explanation && (
              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "0.9rem",
                  borderTop: `1px solid ${C.border}`,
                  fontSize: "0.9rem",
                  color: C.textSecondary,
                }}
              >
                <ExplanationText text={ex.explanation} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
