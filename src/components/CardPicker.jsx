import { RANKS, SUITS } from '../store/oddsTables';
import { SUIT_STYLES, rankLabel } from './cardStyles';

// Tap-to-pick deck: one row per suit. Tapping a selected card unselects it; once `max`
// cards are picked, tapping another swaps out the oldest pick.
export default function CardPicker({ selected, onChange, max, unavailable = [] }) {
  function toggle(card) {
    if (selected.includes(card)) onChange(selected.filter(c => c !== card));
    else if (selected.length < max) onChange([...selected, card]);
    else onChange([...selected.slice(1), card]);
  }

  return (
    <div className="space-y-1">
      {SUITS.split('').map(suit => (
        <div key={suit} className="grid grid-cols-13 gap-0.5">
          {RANKS.split('').map(rank => {
            const card = rank + suit;
            const isSelected = selected.includes(card);
            const isUnavailable = unavailable.includes(card);
            return (
              <button
                key={card}
                type="button"
                disabled={isUnavailable}
                onClick={() => toggle(card)}
                aria-pressed={isSelected}
                aria-label={`${rankLabel(rank)} of ${SUIT_STYLES[suit].name}`}
                className={`h-12 rounded flex flex-col items-center justify-center text-xs font-bold leading-tight border transition-colors ${SUIT_STYLES[suit].color} ${
                  isSelected
                    ? 'bg-amber-200 border-amber-500 ring-2 ring-amber-500'
                    : 'bg-white dark:bg-gray-100 border-gray-200 hover:bg-gray-100'
                } disabled:opacity-20 disabled:cursor-not-allowed`}
              >
                <span>{rankLabel(rank)}</span>
                <span>{SUIT_STYLES[suit].symbol}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
