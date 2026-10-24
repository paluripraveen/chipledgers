// Four-color deck, like TV poker, so suits are easy to tell apart at a glance
export const SUIT_STYLES = {
  s: { symbol: '♠', color: 'text-gray-900', name: 'spades' },
  h: { symbol: '♥', color: 'text-red-600', name: 'hearts' },
  d: { symbol: '♦', color: 'text-blue-600', name: 'diamonds' },
  c: { symbol: '♣', color: 'text-green-700', name: 'clubs' },
};

export function rankLabel(rank) {
  return rank === 'T' ? '10' : rank;
}
