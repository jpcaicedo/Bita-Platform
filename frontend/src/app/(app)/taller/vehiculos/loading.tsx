export default function VehiculosLoading() {
  return (
    <div aria-busy="true">
      <div className="g-skeleton g-taller-skeleton-head" />
      <div
        className="g-skeleton g-taller-skeleton-text"
        style={{ marginTop: 8 }}
      />
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="g-skeleton g-taller-skeleton-card"
          style={{ marginTop: 12 }}
        />
      ))}
    </div>
  );
}
