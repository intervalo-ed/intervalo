# Design system

## Stack

Tailwind v4 (config CSS-nativa vía `@theme inline` en `web/src/app/globals.css`, no hay `tailwind.config.*`) + **shadcn/ui** (`web/components.json`, estilo `base-lyra`, base color zinc, `cssVariables: true`, íconos `lucide`). Componentes en `@/components/ui`.

## Modo oscuro forzado

`:root` y `.dark` definen exactamente los mismos tokens en `globals.css` — la app no soporta un modo claro real, está pensada para verse siempre oscura.

Tokens base:
```
--background: #131324
--card: #1a1a2a
--primary: #5457e5
--foreground: #f6f8fc
--muted-foreground: #a4b3c6
--border / --input: #38385a
--ring: #7e80f7
```

## Colores de belt — única fuente de verdad

`web/src/lib/catalog/index.ts::BELT_HEX` (espejado en `web/src/components/app-icon.tsx`). **No hardcodear paletas de belt en ningún componente nuevo — importar de acá.**

| Belt | `solid` (marca) | `onDark` (legible sobre fondo oscuro) |
|---|---|---|
| white | `#FAFAFA` | `#FAFAFA` |
| blue | `#0A3180` | `#4486E8` |
| violet | `#730F8C` | `#C07BC9` |
| brown | `#674011` | `#C57C38` |

Dos arreglos derivados con propósitos distintos, **deliberadamente separados**:
- `BELT_BAR_COLORS` (= `solid`): superficies de marca (ícono, logo, cubos de landing).
- `BELT_VIVID_COLORS` / `BELT_ONDARK_VIVID` (= `onDark`, con variante propia para onboarding/landing): usado dentro de la app (confetti, chips, títulos de unidad) — así ajustar la paleta in-app no afecta las superficies de marca.

El "negro" histórico (belt `black` en `algorithm/domain.py`) **no** está en `BELT_ORDER` ni en ninguna paleta — no forma parte de ningún curso activo, no usarlo en UI nueva.

## Tipografía

`--font-sans`, `--font-heading`, `--font-noto-mono` (mapeados vía `@theme inline`).

## Gráficos matemáticos

Renderizados con **Mafs** (`react` lib), con variables CSS propias sobreescritas para un tema claro (fondo blanco, grilla gris) deliberadamente distinto del tema oscuro del resto de la app (`.math-graph .MafsView`). `graph_free_aspect` en `Exercise` desactiva el aspect ratio 1:1 forzado cuando conviene (típicamente ejes Y acotados en probabilidad).

## PWA / particularidades iOS

Constantes CSS de spacing del shell (`--cta-pb/pt/h`, `--nav-pt/pb`, `--hdr-pt/pb`) con variante para `display-mode: standalone` (PWA instalada) — manejo de safe-area y fix de `100lvh` para el bug de viewport de iOS Safari.

Última verificación: 2026-08-01
