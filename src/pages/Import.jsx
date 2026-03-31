import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { importSession } from '../store/sessions';

const VISION_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

async function callVisionAPI(file) {
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  const body = {
    requests: [{
      image: { content: base64 },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
    }],
  };

  const res = await fetch(VISION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Vision API error');
  }

  const data = await res.json();
  return data.responses?.[0]?.fullTextAnnotation?.text || '';
}

function parseOCRText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let date = new Date().toISOString().split('T')[0];
  const players = [];

  for (const line of lines) {
    // Try to find date patterns
    const dateISO = line.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
    if (dateISO) {
      date = dateISO[1].replace(/\//g, '-');
      continue;
    }
    const dateUS = line.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
    if (dateUS) {
      const parts = dateUS[1].split(/[-/]/);
      const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      date = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      continue;
    }

    // Player + amount: "Name  $10.50", "Name  +10", "Name  -5.25", "Name 10"
    const playerMatch = line.match(/^([a-zA-Z][a-zA-Z0-9 ]*?)\s+([+\-$]*\s*\d+\.?\d*)\s*$/);
    if (playerMatch) {
      const name = playerMatch[1].trim();
      const rawAmount = playerMatch[2].replace(/[$\s]/g, '');
      const amount = parseFloat(rawAmount);
      if (!isNaN(amount) && name.length > 0) {
        players.push({
          name,
          net: -amount, // +10 in notes = won $10 = net -10 in our system
        });
      }
      continue;
    }

    // Name with amount separated by colon or dash: "Name: 10", "Name - 10"
    const colonMatch = line.match(/^([a-zA-Z][a-zA-Z0-9 ]*?)\s*[:\-–—]\s*([+\-$]*\s*\d+\.?\d*)\s*$/);
    if (colonMatch) {
      const name = colonMatch[1].trim();
      const rawAmount = colonMatch[2].replace(/[$\s]/g, '');
      const amount = parseFloat(rawAmount);
      if (!isNaN(amount) && name.length > 0) {
        players.push({ name, net: -amount });
      }
      continue;
    }

    // Just a name on its own line
    if (/^[a-zA-Z][a-zA-Z0-9 ]*$/.test(line) && line.length > 1 && line.length < 30) {
      players.push({ name: line, net: 0 });
    }
  }

  return { date, players };
}

export default function Import() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [rawText, setRawText] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [place, setPlace] = useState('');
  const [players, setPlayers] = useState([]);
  const [parsed, setParsed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleImage(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setProcessing(true);
    setError('');

    try {
      const text = await callVisionAPI(file);
      setRawText(text);

      if (!text.trim()) {
        setError('No text detected in the image. Try a clearer photo.');
        setProcessing(false);
        return;
      }

      const result = parseOCRText(text);
      setDate(result.date);

      setPlayers(result.players.map(p => ({
        name: p.name,
        buyIn: Math.abs(p.net) > 0 ? Math.max(10, Math.ceil(Math.abs(p.net) / 10) * 10) : 10,
        returned: Math.abs(p.net) > 0
          ? (p.net < 0
            ? Math.max(10, Math.ceil(Math.abs(p.net) / 10) * 10) - p.net
            : Math.max(10, Math.ceil(Math.abs(p.net) / 10) * 10) + p.net)
          : 10,
        net: p.net,
      })));

      setParsed(true);
    } catch (err) {
      setError(`OCR failed: ${err.message}`);
    }
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
    await importSession(date, valid, place.trim(), groupId);
    navigate(groupId ? `/group/${groupId}` : '/');
  }

  function reset() {
    setImageUrl(null);
    setRawText('');
    setPlayers([]);
    setParsed(false);
    setError('');
    setDate(new Date().toISOString().split('T')[0]);
    setPlace('');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(groupId ? `/group/${groupId}` : '/')} className="text-emerald-200 hover:text-white text-sm">
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
              onClick={() => !processing && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                processing ? 'border-gray-200 dark:border-gray-700 cursor-wait' : 'border-gray-300 dark:border-gray-600 cursor-pointer hover:border-emerald-500'
              }`}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded" className="max-h-64 mx-auto rounded" />
              ) : (
                <div>
                  <p className="text-3xl mb-2">&#128247;</p>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Tap to upload or take photo</p>
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
                <p className="text-blue-700 text-sm font-medium">Reading handwritten text with Google Cloud Vision...</p>
                <div className="mt-2 flex justify-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
                <button onClick={reset} className="text-red-500 text-xs underline mt-1">Try again</button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review & Edit parsed data */}
        {parsed && (
          <div className="space-y-4">
            {/* Image preview */}
            {imageUrl && (
              <img src={imageUrl} alt="Source" className="max-h-32 mx-auto rounded border border-gray-200 dark:border-gray-700" />
            )}

            {/* Raw text toggle */}
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showRaw ? 'Hide' : 'Show'} raw OCR text
            </button>
            {showRaw && (
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {rawText}
              </pre>
            )}

            {/* Date & Place */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Place (optional)</label>
                <input
                  type="text"
                  value={place}
                  onChange={e => setPlace(e.target.value)}
                  placeholder="e.g. John's place"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Players table */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Players ({players.length})</h2>
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
                      className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={p.buyIn}
                      onChange={e => updatePlayer(i, 'buyIn', e.target.value)}
                      className="px-1 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-right dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={p.returned}
                      onChange={e => updatePlayer(i, 'returned', e.target.value)}
                      className="px-1 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-right dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className={`text-right text-xs font-medium ${
                      p.net > 0 ? 'text-red-600' : p.net < 0 ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'
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
              Review and edit the parsed data. Fix any misreads before saving.
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
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
