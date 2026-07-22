export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-9 w-9 text-lg' : 'h-14 w-14 text-2xl';
  const word = size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <div className="flex items-center gap-2.5">
      {/* Ícono: "Ch" con cruz sobre fondo oscuro, letras doradas */}
      <div
        className={`${box} relative flex items-center justify-center rounded-xl font-display`}
        style={{ backgroundColor: '#1C1C1E', color: '#C9A84C' }}
      >
        <span className="relative">
          Ch
          <span
            className="absolute -top-1.5 right-0 text-[0.45em] leading-none"
            aria-hidden
          >
            +
          </span>
        </span>
      </div>
      <span className={`${word} font-display font-bold text-carbon`}>
        ChBook
      </span>
    </div>
  );
}
