export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
    </div>
  );
}
