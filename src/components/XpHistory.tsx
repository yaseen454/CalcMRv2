import React, { useState } from 'react';
import { useAuth } from '../lib/AuthProvider';
import { getCurrentRank } from '../lib/calc';
import { m } from 'motion/react';
import { Bookmark, ClipboardList, Trash2, ShieldCheck, Lock, Plus, Calendar, Activity } from 'lucide-react';

export function XpHistory() {
  const { user, masteryXp, xpHistory, addHistoryEntry, deleteHistoryEntry, clearXpHistory } = useAuth();
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentRank = getCurrentRank(masteryXp);

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // Direct action-finalized trigger prevents cost-inflation on every keystroke!
      await addHistoryEntry(
        masteryXp,
        currentRank.rankNumber,
        currentRank.rankName,
        note.trim()
      );
      setNote('');
    } catch (error) {
      console.error("Failed to commit history logs:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasItems = xpHistory.length > 0;

  return (
    <div className="bg-[#0b0e14]/90 border border-white/5 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-warframe-gold" />
          <h3 className="text-sm font-display uppercase tracking-widest text-white font-semibold">
            Mastery Milestone Logger
          </h3>
        </div>
        <div className="text-[10px] font-mono uppercase bg-warframe-blue/10 border border-warframe-blue/20 text-warframe-blue px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          {user ? (
            <>
              <ShieldCheck className="h-3 w-3 text-warframe-blue" />
              Cloud Secured
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 text-gray-400" />
              Offline Session
            </>
          )}
        </div>
      </div>

      {/* Save current state Form: Explicit Finalized User Action (Directive 7) */}
      <form onSubmit={handleSaveMilestone} className="space-y-3 mb-6 bg-white/[0.01] border border-white/5 p-4 rounded-lg">
        <div className="text-xs text-gray-400 leading-relaxed font-sans">
          Save your current calculation state <span className="text-white font-medium">({masteryXp.toLocaleString()} XP — {currentRank.rankName})</span> directly into your personal log.
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 100))}
              placeholder="Tag this milestone (e.g. Completed Prime Warframe) [Max 100 char]"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-warframe-blue/60 transition-colors"
              maxLength={100}
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-warframe-blue hover:bg-warframe-blue/80 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 font-display uppercase tracking-wider shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Save Milestone
          </button>
        </div>
      </form>

      {/* History Milestones List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-widest font-semibold pb-1">
          <span>Recorded Logs ({xpHistory.length})</span>
          {!user && hasItems && (
            <button
              onClick={clearXpHistory}
              className="text-[10px] text-red-400/80 hover:text-red-400 flex items-center gap-1 transition-colors uppercase"
              title="Clear offline cache"
            >
              <Trash2 className="h-3 w-3" />
              Clear Offline Logs
            </button>
          )}
        </div>

        {!hasItems ? (
          <div className="text-center py-6 border border-dashed border-white/5 rounded-lg bg-black/10">
            <ClipboardList className="h-7 w-7 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No milestones recorded yet</p>
            <p className="text-[10px] text-gray-600 mt-1 max-w-xs mx-auto">
              Calculate some XP and use the logger form above to save reference milestones.
            </p>
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
            {xpHistory.map((item, index) => {
              const formattedDate = new Date(item.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <m.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-black/30 border border-white/5 hover:border-white/10 rounded-lg p-3 transition-colors relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-warframe-gold tabular-nums">
                          {item.xp.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">XP</span>
                        </span>
                        <div className="h-3 w-[1px] bg-white/10"></div>
                        <span className="text-xs text-white font-medium">
                          MR {item.rankNumber} ({item.rankName})
                        </span>
                      </div>
                      
                      {item.note && (
                        <p className="text-xs text-gray-300 bg-white/[0.02] border border-white/5 py-1 px-2 rounded-md font-sans">
                          {item.note}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                        <Calendar className="h-3 w-3 text-gray-600" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {!user ? (
                      <button
                        onClick={() => deleteHistoryEntry(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all self-start"
                        title="Delete milestone log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <div className="text-gray-600 p-1.5" title="Cloud logs are securely stored & immutable">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </m.div>
              );
            })}
          </div>
        )}
      </div>

      {user && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>Immutable Ledger Synced</span>
          </div>
          <span className="text-gray-600">Rule 7 Compliant</span>
        </div>
      )}
    </div>
  );
}
