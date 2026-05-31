import { useState } from 'react';

const BUY_IN_AMOUNT = 10;
const REMOVE_PASSPHRASE = 'AddedByMistake';

export default function PlayerRow({ player, onBuyIn, onUndo, onRemove }) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');

  function handleRemove() {
    if (passphrase !== REMOVE_PASSPHRASE) {
      setError('Incorrect passphrase');
      return;
    }
    setConfirmingRemove(false);
    setPassphrase('');
    setError('');
    onRemove(player.id);
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{player.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {player.buyIns.length === 0
              ? 'No buy-ins yet'
              : `${player.buyIns.length} buy-in${player.buyIns.length > 1 ? 's' : ''} = $${player.totalBuyIn}`}
          </p>
          {player.buyIns.length > 1 && (
            <p className="text-xs font-bold text-amber-500 dark:text-amber-400">
              {player.buyIns.length - 1} re-buy{player.buyIns.length - 1 > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {onUndo && player.buyIns.length > 1 && (
          <button
            type="button"
            onClick={() => onUndo(player.id)}
            className="px-2 py-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded text-xs font-medium transition-colors"
            title="Undo last buy-in"
          >
            Undo
          </button>
        )}
        <button
          type="button"
          onClick={() => onBuyIn(player.id, BUY_IN_AMOUNT)}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + ${BUY_IN_AMOUNT}
        </button>
        <button
          type="button"
          onClick={() => { setConfirmingRemove(!confirmingRemove); setPassphrase(''); setError(''); }}
          className="px-2 py-1.5 text-gray-400 hover:text-red-500 text-xs transition-colors"
          title="Remove player"
        >
          &#10005;
        </button>
      </div>

      {confirmingRemove && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 p-3 space-y-2">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Enter passphrase to remove {player.name}:</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={passphrase}
              onChange={e => { setPassphrase(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleRemove()}
              placeholder="Passphrase"
              className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <button type="button" onClick={handleRemove}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors">
              Remove
            </button>
            <button type="button" onClick={() => { setConfirmingRemove(false); setPassphrase(''); setError(''); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
      )}
    </div>
  );
}
