import katex from "katex";

// Renderiza texto con LaTeX inline $...$ (port de frontend/src/main.jsx).
export function MathText({ text }) {
  if (!text) return null;
  const parts = String(text).split(/\$([^$]+)\$/g);
  return (
    <span>
      {parts.map((p, i) =>
        i % 2 === 0 ? (
          p
        ) : (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(p, { throwOnError: false }),
            }}
          />
        ),
      )}
    </span>
  );
}

// Soporta $$...$$, **bold** (con $...$ adentro), $...$ y saltos de línea.
// Port directo de ExplanationText de frontend/src/main.jsx.
export function ExplanationText({ text }) {
  if (!text) return null;

  const TOKEN_RE = /\$\$([^$]+)\$\$|\*\*([^*]+)\*\*|\$([^$]+)\$|(\n)/g;
  const tokens = [];
  let lastIdx = 0;
  let m;

  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > lastIdx) tokens.push({ t: "text", v: text.slice(lastIdx, m.index) });
    if (m[1] !== undefined) tokens.push({ t: "display", v: m[1] });
    else if (m[2] !== undefined) tokens.push({ t: "bold", v: m[2] });
    else if (m[3] !== undefined) tokens.push({ t: "inline", v: m[3] });
    else tokens.push({ t: "br" });
    lastIdx = TOKEN_RE.lastIndex;
  }
  if (lastIdx < text.length) tokens.push({ t: "text", v: text.slice(lastIdx) });

  const rendered = tokens.filter((tok, i, arr) => {
    if (tok.t !== "br") return true;
    return arr[i - 1]?.t !== "display" && arr[i + 1]?.t !== "display";
  });

  return (
    <div style={{ lineHeight: 1.6 }}>
      {rendered.map((tok, i) => {
        if (tok.t === "display") {
          return (
            <div
              key={i}
              style={{ textAlign: "center", margin: "0.6rem 0" }}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(tok.v.trim(), {
                  throwOnError: false,
                  displayMode: true,
                }),
              }}
            />
          );
        }
        if (tok.t === "bold") {
          const parts = tok.v.split(/\$([^$]+)\$/g);
          return (
            <strong key={i}>
              {parts.map((p, j) =>
                j % 2 === 1 ? (
                  <span
                    key={j}
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(p, { throwOnError: false }),
                    }}
                  />
                ) : (
                  <span key={j}>{p}</span>
                ),
              )}
            </strong>
          );
        }
        if (tok.t === "inline") {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(tok.v, { throwOnError: false }),
              }}
            />
          );
        }
        if (tok.t === "br") return <br key={i} />;
        return <span key={i}>{tok.v}</span>;
      })}
    </div>
  );
}
