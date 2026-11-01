const pips: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [0, 2, 3, 4, 5, 6, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

export const DieFace = ({ value }: { value: number }) => (
  <span className="die" aria-label={`${value}`}>
    {Array.from({ length: 9 }, (_, i) => (
      <span key={i} className={pips[value]?.includes(i) ? "die__pip" : "die__blank"} />
    ))}
  </span>
);
