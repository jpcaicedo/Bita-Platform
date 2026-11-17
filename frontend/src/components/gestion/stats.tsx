interface Stat {
  value: number;
  label: string;
  tone?: 'alert' | 'lilac' | 'green';
}

export function Stats({ items }: { items: Stat[] }) {
  return (
    <div className="g-gest-stats">
      {items.map((item) => (
        <div
          key={item.label}
          className={[
            'g-card',
            'g-gest-stat',
            item.tone ? `g-gest-stat--${item.tone}` : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
