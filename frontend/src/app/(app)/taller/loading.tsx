export default function TallerLoading() {
  return (
    <div aria-busy="true">
      <div className="g-skeleton g-taller-skeleton-head" />
      <div
        className="g-skeleton g-taller-skeleton-text"
        style={{ marginTop: 8 }}
      />
      <div
        className="g-skeleton g-taller-skeleton-card"
        style={{ marginTop: 18 }}
      />
      <div
        className="g-skeleton g-taller-skeleton-tall"
        style={{ marginTop: 12 }}
      />
    </div>
  );
}
