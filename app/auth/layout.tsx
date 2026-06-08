export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      {/* AUB branding bar */}
      <div className="bg-burgundy px-6 py-3">
        <p className="text-sm font-semibold tracking-wide text-white">
          American University of Beirut — Club Portal
        </p>
      </div>
      {children}
    </div>
  );
}
