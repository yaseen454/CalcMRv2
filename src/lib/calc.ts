export interface MRData {
  rankNumber: number;
  rankName: string;
  totalXpRequired: number;
}

export const RANK_NAMES = [
  "Unranked",
  "Initiate",
  "Silver Initiate",
  "Gold Initiate",
  "Novice",
  "Silver Novice",
  "Gold Novice",
  "Disciple",
  "Silver Disciple",
  "Gold Disciple",
  "Seeker",
  "Silver Seeker",
  "Gold Seeker",
  "Hunter",
  "Silver Hunter",
  "Gold Hunter",
  "Eagle",
  "Silver Eagle",
  "Gold Eagle",
  "Tiger",
  "Silver Tiger",
  "Gold Tiger",
  "Dragon",
  "Silver Dragon",
  "Gold Dragon",
  "Sage",
  "Silver Sage",
  "Gold Sage",
  "Master",
  "Middle Master",
  "True Master",
  // Legendaries:
  "Legendary 1",
  "Legendary 2",
  "Legendary 3",
  "Legendary 4",
  "Legendary 5",
  "Legendary 6"
];

export const MAX_XP = 3135000;
export const MAX_RANK = 36; // True Master + 6 Legendaries = 30 + 6

export const WEAPON_XP = 3079;
export const DEPLOYABLE_XP = 6000;
export const MAX_WEAPONS = 662;
export const MAX_DEPLOYABLES = 167;

export function getRankData(rank: number): MRData {
  let xpRequirements = 0;
  if (rank <= 30) {
    xpRequirements = 2500 * Math.pow(rank, 2);
  } else {
    // Rank 30 requires 2,250,000 XP
    // Each legendary rank adds 147,500 XP
    xpRequirements = 2250000 + ((rank - 30) * 147500);
  }

  return {
    rankNumber: rank,
    rankName: RANK_NAMES[rank] || `Rank ${rank}`,
    totalXpRequired: xpRequirements
  };
}

export function getCurrentRank(xp: number): MRData {
  let currentRank = 0;
  for (let i = 1; i <= MAX_RANK; i++) {
    const data = getRankData(i);
    if (xp >= data.totalXpRequired) {
      currentRank = i;
    } else {
      break;
    }
  }
  return getRankData(currentRank);
}

export interface UpcomingRankProjection {
  rankData: MRData;
  weapons: number;
  deployables: number;
  weaponsXp: number;
  deployablesXp: number;
  totalXpAchieved: number;
  xpDifference: number;
}

export function calculateOptimalItems(
  targetXp: number,
  currentXp: number,
  weaponDistribution: number
): Omit<UpcomingRankProjection, "rankData" | "xpDifference"> {
  const totalXpNeeded = targetXp - currentXp;
  if (totalXpNeeded <= 0) {
    return { weapons: 0, deployables: 0, weaponsXp: 0, deployablesXp: 0, totalXpAchieved: 0 };
  }

  const targetWeaponsXp = totalXpNeeded * weaponDistribution;
  const weapons = Math.min(Math.ceil(targetWeaponsXp / WEAPON_XP), MAX_WEAPONS);
  const achievedWeaponsXp = weapons * WEAPON_XP;

  const remainingXp = totalXpNeeded - achievedWeaponsXp;
  // Make sure we never calculate negative deployables needed if weapons overshoots logic slightly
  const deployablesTarget = Math.max(0, remainingXp);
  const deployables = Math.min(Math.ceil(deployablesTarget / DEPLOYABLE_XP), MAX_DEPLOYABLES);
  const achievedDeployablesXp = deployables * DEPLOYABLE_XP;

  return {
    weapons,
    deployables,
    weaponsXp: achievedWeaponsXp,
    deployablesXp: achievedDeployablesXp,
    totalXpAchieved: achievedWeaponsXp + achievedDeployablesXp
  };
}

export function optimizeDistribution(currentXp: number): number {
  const currentRank = getCurrentRank(currentXp);
  const nextRank = currentRank.rankNumber + 1;
  if (nextRank > MAX_RANK) return 50;

  const data = getRankData(nextRank);
  let bestDist = 50;
  let minOvershoot = Infinity;

  for (let dist = 0; dist <= 100; dist += 1) {
    const optimal = calculateOptimalItems(data.totalXpRequired, currentXp, dist / 100);
    const overshoot = optimal.totalXpAchieved - (data.totalXpRequired - currentXp);
    
    if (overshoot >= 0 && overshoot < minOvershoot) {
      minOvershoot = overshoot;
      bestDist = dist;
    }
  }

  return bestDist;
}

export function getUpcomingRanks(currentXp: number, weaponDistribution: number): UpcomingRankProjection[] {
  const currentRank = getCurrentRank(currentXp);
  const projections: UpcomingRankProjection[] = [];

  for (let i = currentRank.rankNumber + 1; i <= MAX_RANK; i++) {
    const data = getRankData(i);
    const optimal = calculateOptimalItems(data.totalXpRequired, currentXp, weaponDistribution);
    
    projections.push({
      rankData: data,
      ...optimal,
      xpDifference: optimal.totalXpAchieved - (data.totalXpRequired - currentXp)
    });
  }

  return projections;
}
