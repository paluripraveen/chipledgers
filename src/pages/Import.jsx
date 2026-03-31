import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import { importSession } from '../store/sessions';

function parseOCRText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let date = new Date().toISOString().split('T')[0];
  const players = [];

  for (const line of lines) {
    // Try to find a date
    const dateMatch = line.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
    if (dateMatch) {
      date = dateMatch[1].replace(/\//g, '-');
      continue;
    }
    const dateMatch2 = line.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
    if (dateMatch2) {
      const parts = dateMatch2[1].split(/[-/]/);
      date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      continue;
    }

    // Try to find player + amount pattern
    // Matches: "Name  $10.50", "Name  +10.50", "Name  -10.50", "Name  10.50", "Name 10"
    const playerMatch = line.match(/^([a-zA-Z][a-zA-Z0-9 ]*?)\s+([+\-$]*\s*\d+\.?\d*)\s*$/);
    if (playerMatch) {
      const name = playerMatch[1].trim();
      const rawAmount = playerMatch[2].replace(/[$\s]/g, '');
      const amount = parseFloat(rawAmount);
      if (!isNaN(amount) && name.length > 0) {
        // Treat the amount as net: positive = won, negative = lost
        // In our system: net = buyIn - returned, so negative net = won
        players.push({
          name,
          net: -amount, // flip sign: +10 in notes means won $10, which is net -10 in our system
        });
      }
      continue;
    }

    // Try simpler pattern: just a name on its own line
    if (/^[a-zA-Z][a-zA-Z0-9 ]*$/.test(line) && line.length < 30) {
      players.push({ name: line, net: 0 });
    }
  }

  return { date, players };
}

export default function Import() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  // Editable parsed data
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [place, setPlace] = useState('');
  const [players, setPlayers] = useState([]); // [{ name, buyIn, returned, net }]
  const [parsed, setParsed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleImage(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setProcessing(true);
    setProgress(0);

    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });

    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();

    setRawText(text);
    const result = parseOCRText(text);
    setDate(result.date);

    // Convert parsed players to editable format
    setPlayers(result.players.map(p => ({
      name: p.name,
      buyIn: Math.abs(p.net) > 0 ? Math.max(10, Math.ceil(Math.abs(p.net) / 10) * 10) : 10,
      returned: Math.abs(p.net) > 0 ? (p.net < 0 ? Math.max(10, Math.ceil(Math.abs(p.net) / 10) * 10) - p.net : Math.max(10, Math.ceil(Math.abs(p.net) / 10) * 10) + p.net) : 10,
      net: p.net,
    })));

    setParsed(true);
    setProcessing(false);
  }

  function updatePlayer(index, field, value) {
    setPlayers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: field === 'name' ? value : parseFloat(value) || 0 };
      if (field === 'buyIn' || field === 'returned') {
        updated[index].net = updated[index].buyIn - updated[index].returned;
      }
      return updated;
    });
  }

  function addRow() {
    setPlayers(prev => [...prev, { name: '', buyIn: 10, returned: 0, net: 10 }]);
  }

  function removeRow(index) {
    setPlayers(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const valid = players.filter(p => p.name.trim());
    if (valid.length < 2) return;
    setSaving(true);
    await importSession(date, valid, place.trim());
    navigate('/');
  }

  function reset() {
    setImageUrl(null);
    setRawText('');
    setPlayers([]);
    setParsed(false);
    setProgress(0);
    setDate(new Date().toISOString().split('T')[0]);
    setPlace('');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-emerald-200 hover:text-white text-sm">
            &larr; Home
          </button>
          <h1 className="text-lg font-bold">Import Session</h1>
          <div />
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Step 1: Upload image */}
        {!parsed && (
          <div className="space-y-3">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded" className="max-h-64 mx-auto rounded" />
              ) : (
                <div>
                  <p className="text-3xl mb-2">&#128247;</p>
                  <p className="text-gray-600 font-medium">Tap to upload or take photo</p>
                  <p className="text-gray-400 text-xs mt-1">Photo of handwritten session notes</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => handleImage(e.target.files[0])}
              className="hidden"
            />

            {processing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-700 text-sm font-medium">Reading text from image...</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-blue-500 text-xs mt-1">{progress}%</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review & Edit parsed data */}
        {parsed && (
          <div className="space-y-4">
            {/* Raw text toggle */}
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {showRaw ? 'Hide' : 'Show'} raw OCR text
            </button>
            {showRaw && (
              <pre className="bg-gray-100 p-3 rounded text-xs text-gray-600 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {rawText}
              </pre>
            )}

            {/* Date & Place */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Place (optional)</label>
                <input
                  type="text"
                  value={place}
                  onChange={e => setPlace(e.target.value)}
                  placeholder="e.g. John's place"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Players table */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-gray-700 text-sm">Players ({players.length})</h2>
                <button
                  onClick={addRow}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors"
                >
                  + Add Row
                </button>
              </div>

              <div className="grid grid-cols-[1fr_65px_65px_65px_30px] gap-1 text-xs font-semibold text-gray-400 px-1 mb-1">
                <span>Name</span>
                <span className="text-right">Buy-In</span>
                <span className="text-right">Return</span>
                <span className="text-right">Net</span>
                <span />
              </div>

              <div className="space-y-1">
                {players.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_65px_65px_65px_30px] gap-1 items-center">
                    <input
                      type="text"
                      value={p.name}
                      onChange={e => updatePlayer(i, 'name', e.target.value)}
                      placeholder="Name"
                      className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={p.buyIn}
                      onChange={e => updatePlayer(i, 'buyIn', e.target.value)}
                      className="px-1 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={p.returned}
                      onChange={e => updatePlayer(i, 'returned', e.target.value)}
                      className="px-1 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className={`text-right text-xs font-medium ${
                      p.net > 0 ? 'text-red-600' : p.net < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {p.net > 0 ? `-$${p.net.toFixed(0)}` : p.net < 0 ? `+$${Math.abs(p.net).toFixed(0)}` : '$0'}
                    </span>
                    <button
                      onClick={() => removeRow(i)}
                      className="text-gray-400 hover:text-red-500 text-xs text-center"
                    >
                      &#10005;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tally check */}
            {(() => {
              const totalBuyIn = players.reduce((sum, p) => sum + (p.buyIn || 0), 0);
              const totalReturned = players.reduce((sum, p) => sum + (p.returned || 0), 0);
              const balanced = Math.abs(totalBuyIn - totalReturned) < 0.01;
              return (
                <div className={`p-3 rounded-lg border-2 text-sm ${balanced ? 'bg-green-50 border-green-400' : 'bg-amber-50 border-amber-400'}`}>
                  <div className="flex justify-between">
                    <span>Buy-In: <strong>${totalBuyIn.toFixed(2)}</strong></span>
                    <span>Returned: <strong>${totalReturned.toFixed(2)}</strong></span>
                    <span className={balanced ? 'text-green-700 font-bold' : 'text-red-600 font-bold'}>
                      {balanced ? 'Balanced' : `Off by $${Math.abs(totalBuyIn - totalReturned).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              );
            })()}

            <p className="text-xs text-gray-400">
              Review and edit the parsed data. Fix any OCR misreads before saving. Buy-in and return totals must balance.
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || players.filter(p => p.name.trim()).length < 2}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Session'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
