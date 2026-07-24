export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="text-xs text-neutral-500">Ikke nok historik endnu.</div>;
  }

  const width = 300;
  const height = 60;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const first = values[0]!;
  const last = values[values.length - 1]!;
  const color = last >= first ? "#2fbf71" : "#e3283a";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
