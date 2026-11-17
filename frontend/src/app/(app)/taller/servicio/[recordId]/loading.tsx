export default function ServicioLoading() {
  return (
    <div aria-busy="true">
      <div className="g-skeleton g-taller-skeleton-head" />
      <div
        className="g-skeleton g-taller-skeleton-text"
        style={{ marginTop: 8 }}
      />
      <div
        className="g-skeleton g-taller-skeleton-tall"
        style={{ marginTop: 14 }}
      />
    </div>
  );
}
