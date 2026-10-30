export function PageFrame({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-frame content-width">
      <div className="page-intro">
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {children}
    </section>
  );
}
