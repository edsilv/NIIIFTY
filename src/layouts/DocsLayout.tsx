export default function DocsLayout({ title, children }) {
  return (
    <div className="docs">
      <h1 className="break-normal font-sans text-2xl font-extrabold">
        {title}
      </h1>
      <hr className="mb-8 border-gray-300" />
      {children}
    </div>
  );
}
