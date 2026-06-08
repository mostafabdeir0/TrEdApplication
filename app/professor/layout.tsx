export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <nav className="border-b border-gray-200 bg-burgundy px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-bold text-white">AUB Club Portal</span>
          <span className="text-sm text-burgundy-dark bg-white/10 rounded px-2 py-0.5 text-white/80">
            Professor
          </span>
        </div>
      </nav>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
