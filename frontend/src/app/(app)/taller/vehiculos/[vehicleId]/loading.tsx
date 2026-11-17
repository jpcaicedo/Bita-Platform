export default function VehicleDetailLoading() {
  return (
    <div aria-busy="true">
      <div className="g-skeleton g-taller-skeleton-card" />
      <div
        className="g-skeleton g-taller-skeleton-text"
        style={{ marginTop: 12 }}
      />
      <div
        className="g-skeleton g-taller-skeleton-tall"
        style={{ marginTop: 12 }}
      />
      <div
        className="g-skeleton g-taller-skeleton-card"
        style={{ marginTop: 12 }}
      />
    </div>
  );
}
