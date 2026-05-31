export default function TallyBar({ players }) {
  const totalBuyIn = players.reduce((sum, p) => sum + p.totalBuyIn, 0);
  const totalReturned = players.reduce((sum, p) => sum + (p.chipsReturned ?? 0), 0);
  const allReturned = players.every(p => p.chipsReturned != null);
  const diff = totalBuyIn - totalReturned;
  const balanced = allReturned && Math.abs(diff) < 0.01;
  const remaining = totalBuyIn - totalReturned;

  return (
    <div className={`p-4 rounded-lg border-2 ${balanced ? 'bg-green-50 border-green-400' : 'bg-amber-50 border-amber-400'}`}>
      <div className="flex justify-between items-center text-sm font-medium">
        <div>
          <span className="text-gray-700">Total Buy-In:</span>{' '}
          <span className="text-gray-900 font-bold">${totalBuyIn.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-700">Total Returned:</span>{' '}
          <span className="text-gray-900 font-bold">${totalReturned.toFixed(2)}</span>
        </div>
        <div>
          {balanced ? (
            <span className="text-green-700 font-bold">Balanced</span>
          ) : allReturned ? (
            <span className="text-red-600 font-bold">Off by ${Math.abs(diff).toFixed(2)}</span>
          ) : (
            <span className="text-amber-700 font-semibold">Awaiting returns...</span>
          )}
        </div>
      </div>
      {!allReturned && (
        <div className="mt-2 pt-2 border-t border-amber-300 flex justify-center text-sm">
          <span className="text-gray-700">Remaining to distribute:&nbsp;</span>
          <span className="font-bold text-amber-800">${remaining.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
