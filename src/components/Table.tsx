import React from 'react';
import { UpcomingRankProjection } from '../lib/calc';
import { cn } from '../lib/utils';
import { m } from 'motion/react';

interface RankTableProps {
  projections: UpcomingRankProjection[];
  currentXp: number;
}

export function RankTable({ projections, currentXp }: RankTableProps) {
  if (projections.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-warframe-gold/20 bg-black/60 shadow-xl backdrop-blur-sm relative">
      <div className="w-full overflow-y-auto max-h-[65vh] custom-scrollbar">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#1a1a24] text-warframe-blue text-[10px] md:text-xs uppercase sticky top-0 z-20 shadow-md ring-1 ring-black/50">
            <tr>
              <th className="px-1 md:px-2 py-2 border-b border-warframe-gold/30 font-semibold truncate max-w-[80px] md:max-w-none">Rank Name</th>
              <th className="px-1 md:px-2 py-2 border-b border-warframe-gold/30 font-semibold text-center">Lvl</th>
              <th className="px-1 md:px-2 py-2 border-b border-warframe-gold/30 font-semibold text-center leading-tight">Wep<br/>Need</th>
              <th className="px-1 md:px-2 py-2 border-b border-warframe-gold/30 font-semibold text-center leading-tight">Dep<br/>Need</th>
              <th className="px-1 md:px-2 py-2 border-b border-warframe-gold/30 font-semibold hidden md:table-cell text-right">Wep XP</th>
              <th className="px-1 md:px-2 py-2 border-b border-warframe-gold/30 font-semibold hidden md:table-cell text-right">Dep XP</th>
              <th className="px-1 md:px-2 py-2 border-b border-warframe-gold/30 font-semibold text-right leading-tight">Total<br/>Acquired</th>
              <th className="px-1 md:px-2 py-2 border-b border-warframe-gold/30 font-semibold text-right leading-tight">Total<br/>Target</th>
              <th className="px-1 md:px-2 py-2 border-b border-warframe-gold/30 font-semibold text-right">Overshoot</th>
            </tr>
          </thead>
          <tbody>
            {projections.map((p, index) => {
              const totalAcquired = p.totalXpAchieved + currentXp;

              return (
                <m.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={p.rankData.rankNumber} 
                  className={cn(
                    "border-b border-warframe-gold/10 hover:bg-white/5 transition-colors duration-200",
                    index % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                  )}
                >
                  <td className="px-1 md:px-2 py-2 font-medium text-white truncate max-w-[80px] md:max-w-none text-[10px] md:text-xs" title={p.rankData.rankName}>{p.rankData.rankName}</td>
                  <td className="px-1 md:px-2 py-2 tabular-nums text-center text-[10px] md:text-xs">{p.rankData.rankNumber}</td>
                  <td className="px-1 md:px-2 py-2 tabular-nums text-center text-[10px] md:text-xs">{p.weapons}</td>
                  <td className="px-1 md:px-2 py-2 tabular-nums text-center text-[10px] md:text-xs">{p.deployables}</td>
                  <td className="px-1 md:px-2 py-2 tabular-nums text-right hidden md:table-cell text-[10px] md:text-xs">{p.weaponsXp.toLocaleString()}</td>
                  <td className="px-1 md:px-2 py-2 tabular-nums text-right hidden md:table-cell text-[10px] md:text-xs">{p.deployablesXp.toLocaleString()}</td>
                  <td className="px-1 md:px-2 py-2 tabular-nums font-bold text-white text-right text-[10px] md:text-xs">{totalAcquired.toLocaleString()}</td>
                  <td className="px-1 md:px-2 py-2 tabular-nums text-warframe-gold text-right text-[10px] md:text-xs">{p.rankData.totalXpRequired.toLocaleString()}</td>
                  <td className={cn(
                    "px-1 md:px-2 py-2 tabular-nums font-bold text-right text-[10px] md:text-xs",
                    p.xpDifference > 0 ? "text-green-400" : (p.xpDifference === 0 ? "text-gray-400" : "text-red-400")
                  )}>
                    {p.xpDifference > 0 ? `+${p.xpDifference.toLocaleString()}` : p.xpDifference.toLocaleString()}
                  </td>
                </m.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
