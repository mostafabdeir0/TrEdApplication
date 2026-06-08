// Each auth page manages its own full-screen layout and card.
// This layout is intentionally minimal — just a passthrough.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
