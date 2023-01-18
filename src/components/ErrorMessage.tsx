export function ErrorMessage({ children }: {
  children: React.ReactNode;
}) {
  return <p className="mt-2 text-sm text-red-700">{children}</p>;
}