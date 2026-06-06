import React, { useState } from 'react';
import { useAuth, XpHistoryItem } from '../lib/AuthProvider';
import { History, RotateCcw, Trash2, Edit2, Check, X, Calendar, Plus } from 'lucide-react';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function XpHistory() {
  const { 
    xpHistory, 
    updateMasteryXp, 
    deleteHistoryEntry, 
    updateHistoryEntryNote, 
    clearXpHistory,
    masteryXp,
    addHistoryEntry
  } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>('');
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualXp, setManualXp] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualError, setManualError] = useState('');

  const handleStartEdit = (item: XpHistoryItem) => {
    setEditingId(item.id);
    setEditNoteText(item.note || '');
  };

  const handleSaveEdit = async (id: string) => {
    await updateHistoryEntryNote(id, editNoteText);
    setEditingId(null);
  };

  const handleRestore = async (xp: number) => {
    // Set current XP and prevent duplications in history by passing preventHistoryAdded = true
    await updateMasteryXp(xp, true);
  };

  const handleAddManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    const parsedXp = parseInt(manualXp.replace(/,/g, ''), 10);
    if (isNaN(parsedXp) || parsedXp < 0) {
      setManualError('Please enter a valid non-negative XP amount.');
      return;
    }
    await addHistoryEntry(parsedXp, manualNote.trim());
    setManualXp('');
    setManualNote('');
    setShowAddManual(false);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    }) + ' ' + date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <m.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-black/40 border border-white/5 p-6 rounded-xl backdrop-blur-md shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-warframe-gold to-warframe-blue"></div>
      
      {/* Header Container */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display font-semibold text-white flex items-center">
          <History className="h-5 w-5 mr-2 text-warframe-gold animate-pulse" />
          XP History Logs
        </h2>
        
        <div className="flex items-center space-x-2">
          <button 
            type="button" 
            onClick={() => {
              setShowAddManual(!showAddManual);
              setManualError('');
            }}
            className={cn(
              "p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all",
              showAddManual 
                ? "bg-white/10 text-white border-white/10 hover:bg-white/20" 
                : "bg-warframe-gold/10 text-warframe-gold border-warframe-gold/20 hover:bg-warframe-gold/20"
            )}
            title="Add custom milestone record manually"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Manually Add</span>
          </button>
          
          {xpHistory.length > 0 && (
            <button
              onClick={() => {
                if(window.confirm("Are you sure you want to clear your entire XP history logs? This cannot be undone.")) {
                  clearXpHistory();
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors bg-red-400/10 hover:bg-red-400/20 px-2.5 py-1.5 rounded-lg border border-red-500/20"
            >
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* Manual Entry Form */}
      <AnimatePresence>
        {showAddManual && (
          <m.form 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            onSubmit={handleAddManualEntry}
            className="overflow-hidden border border-white/10 bg-white/[0.02] p-4 rounded-lg space-y-3"
          >
            <h3 className="text-sm font-semibold text-warframe-gold">Log Manual Milestone</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">XP Amount</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 50,000"
                  value={manualXp}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '') setManualXp('');
                    else setManualXp(parseInt(raw, 10).toLocaleString());
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-warframe-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Custom Note / Milestone Label</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cleared Saturn node"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-warframe-gold"
                />
              </div>
            </div>
            {manualError && <p className="text-xs text-red-400">{manualError}</p>}
            <div className="flex justify-end space-x-2 pt-1 border-t border-white/5">
              <button 
                type="button" 
                onClick={() => {
                  setShowAddManual(false);
                  setManualError('');
                }}
                className="px-3 py-1 text-xs hover:text-white text-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-warframe-gold text-black hover:bg-warframe-gold/80 text-xs font-semibold px-3 py-1 rounded transition-colors"
              >
                Save Milestone
              </button>
            </div>
          </m.form>
        )}
      </AnimatePresence>

      {/* History Items List */}
      <div className={cn(
        "space-y-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      )}>
        {xpHistory.length === 0 ? (
          <div className="py-8 text-center text-gray-500 border border-white/5 border-dashed rounded-lg bg-white/[0.01]">
            <History className="h-8 w-8 text-gray-600 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium uppercase tracking-wider">No history logged yet</p>
            <p className="text-[11px] text-gray-600 mt-1 max-w-[200px] mx-auto leading-normal">
              Enter different XP amounts in your status calculator to automatically record your milestones.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {xpHistory.map((item, index) => {
              const itemIsCurrentXp = item.xp === masteryXp;
              const isEditing = editingId === item.id;

              return (
                <m.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={cn(
                    "group bg-white/[0.02] border p-3 rounded-lg relative overflow-hidden transition-all",
                    itemIsCurrentXp 
                      ? "border-warframe-blue/20 bg-warframe-blue/[0.02]" 
                      : "border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm tabular-nums">
                          {item.xp.toLocaleString()} XP
                        </span>
                        <span className="text-[10px] text-warframe-gold bg-warframe-gold/10 px-2 py-0.5 rounded-full font-mono uppercase">
                          MR {item.rankNumber} ({item.rankName})
                        </span>
                        {itemIsCurrentXp && (
                          <span className="text-[9px] bg-warframe-blue/10 border border-warframe-blue/20 text-warframe-blue font-bold tracking-wider px-1.5 py-0.5 rounded uppercase">
                            Current
                          </span>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <p className="text-[10px] text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1 opacity-50" />
                        {formatTimestamp(item.timestamp)}
                      </p>

                      {/* Note Component */}
                      <div className="pt-2 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center space-x-1.5 mt-1">
                            <input
                              type="text"
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 text-xs px-2 py-1 rounded text-white focus:outline-none focus:ring-1 focus:ring-warframe-gold"
                              placeholder="Add milestone note..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/20"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 bg-red-400/10 hover:bg-red-400/20 text-red-400 rounded border border-red-400/20"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center group-hover:translate-x-0.5 transition-transform">
                            {item.note ? (
                              <p className="text-xs text-gray-300 italic truncate flex-1 pr-4">
                                &ldquo;{item.note}&rdquo;
                              </p>
                            ) : (
                              <p className="text-xs text-gray-600 italic select-none flex-1 pr-4">
                                No milestone note...
                              </p>
                            )}
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-white transition-opacity ml-1"
                              title="Edit milestone label/note"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="flex items-center space-x-1 pl-2">
                      {!itemIsCurrentXp && (
                        <button
                          onClick={() => handleRestore(item.xp)}
                          className="p-1.5 rounded bg-warframe-blue/10 hover:bg-warframe-blue text-warframe-blue hover:text-black border border-warframe-blue/20 transition-all"
                          title="Restore this calculations state"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteHistoryEntry(item.id)}
                        className="p-1.5 rounded bg-red-400/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 transition-all"
                        title="Delete this history milestone"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </m.div>
  );
}
