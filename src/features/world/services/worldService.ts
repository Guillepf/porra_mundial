import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type TeamRecord = {
  code: string;
  name: string | undefined;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export const worldService = {
  async getGroupMatches(group: string) {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('group', '==', group));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },

  async getAllGroupMatches() {
    const matchesRef = collection(db, 'matches');
    const snap = await getDocs(matchesRef);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },

  // Compute standings for a given group from finished group matches
  computeGroupStandings(groupMatches: any[]) {
    const table: Record<string, TeamRecord> = {};

    const ensure = (code: string, name?: string) => {
      if (!table[code]) {
        table[code] = {
          code,
          name,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDiff: 0,
          points: 0,
        };
      }
    };

    for (const m of groupMatches) {
      if (m.stage !== 'group') continue;
      const home = m.homeTeam.code;
      const away = m.awayTeam.code;
      ensure(home, m.homeTeam.name);
      ensure(away, m.awayTeam.name);

      if (!m.result) continue;

      const hg = m.result.homeGoals ?? 0;
      const ag = m.result.awayGoals ?? 0;

      const homeRec = table[home]!;
      const awayRec = table[away]!;

      homeRec.played += 1;
      awayRec.played += 1;
      homeRec.goalsFor += hg;
      homeRec.goalsAgainst += ag;
      awayRec.goalsFor += ag;
      awayRec.goalsAgainst += hg;

      if (hg > ag) {
        homeRec.wins += 1;
        awayRec.losses += 1;
        homeRec.points += 3;
      } else if (hg < ag) {
        awayRec.wins += 1;
        homeRec.losses += 1;
        awayRec.points += 3;
      } else {
        homeRec.draws += 1;
        awayRec.draws += 1;
        homeRec.points += 1;
        awayRec.points += 1;
      }
    }

    // finalize goal diff
    for (const k of Object.keys(table)) {
      const rec = table[k]!;
      rec.goalDiff = rec.goalsFor - rec.goalsAgainst;
    }

    // Helper: compute head-to-head mini table for a subset of codes
    const computeMiniTable = (codes: string[]) => {
      const mini: Record<string, { code: string; points: number; goalsFor: number; goalsAgainst: number; goalDiff: number }> = {};
      codes.forEach((c) => (mini[c] = { code: c, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 }));

      for (const m of groupMatches) {
        if (m.stage !== 'group' || !m.result) continue;
        const home = m.homeTeam.code;
        const away = m.awayTeam.code;
        if (!codes.includes(home) || !codes.includes(away)) continue;
        const hg = m.result.homeGoals ?? 0;
        const ag = m.result.awayGoals ?? 0;

        mini[home]!.goalsFor += hg;
        mini[home]!.goalsAgainst += ag;
        mini[away]!.goalsFor += ag;
        mini[away]!.goalsAgainst += hg;

        if (hg > ag) {
          mini[home]!.points += 3;
        } else if (hg < ag) {
          mini[away]!.points += 3;
        } else {
          mini[home]!.points += 1;
          mini[away]!.points += 1;
        }
      }

      const arr = Object.values(mini).map((r) => ({ ...r, goalDiff: r.goalsFor - r.goalsAgainst }));
      arr.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.code.localeCompare(b.code);
      });
      return arr;
    };

    // Helper: compute discipline penalty points (higher is worse). If no data, returns 0.
    const computeDisciplinePenalty = (code: string) => {
      // Look for card info in matches if present. Expected shape (optional):
      // match.result.cards = { home: { yellow: n, redDouble: n, redDirect: n, yellowPlusDirect: n }, away: { ... } }
      let penalty = 0;
      for (const m of groupMatches) {
        if (m.stage !== 'group') continue;
        const home = m.homeTeam.code;
        const away = m.awayTeam.code;
        const cards = m.result?.cards;
        if (!cards) continue;
        if (home === code && cards.home) {
          const c = cards.home;
          penalty += (c.yellow || 0) * 1;
          penalty += (c.redDouble || 0) * 3;
          penalty += (c.redDirect || 0) * 4;
          penalty += (c.yellowPlusDirect || 0) * 5;
        }
        if (away === code && cards.away) {
          const c = cards.away;
          penalty += (c.yellow || 0) * 1;
          penalty += (c.redDouble || 0) * 3;
          penalty += (c.redDirect || 0) * 4;
          penalty += (c.yellowPlusDirect || 0) * 5;
        }
      }
      return penalty;
    };

    // Resolve ties for an array of team codes according to the rules
    const resolveTie = (codes: string[]): string[] => {
      if (codes.length <= 1) return codes;

      // 1) Head-to-head among tied teams: points, goal diff, goals for
      const mini = computeMiniTable(codes);
      // group by mini keys to see equal clusters
      const groups: string[][] = [];
      if (mini.length === 0) return codes.slice();
      let currentCluster: string[] = [mini[0]!.code];
      for (let i = 1; i < mini.length; i++) {
        const prev = mini[i - 1]!;
        const cur = mini[i]!;
        if (cur.points === prev.points && cur.goalDiff === prev.goalDiff && cur.goalsFor === prev.goalsFor) {
          currentCluster.push(cur.code);
        } else {
          groups.push(currentCluster);
          currentCluster = [cur.code];
        }
      }
      groups.push(currentCluster);

      // If every team is in its own cluster (no ties remain) return mini order
      if (groups.every((c) => c.length === 1)) return mini.map((r) => r.code);

      // For clusters with >1, apply further criteria
      const result: string[] = [];
      for (const cluster of groups) {
        if (cluster.length === 1) {
          result.push(cluster[0]!);
          continue;
        }

        // 2) Apply overall criteria d) and e): goalDiff and goalsFor in all group matches
        const overallArr = cluster
          .map((code) => ({ code, goalDiff: table[code]!.goalDiff, goalsFor: table[code]!.goalsFor }))
          .sort((a, b) => {
            if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            return a.code.localeCompare(b.code);
          });

        // Check if overallArr resolved the cluster
        const overallClusters: string[][] = [];
        if (overallArr.length === 0) { overallArr.forEach((r) => result.push(r.code)); continue; }
        let curCl: string[] = [overallArr[0]!.code];
        for (let i = 1; i < overallArr.length; i++) {
          const p = overallArr[i - 1]!;
          const c = overallArr[i]!;
          if (c.goalDiff === p.goalDiff && c.goalsFor === p.goalsFor) curCl.push(c.code);
          else { overallClusters.push(curCl); curCl = [c.code]; }
        }
        overallClusters.push(curCl);

        if (overallClusters.every((c) => c.length === 1)) {
          overallArr.forEach((r) => result.push(r.code));
          continue;
        }

        // 2.f) For any remaining tied groups, apply fair play (f)
        for (const oc of overallClusters) {
          if (oc.length === 1) { result.push(oc[0]!); continue; }
          const withPenalties = oc
            .map((code) => ({ code, penalty: computeDisciplinePenalty(code) }))
            .sort((a, b) => {
              if (a.penalty !== b.penalty) return a.penalty - b.penalty; // less penalty better
              return a.code.localeCompare(b.code);
            });
          withPenalties.forEach((w) => result.push(w.code));
        }
      }

      return result;
    };

    // Build initial buckets by points
    const byPoints: Record<number, string[]> = {};
    for (const code of Object.keys(table)) {
      const rec = table[code]!;
      const pts = rec.points;
      if (!byPoints[pts]) byPoints[pts] = [];
      byPoints[pts].push(code);
    }

    const sortedPointKeys = Object.keys(byPoints).map(Number).sort((a, b) => b - a);
    const finalOrder: string[] = [];
    for (const pts of sortedPointKeys) {
      const codes = byPoints[pts] || [];
      if (codes.length === 1) {
        finalOrder.push(codes[0]!);
      } else if (codes.length > 1) {
        const resolved = resolveTie(codes as string[]);
        finalOrder.push(...resolved);
      }
    }

    // Map to rows
    const rows = finalOrder.map((code) => table[code]!);
    return rows;
  },

  // From all groups compute top2 + best 8 third-placed teams
  async computeQualifiedTeams() {
    const allMatches = await this.getAllGroupMatches();
    // group matches by group
    const groups: Record<string, any[]> = {};
    for (const m of allMatches) {
      if (m.stage !== 'group') continue;
      const key = m.group as string;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }

    const standingsByGroup: Record<string, any[]> = {};
    for (const g of Object.keys(groups)) {
      standingsByGroup[g] = this.computeGroupStandings(groups[g] || []);
    }

    const qualified: string[] = [];
    const thirdPlace: { code: string; points: number; goalDiff: number; goalsFor: number; group: string }[] = [];

    for (const g of Object.keys(standingsByGroup)) {
      const rows = standingsByGroup[g] || [];
      if (rows[0]) qualified.push(rows[0].code);
      if (rows[1]) qualified.push(rows[1].code);
      if (rows[2])
        thirdPlace.push({ code: rows[2].code, points: rows[2].points, goalDiff: rows[2].goalDiff, goalsFor: rows[2].goalsFor, group: g });
    }

    thirdPlace.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.group.localeCompare(b.group);
    });

    const bestThird = thirdPlace.slice(0, 8).map((t) => t.code);
    const allQualified = [...qualified, ...bestThird];

    return { standingsByGroup, bestThird, allQualified };
  },
};

export default worldService;
