// Ícono de experiencia: 3 bolitas irregulares con el azul-violeta de marca.
// Usa currentColor, así el color se controla con `text-*` desde quien lo monta.
export function XpDots({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <circle cx="8" cy="8" r="4.6" />
      <circle cx="17" cy="13" r="3.5" />
      <circle cx="9.5" cy="17.5" r="2.4" />
    </svg>
  )
}
