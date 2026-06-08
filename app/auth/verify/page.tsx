export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md text-center">
        <h1 className="mb-2 text-2xl font-bold text-burgundy">Check Your Email</h1>
        <p className="text-sm text-gray-500">
          We sent a verification link to your AUB email. Click the link to
          activate your account.
        </p>
      </div>
    </main>
  );
}
