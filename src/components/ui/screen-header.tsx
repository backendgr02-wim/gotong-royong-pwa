/** Header hijau standar tiap layar (meniru mockup Flutter). */
export function ScreenHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        {children}
      </div>
    </header>
  );
}
