export default function ComprobanteLoading() {
  return (
    <div aria-busy="true" style={{ paddingTop: 18 }}>
      <div className="g-skeleton g-taller-skeleton-head" />
      <div
        className="g-skeleton g-taller-skeleton-text"
        style={{ marginTop: 8 }}
      />
      <div
        className="g-skeleton g-taller-skeleton-tall"
        style={{ marginTop: 16 }}
      />
    </div>
  );
}
