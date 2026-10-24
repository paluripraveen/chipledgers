import { SUIT_STYLES, rankLabel } from './cardStyles';

const SIZES = {
  sm: 'w-8 h-11 text-xs',
  md: 'w-12 h-16 text-base',
  lg: 'w-16 h-22 text-2xl',
};

export default function PlayingCard({ card, size = 'md', faceDown = false }) {
  const box = `${SIZES[size]} rounded-md flex-shrink-0`;

  if (!card) {
    return <div className={`${box} border-2 border-dashed border-gray-300 dark:border-gray-600`} />;
  }
  if (faceDown) {
    return (
      <div className={`${box} bg-emerald-700 border-2 border-white dark:border-gray-300 shadow-sm bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.15)_4px,rgba(255,255,255,0.15)_8px)]`} />
    );
  }

  const suit = SUIT_STYLES[card[1]];
  return (
    <div className={`${box} ${suit.color} bg-white border border-gray-300 shadow-sm flex flex-col items-center justify-center font-bold leading-none select-none`}>
      <span>{rankLabel(card[0])}</span>
      <span>{suit.symbol}</span>
    </div>
  );
}
