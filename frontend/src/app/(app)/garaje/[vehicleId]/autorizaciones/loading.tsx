import '@/components/gestion/gestion.css';

export default function AutorizacionesLoading() {
  return (
    <section className="g-gest" aria-busy="true">
      <div className="g-skeleton g-gest-skeleton-head" />
      <div className="g-skeleton g-gest-skeleton-text" />
      <div className="g-skeleton g-gest-skeleton-card" />
      <div className="g-skeleton g-gest-skeleton-tall" />
    </section>
  );
}
