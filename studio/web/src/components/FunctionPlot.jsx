import { useRef } from "react";

// Port de FunctionPlot de frontend/src/main.jsx. Dibuja en SVG la función
// graph_fn dentro de la ventana graph_view [xmin, xmax, ymin, ymax].
export default function FunctionPlot({ fnStr, view }) {
  if (!fnStr || !Array.isArray(view) || view.length !== 4) {
    return null;
  }
  const [xMin, xMax, yMin, yMax] = view;
  const W = 480, H = 280, PAD = 44;
  const pw = W - 2 * PAD, ph = H - 2 * PAD;
  const toX = (x) => PAD + ((x - xMin) / (xMax - xMin)) * pw;
  const toY = (y) => H - PAD - ((y - yMin) / (yMax - yMin)) * ph;
  const plotId = useRef(`plot-${Math.random().toString(36).slice(2, 8)}`).current;

  let fn;
  try {
    fn = new Function(
      "x",
      `const sin=Math.sin,cos=Math.cos,tan=Math.tan,pow=Math.pow,
             log=Math.log,log2=Math.log2,log10=Math.log10,
             exp=Math.exp,abs=Math.abs,sqrt=Math.sqrt,PI=Math.PI,E=Math.E;
       return ${fnStr};`,
    );
  } catch {
    fn = () => 0;
  }

  const segments = [];
  let seg = [];
  const margin = (yMax - yMin) * 2;
  for (let i = 0; i <= 600; i++) {
    const x = xMin + (i / 600) * (xMax - xMin);
    let y;
    try {
      y = fn(x);
    } catch {
      y = NaN;
    }
    if (!isFinite(y) || y < yMin - margin || y > yMax + margin) {
      if (seg.length > 1) segments.push(seg);
      seg = [];
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
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", borderRadius: 10, display: "block", background: "#FAFBFC", border: "1px solid #E5E7EF" }}
    >
      {xTicks.map((x) => (
        <line key={`gx${x}`} x1={toX(x)} y1={PAD} x2={toX(x)} y2={H - PAD} stroke="#E2E5EA" strokeWidth="1" />
      ))}
      {yTicks.map((y) => (
        <line key={`gy${y}`} x1={PAD} y1={toY(y)} x2={W - PAD} y2={toY(y)} stroke="#E2E5EA" strokeWidth="1" />
      ))}
      <line x1={PAD} y1={ay} x2={W - PAD} y2={ay} stroke="#9CA3AF" strokeWidth="1.5" />
      <line x1={ax} y1={PAD} x2={ax} y2={H - PAD} stroke="#9CA3AF" strokeWidth="1.5" />
      <polygon points={`${W - PAD + 1},${ay} ${W - PAD - 7},${ay - 4} ${W - PAD - 7},${ay + 4}`} fill="#9CA3AF" />
      <polygon points={`${ax},${PAD - 1} ${ax - 4},${PAD + 7} ${ax + 4},${PAD + 7}`} fill="#9CA3AF" />
      {xTicks.map((x) => (
        <g key={`tx${x}`}>
          <line x1={toX(x)} y1={ay - 4} x2={toX(x)} y2={ay + 4} stroke="#9CA3AF" strokeWidth="1" />
          <text x={toX(x)} y={ay + 15} textAnchor="middle" fontSize="11" fill="#4B5563">{x}</text>
        </g>
      ))}
      {yTicks.map((y) => (
        <g key={`ty${y}`}>
          <line x1={ax - 4} y1={toY(y)} x2={ax + 4} y2={toY(y)} stroke="#9CA3AF" strokeWidth="1" />
          <text x={ax - 8} y={toY(y) + 4} textAnchor="end" fontSize="11" fill="#4B5563">{y}</text>
        </g>
      ))}
      <clipPath id={plotId}>
        <rect x={PAD} y={PAD} width={pw} height={ph} />
      </clipPath>
      {segments.map((s, i) => (
        <polyline
          key={i}
          points={s.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="#4F46E5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath={`url(#${plotId})`}
        />
      ))}
    </svg>
  );
}
