import { useState, useRef, useEffect } from 'react';

export default function NewPlayerForm({ onAdd, existingNames = [], allKnownNames = [] }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Filter suggestions: known names that match input and aren't already in session
  const suggestions = name.trim()
    ? allKnownNames.filter(n =>
        n.toLowerCase().includes(name.trim().toLowerCase()) &&
        !existingNames.some(e => e.toLowerCase() === n.toLowerCase())
      )
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleAdd() {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
      setError('Only letters, numbers, and spaces allowed');
      return;
    }
    if (existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in the session`);
      return;
    }
    setError('');
    setShowSuggestions(false);
    onAdd(trimmed);
    setName('');
    setSelectedIndex(-1);
  }

  function handleSelect(suggestion) {
    setName(suggestion);
    setShowSuggestions(false);
    setError('');
    setSelectedIndex(-1);
  }

  function handleKeyDown(e) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleChange(e) {
    setName(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    setError('');
  }

  return (
    <div className="flex gap-2 items-start" ref={wrapperRef}>
      <div className="flex-1 relative">
        <input
          type="text"
          value={name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => name.trim() && setShowSuggestions(true)}
          placeholder="Player name"
          autoComplete="off"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li
                key={s}
                onClick={() => handleSelect(s)}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  i === selectedIndex
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        Add
      </button>
    </div>
  );
}
