export default function PerfilLoading() {
  return (
    <div aria-busy="true">
      <div className="g-skeleton g-taller-skeleton-head" />
      <div
        className="g-skeleton g-taller-skeleton-card"
        style={{ marginTop: 14 }}
      />
      <div
        className="g-skeleton g-taller-skeleton-tall"
        style={{ marginTop: 12 }}
      />
    </div>
  );
}
