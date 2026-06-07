import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './lib/AuthProvider';
import { Navigation } from './components/Navigation';
import { Slider } from './components/Slider';
import { RankTable } from './components/Table';
import { XpHistory } from './components/XpHistory';
import { getCurrentRank, getUpcomingRanks, UpcomingRankProjection, optimizeDistribution, optimizeAllRanks, OptimizationMethod, MAX_XP, MAX_RANK, WEAPON_XP, DEPLOYABLE_XP } from './lib/calc';
import { m, LazyMotion, domAnimation } from 'motion/react';
import { Server, Crosshair, Package, Cloud, ChevronsUp, Rocket, Target } from 'lucide-react';
import { cn } from './lib/utils';

function CalculatorCore() {
  const { user, loading, masteryXp, updateMasteryXp } = useAuth();
  
  const [xpInput, setXpInput] = useState<string>('');
  const [distribution, setDistribution] = useState<number>(50); // 50% Weapons vs Deployables
  const [currentRank, setCurrentRank] = useState(getCurrentRank(0));
  const [projections, setProjections] = useState<UpcomingRankProjection[]>([]);
  const [optimizationMethod, setOptimizationMethod] = useState<OptimizationMethod>('overshoot');
  const [activeOverview, setActiveOverview] = useState<'next' | 'all' | null>(null);

  // Sync initial XP from auth context
  useEffect(() => {
    if (!loading) {
      if (user !== null || (user === null && masteryXp > 0)) {
        const xpString = masteryXp.toLocaleString();
        setXpInput(xpString);
        const parsedXp = masteryXp;
        if (!isNaN(parsedXp) && parsedXp >= 0) {
          const rank = getCurrentRank(parsedXp);
          setCurrentRank(rank);
          const upcoming = getUpcomingRanks(parsedXp, distribution / 100);
          setProjections(upcoming);
        }
      } else {
        setXpInput('');
        setProjections([]);
        setCurrentRank(getCurrentRank(0));
        setActiveOverview(null);
      }
    }
  }, [user, masteryXp, loading]);

  // Handle auto-calc on sliderchange if valid XP exists
  useEffect(() => {
    const parsedXp = parseInt(xpInput.replace(/,/g, ''), 10);
    if (!isNaN(parsedXp) && parsedXp >= 0) {
      const rank = getCurrentRank(parsedXp);
      setCurrentRank(rank);
      const upcoming = getUpcomingRanks(parsedXp, distribution / 100);
      setProjections(upcoming);
    } else {
      setActiveOverview(null);
    }
  }, [distribution, xpInput]);

  const handleOptimize = useCallback(() => {
    const parsedXp = parseInt(xpInput.replace(/,/g, ''), 10);
    if (!isNaN(parsedXp) && parsedXp >= 0) {
      const bestDist = optimizeDistribution(parsedXp, optimizationMethod);
      setDistribution(bestDist);
      setActiveOverview('next');
    }
  }, [xpInput, optimizationMethod]);

  const handleOptimizeAll = useCallback(() => {
    const parsedXp = parseInt(xpInput.replace(/,/g, ''), 10);
    if (!isNaN(parsedXp) && parsedXp >= 0) {
      const bestDist = optimizeAllRanks(parsedXp, optimizationMethod);
      setDistribution(bestDist);
      setActiveOverview('all');
    }
  }, [xpInput, optimizationMethod]);

  const rawXpInput = parseInt(xpInput.replace(/,/g, ''), 10) || 0;
  const progressPercentage = Math.min((rawXpInput / MAX_XP) * 100, 100).toFixed(2);
  const isMaxRank = rawXpInput >= MAX_XP;


  return (
    <div className="min-h-screen bg-warframe-bg text-gray-100 font-sans selection:bg-warframe-blue/30 selection:text-white pb-20">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        
        {/* Header Section */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-warframe-gold/10">
            <Server className="h-8 w-8 text-warframe-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-warframe-blue to-warframe-gold mb-4">
            Mastery Rank Calculator
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Plan your journey to Legendary Rank 6. Enter your current Mastery XP, adjust your preferred item distribution, and see exactly what you need to grind.
          </p>
        </m.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <m.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/40 border border-white/5 p-6 rounded-xl backdrop-blur-md shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warframe-blue to-transparent"></div>
              
              <h2 className="text-xl font-display font-semibold text-white mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <Crosshair className="h-5 w-5 mr-2 text-warframe-blue" />
                  Current Status
                </div>
                {user && (
                  <div className={cn(
                    "flex items-center space-x-2 text-xs font-medium px-2 py-1 rounded transition-colors",
                    loading ? "text-warframe-gold bg-warframe-gold/10" : "text-warframe-blue bg-warframe-blue/10"
                  )}>
                    <Cloud className={cn("h-4 w-4", loading && "animate-pulse")} />
                    <span>{loading ? "Syncing..." : "Cloud Sync"}</span>
                  </div>
                )}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Mastery XP
                  </label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      value={xpInput}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        if (rawValue === '') {
                          setXpInput('');
                        } else {
                          setXpInput(parseInt(rawValue, 10).toLocaleString());
                        }
                      }}
                      onBlur={() => {
                        const parsedXp = parseInt(xpInput.replace(/,/g, ''), 10);
                        if (!isNaN(parsedXp) && parsedXp >= 0 && parsedXp !== masteryXp) {
                          updateMasteryXp(parsedXp);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="e.g. 150000"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-warframe-blue focus:border-transparent transition-all font-mono"
                    />
                  </div>
                  {user && masteryXp > 0 && (
                    <p className="text-xs text-gray-500 mt-2 font-mono">
                      Last cloud save: {masteryXp.toLocaleString()} XP
                    </p>
                  )}
                </div>

                {projections.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-warframe-gold uppercase tracking-wider">{currentRank.rankName} (MR {currentRank.rankNumber})</span>
                      <span className="text-xs text-gray-400 font-mono">{progressPercentage}% / LR6</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <m.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          isMaxRank ? "bg-warframe-gold" : "bg-warframe-blue"
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </m.div>

            {projections.length > 0 && (
              <m.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-black/40 border border-white/5 p-6 rounded-xl backdrop-blur-md shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warframe-gold to-transparent"></div>
                
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-display font-semibold text-white flex items-center">
                    <Package className="h-5 w-5 mr-2 text-warframe-gold" />
                    Distribution
                  </h2>
                  <span className="text-sm font-mono text-warframe-gold bg-warframe-gold/10 px-3 py-1.5 rounded-lg border border-warframe-gold/20">
                    {distribution}% W / {100 - distribution}% D
                  </span>
                </div>

                <div className="mb-6">
                  <Slider 
                    value={[distribution]} 
                    max={100} 
                    step={1} 
                    onValueChange={(val) => setDistribution(val[0])} 
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium uppercase tracking-wider mb-6">
                    <span>Deployables</span>
                    <span>Weapons</span>
                  </div>
                  {/* Optimization Strategy Dropdown - Shared across both operations */}
                  <div className="bg-black/30 border border-white/5 rounded-lg p-3.5 mb-4 flex flex-col space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-warframe-blue" />
                      Optimization Method
                    </label>
                    <select
                      value={optimizationMethod}
                      onChange={(e) => setOptimizationMethod(e.target.value as OptimizationMethod)}
                      className="bg-[#0b0e14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-warframe-blue/50 cursor-pointer w-full hover:border-white/20 transition-colors"
                    >
                      <option value="overshoot" className="bg-[#0b0e14]">Overshoot (Min Wasted XP)</option>
                      <option value="equal" className="bg-[#0b0e14]">Equal-Items (Weps = Deps)</option>
                      <option value="least" className="bg-[#0b0e14]">Least-Items (Min Farming)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={handleOptimize}
                      className="bg-warframe-blue hover:bg-warframe-blue/80 text-black font-semibold px-4 py-2.5 rounded-lg transition-colors text-xs text-center font-display uppercase tracking-wider w-full"
                      title="Optimize distribution based on the chosen criteria for your next rank only"
                    >
                      Optimize Next Rank
                    </button>
                    <button
                      onClick={handleOptimizeAll}
                      className="bg-warframe-gold hover:bg-warframe-gold/80 text-black font-semibold px-4 py-2.5 rounded-lg transition-colors text-xs text-center font-display uppercase tracking-wider w-full"
                      title="Optimize distribution to minimize average milestones across all upcoming ranks simultaneously"
                    >
                      Optimize All Ranks
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-400 leading-relaxed bg-white/5 p-4 rounded-lg">
                  <span className="text-warframe-blue font-medium">Weapons</span> (Primaries, Secondaries, Melees, etc.) average {WEAPON_XP.toLocaleString()} XP each. <br className="my-2"/>
                  <span className="text-warframe-gold font-medium">Deployables</span> (Warframes, Companions, Archwings) grant {DEPLOYABLE_XP.toLocaleString()} XP each.
                </div>
              </m.div>
            )}

            {projections.length > 0 && (
              <XpHistory />
            )}
          </div>

          {/* Right Column: Results Table */}
          <div className="lg:col-span-8">
            {projections.length > 0 ? (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {activeOverview === 'next' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 px-1 mb-2">
                      <div className="h-4 w-1 bg-warframe-gold rounded-full"></div>
                      <h3 className="text-lg font-display uppercase tracking-widest text-white/90">Next Rank Overview</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {/* Next Rank Card */}
                      <div className="bg-black/30 border border-warframe-gold/20 rounded-lg p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-warframe-gold/40 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-warframe-gold/50 group-hover:bg-warframe-gold transition-colors"></div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Next Rank</span>
                          <ChevronsUp className="h-4 w-4 text-warframe-gold" />
                        </div>
                        <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                          MR {projections[0].rankData.rankNumber}
                        </div>
                        <div className="text-xs text-warframe-gold mt-1 truncate" title={projections[0].rankData.rankName}>
                          {projections[0].rankData.rankName}
                        </div>
                      </div>

                      {/* Weapons */}
                      <div className="bg-black/30 border border-warframe-blue/20 rounded-lg p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-warframe-blue/40 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-warframe-blue/50 group-hover:bg-warframe-blue transition-colors"></div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Weapons</span>
                          <Crosshair className="h-4 w-4 text-warframe-blue" />
                        </div>
                        <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                          {projections[0].weapons}
                        </div>
                        <div className="text-xs text-warframe-blue mt-1">
                          Required
                        </div>
                      </div>

                      {/* Deployables */}
                      <div className="bg-black/30 border border-indigo-400/20 rounded-lg p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-indigo-400/40 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-400/50 group-hover:bg-indigo-400 transition-colors"></div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Deployables</span>
                          <Rocket className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                          {projections[0].deployables}
                        </div>
                        <div className="text-xs text-indigo-400 mt-1">
                          Required
                        </div>
                      </div>

                      {/* Overshoot */}
                      <div className="bg-black/30 border border-emerald-400/20 rounded-lg p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-emerald-400/40 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400/50 group-hover:bg-emerald-400 transition-colors"></div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Overshoot</span>
                          <Target className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">
                           {projections[0].xpDifference > 0 ? `+${projections[0].xpDifference.toLocaleString()}` : '0'}
                        </div>
                        <div className="text-xs text-emerald-400 mt-1">
                          Wasted XP
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-400 leading-relaxed bg-white/[0.01] border border-white/5 p-4 rounded-lg mb-6">
                      For your next rank <span className="text-warframe-gold font-medium">MR {projections[0].rankData.rankNumber} ({projections[0].rankData.rankName})</span>, you need exactly <span className="text-warframe-blue font-semibold">{projections[0].weapons} weapons</span> and <span className="text-indigo-400 font-semibold">{projections[0].deployables} deployables</span>. 
                      {optimizationMethod === 'overshoot' && (
                        <span> This is optimized using the <span className="text-emerald-400 font-medium">Overshoot Method</span> to ensure you waste the minimum possible extra Mastery XP upon leveling up.</span>
                      )}
                      {optimizationMethod === 'equal' && (
                        <span> This is optimized using the <span className="text-emerald-400 font-medium font-mono">Equal-Items Method</span>, focusing on balancing the numeric item workloads as evenly as possible (<span className="text-white">weps ≈ deps</span>).</span>
                      )}
                      {optimizationMethod === 'least' && (
                        <span> This is optimized using the <span className="text-emerald-400 font-medium">Least-Items Method</span>, ensuring you have to farm and level up the overall minimum total count of separate items.</span>
                      )}
                    </div>
                  </div>
                )}

                {activeOverview === 'all' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 px-1 mb-2 pt-2">
                      <div className="h-4 w-1 bg-warframe-blue rounded-full"></div>
                      <h3 className="text-lg font-display uppercase tracking-widest text-white/90">All Ranks Overview</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {/* Goal Card */}
                      <div className="bg-black/30 border border-warframe-gold/20 rounded-lg p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-warframe-gold/40 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-warframe-gold/50 group-hover:bg-warframe-gold transition-colors"></div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ultimate Goal</span>
                          <ChevronsUp className="h-4 w-4 text-warframe-gold" />
                        </div>
                        <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                          MR {MAX_RANK}
                        </div>
                        <div className="text-xs text-warframe-gold mt-1 truncate">
                          Legendary 6
                        </div>
                      </div>

                      {/* Total Weapons */}
                      <div className="bg-black/30 border border-warframe-blue/20 rounded-lg p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-warframe-blue/40 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-warframe-blue/50 group-hover:bg-warframe-blue transition-colors"></div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Weapons</span>
                          <Crosshair className="h-4 w-4 text-warframe-blue" />
                        </div>
                        <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                          {projections[projections.length - 1]?.weapons ?? 0}
                        </div>
                        <div className="text-xs text-warframe-blue mt-1 font-mono">
                          Needed
                        </div>
                      </div>

                      {/* Total Deployables */}
                      <div className="bg-black/30 border border-indigo-400/20 rounded-lg p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-indigo-400/40 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-400/50 group-hover:bg-indigo-400 transition-colors"></div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Deployables</span>
                          <Rocket className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                          {projections[projections.length - 1]?.deployables ?? 0}
                        </div>
                        <div className="text-xs text-indigo-400 mt-1 font-mono">
                          Required
                        </div>
                      </div>

                      {/* Avg Overshoot */}
                      <div className="bg-black/30 border border-emerald-400/20 rounded-lg p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-emerald-400/40 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400/50 group-hover:bg-emerald-400 transition-colors"></div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Overshoot</span>
                          <Target className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">
                           +{Math.round(projections.reduce((sum, p) => sum + p.xpDifference, 0) / projections.length).toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-400 mt-1 font-mono">
                          Wasted XP
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-400 leading-relaxed bg-white/[0.02] border border-white/5 p-4 rounded-lg mb-6">
                      Based on your preferred distribution, upgrading to <span className="text-warframe-gold font-medium">Legendary 6</span> requires a total of <span className="text-warframe-blue font-semibold">{projections[projections.length - 1]?.weapons ?? 0} weapons</span> and <span className="text-indigo-400 font-semibold">{projections[projections.length - 1]?.deployables ?? 0} deployables</span>. Across all <span className="text-white font-medium">{projections.length}</span> remaining mastery ranks, this distribution results in an average overshoot of <span className="text-emerald-400 font-bold">{(projections.reduce((sum, p) => sum + p.xpDifference, 0) / projections.length).toLocaleString(undefined, {maximumFractionDigits: 0})} XP</span>. 
                      {optimizationMethod === 'overshoot' && (
                        <span> The active multi-rank path is configured with the <span className="text-warframe-gold font-medium">Overshoot Criterion</span>, meaning it aims to suppress the total wasted XP accumulated across all visual milestone increments.</span>
                      )}
                      {optimizationMethod === 'equal' && (
                        <span> The active multi-rank path focuses on the <span className="text-warframe-gold font-medium font-mono">Equal-Items Criterion</span>, meaning it seeks a balanced visual milestone roadmap minimizing disparity between cumulative weapons and deployables.</span>
                      )}
                      {optimizationMethod === 'least' && (
                        <span> The active multi-rank path is driven by the <span className="text-warframe-gold font-medium">Least-Items Criterion</span>, optimizing to reduce the overall count of total legendary items you must grind from start to finish.</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 px-1 mb-2 pt-2">
                  <div className="h-4 w-1 bg-warframe-blue rounded-full"></div>
                  <h3 className="text-lg font-display uppercase tracking-widest text-white/90">Path to Mastery</h3>
                </div>
                <RankTable projections={projections} currentXp={parseInt(xpInput.replace(/,/g, ''), 10) || 0} />
              </m.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center min-h-[400px] border border-white/5 border-dashed rounded-xl bg-white/[0.01]">
                <Server className="h-12 w-12 text-gray-600 mb-4 opacity-50" />
                <p className="text-gray-500 font-medium uppercase tracking-widest text-sm">Enter XP to generate roadmap</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <AuthProvider>
        <CalculatorCore />
      </AuthProvider>
    </LazyMotion>
  );
}
