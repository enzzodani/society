import React, { useState, useMemo } from "react";
import {
  X, Flame, Handshake, Dribbble, Users, ThumbsUp, ThumbsDown,
  Smile, Frown, Scale, Shield, Trophy, TrendingDown, Activity,
  AlertTriangle, AlertOctagon, Goal, Info, Search
} from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useData } from "../DataContext";
import type { Player, PlayerAdvanced } from "./data";
import { PlayerComparison } from "./PlayerComparison";

function MainStat({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="rounded-md bg-[#1E1E1E] border border-[#3E3E42] p-4 relative group">
      <div className="text-3xl tabular-nums tracking-tight" style={{ color: color || "#FFFFFF" }}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-[#858585] mt-1">{label}</div>
    </div>
  );
}

function AdvCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#1E1E1E] border border-[#3E3E42] rounded-md p-3 flex flex-col items-start gap-1 relative overflow-hidden group hover:border-[#4FC3F7]/50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-[#2D2D30] border border-[#3E3E42] flex items-center justify-center shrink-0 mb-1">
        <Icon className="w-4 h-4 text-[#4FC3F7] group-hover:scale-110 transition-transform" />
      </div>
      <div className="flex-1 min-w-0 w-full z-10">
        <div className="text-[9px] uppercase tracking-widest text-[#858585] mb-0.5 line-clamp-1" title={label}>{label}</div>
        <div className="text-sm text-[#D4D4D4] font-medium truncate w-full" title={value}>{value}</div>
      </div>
      {sub && <div className="absolute top-3 right-3 text-[10px] text-[#89D185] font-bold tabular-nums bg-[#252526] px-1.5 py-0.5 rounded border border-[#3E3E42] z-10 shadow-sm">{sub}</div>}
    </div>
  );
}

const EMPTY_BUCKET = { name: "—", count: 0 };
const EMPTY_ADV: PlayerAdvanced = {
  topAssisted: EMPTY_BUCKET,
  topAssister: EMPTY_BUCKET,
  mostPlayedWith: EMPTY_BUCKET,
  mostWinsWith: EMPTY_BUCKET,
  mostLossesWith: EMPTY_BUCKET,
  mostPlayedAgainst: EMPTY_BUCKET,
  mostWinsAgainst: EMPTY_BUCKET,
  mostLossesAgainst: EMPTY_BUCKET,
  mostDrawsAgainst: EMPTY_BUCKET,
  hatTricks: 0,
  cleanSheets: 0,
  ownGoals: 0,
  yellowCards: 0,
  redCards: 0,
  biggestWinScore: "—",
  biggestLossScore: "—",
  maxUnbeatenStreak: 0,
  totalTeamGoals: 0,
};

export function PlayerCard({ player, onClose }: { player: Player; onClose: () => void }) {
  const { data } = useData();
  const rules = data?.ratingRules;
  const [showRatingBreakdown, setShowRatingBreakdown] = useState(false);
  const [showRadarInfo, setShowRadarInfo] = useState(false);
  const [evolutionFilter, setEvolutionFilter] = useState<string>('last');
  const [customFrom, setCustomFrom] = useState("2026-01-01");
  const [customTo, setCustomTo] = useState("2026-12-31");
  const [activeTab, setActiveTab] = useState<'rating' | 'form'>('rating');
  const [showSelector, setShowSelector] = useState(false);
  const [comparingWith, setComparingWith] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const a = player.advanced ?? EMPTY_ADV;
  const ga = player.goals + player.assists;

  let clutchGoals = 0;
  data?.matches.forEach(m => {
    let redScore = 0;
    let whiteScore = 0;
    const durationMin = parseInt(m.duration?.split(":")[0] || "7", 10);

    let maxGa = -1;
    let mvps: string[] = [];
    const goalsMap = new Map<string, number>();
    const assistsMap = new Map<string, number>();
    m.events.forEach(e => {
      if (e.type === "goal" && e.playerId) {
        const isRed = m.redRoster?.some(r => r.id === e.playerId) || String(e.team).toLowerCase().includes("red") || String(e.team).toLowerCase().includes("vermelho");
        const tied = redScore === whiteScore;
        
        if (isRed) redScore++; else whiteScore++;

        goalsMap.set(e.playerId, (goalsMap.get(e.playerId) || 0) + 1);
        
        if (e.playerId === player.id && tied && e.time) {
          const min = parseInt(e.time.split(":")[0], 10);
          if (!isNaN(min) && min >= (durationMin - 1)) {
            clutchGoals++;
          }
        }
      }
    });
  });
  
  const matchMvpCount = data?.sessions?.filter(s => s.mvpId === player.id).length || 0;

  // Radar Chart calculations matching Flutter's player_detail.dart
  const games = player.matches || 1;
  const attackScore = Math.min(100, (player.goals / games) * 100);
  const visionScore = Math.min(100, (player.assists / games) * 100);
  const defenseScore = Math.min(100, ((a.cleanSheets || 0) / games) * 200);
  const teamGoals = a.totalTeamGoals || 0;
  const indirectGoals = Math.max(0, teamGoals - player.goals - player.assists);
  const tacticScore = teamGoals > 0 ? (indirectGoals / teamGoals) * 100 : 0;
  const ganaScore = Math.min(100, ((player.wins * 3 + player.draws * 1) / (games * 3)) * 100);

  const radarData = [
    { subject: 'Ataque', A: attackScore, fullMark: 100 },
    { subject: 'Visão', A: visionScore, fullMark: 100 },
    { subject: 'Defesa', A: defenseScore, fullMark: 100 },
    { subject: 'Tática', A: tacticScore, fullMark: 100 },
    { subject: 'Gana', A: ganaScore, fullMark: 100 },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr; // Already formatted (e.g. J.1)
    
    // For monthly grouping "YYYY-MM"
    if (dateStr.length === 7 && dateStr.indexOf('-') === 4) {
      const [y, m] = dateStr.split('-');
      return `${m}/${y.slice(2)}`;
    }
    
    // For full dates
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(2);
      return `${dd}/${mm}/${yy}`;
    }
    
    return dateStr;
  };

  const activePeriodRanges = useMemo(() => {
    if (evolutionFilter === "all") return null;

    const selectedSeason = data?.seasonsConfig?.find(s => s.id === evolutionFilter);
    if (selectedSeason && data?.seasonsConfig) {
      const mainTo = new Date(selectedSeason.endDate);
      mainTo.setHours(23, 59, 59, 999);
      const ranges = [{
        from: new Date(selectedSeason.startDate),
        to: mainTo
      }];
      const preSeasons = data.seasonsConfig.filter(s => s.isPreSeason && s.parentSeasonId === selectedSeason.id);
      for (const ps of preSeasons) {
        const psTo = new Date(ps.endDate);
        psTo.setHours(23, 59, 59, 999);
        ranges.push({
          from: new Date(ps.startDate),
          to: psTo
        });
      }
      return ranges;
    }

    let refDate = new Date();
    if (data?.matches && data.matches.length > 0) {
      const latestMatchTime = Math.max(...data.matches.map(m => new Date(m.date).getTime()).filter(t => !isNaN(t)));
      if (latestMatchTime > 0) {
        refDate = new Date(latestMatchTime);
      }
    }

    if (evolutionFilter === "last") {
      return [{ 
        from: new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0),
        to: new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999)
      }];
    }
    
    if (evolutionFilter === "month") {
      return [{ 
        from: new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0, 0), 
        to: new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999) 
      }];
    }
    
    if (evolutionFilter === "year") {
      return [{ 
        from: new Date(refDate.getFullYear(), 0, 1, 0, 0, 0, 0), 
        to: new Date(refDate.getFullYear(), 11, 31, 23, 59, 59, 999) 
      }];
    }

    if (evolutionFilter === "custom") {
      const [fy, fm, fd] = customFrom.split("-").map(Number);
      const [ty, tm, td] = customTo.split("-").map(Number);
      return [{
        from: new Date(fy, (fm || 1) - 1, fd || 1, 0, 0, 0, 0),
        to: new Date(ty, (tm || 1) - 1, td || 1, 23, 59, 59, 999),
      }];
    }
    
    return null;
  }, [evolutionFilter, data?.seasonsConfig, data?.matches, customFrom, customTo]);

  // Evolution Chart Logic
  const evolutionChartData = useMemo(() => {
    const rawChart: {date: string, nota: number}[] = (player as any).evolution_chart || [];
    if (!rawChart || rawChart.length === 0) return [];

    const processedChart = rawChart.map((item, idx) => {
      return {
        date: item.date || `J.${idx + 1}`,
        rawDate: item.date,
        nota: Number(item.nota) || 0
      };
    });
    
    if (!activePeriodRanges) {
      return processedChart;
    }
    
    return processedChart.filter(item => {
      const t = new Date(item.rawDate).getTime();
      if (isNaN(t)) return true; // keep items without a proper date parse
      return activePeriodRanges.some(r => t >= r.from.getTime() && t <= r.to.getTime());
    });
  }, [player, evolutionFilter, activePeriodRanges]);

  // Form Chart Logic (Goals, Assists, G+A over time)
  const formChartData = useMemo(() => {
    const chartData: {date: string, rawDate: string, goals: number, assists: number, ga: number}[] = [];
    if (!data?.matches) return chartData;
    
    // Get matches chronologically
    const sortedMatches = [...data.matches].sort((m1, m2) => {
       const t1 = new Date(m1.date).getTime();
       const t2 = new Date(m2.date).getTime();
       return t1 - t2;
    });

    const grouped: Record<string, { rawDate: string, goals: number, assists: number }> = {};

    for (const m of sortedMatches) {
      const isRed = m.redRoster?.some(r => r.id === player.id) || m.gkRed?.id === player.id;
      const isWhite = m.whiteRoster?.some(r => r.id === player.id) || m.gkWhite?.id === player.id;
      if (!isRed && !isWhite) continue;

      let g = 0; let a = 0;
      for (const ev of m.events) {
        if (ev.type === 'goal') {
          if (ev.playerId === player.id) g++;
          if (ev.assistId === player.id) a++;
        }
      }
      
      const sessionDate = formatDate(m.date);
      if (!grouped[sessionDate]) {
        grouped[sessionDate] = { rawDate: m.date, goals: 0, assists: 0 };
      }
      grouped[sessionDate].goals += g;
      grouped[sessionDate].assists += a;
    }
    
    for (const [date, stats] of Object.entries(grouped)) {
      chartData.push({
        date,
        rawDate: stats.rawDate,
        goals: stats.goals,
        assists: stats.assists,
        ga: stats.goals + stats.assists
      });
    }

    if (!activePeriodRanges) {
       return chartData;
    }
    
    return chartData.filter(item => {
      const t = new Date(item.rawDate).getTime();
      if (isNaN(t)) return true;
      return activePeriodRanges.some(r => t >= r.from.getTime() && t <= r.to.getTime());
    });
  }, [data?.matches, player.id, evolutionFilter, activePeriodRanges]);

  const dynamicStats = useMemo(() => {
    let statGa = 0, statGoals = 0, statAssists = 0, statWins = 0, statDraws = 0, statLosses = 0;
    
    if (evolutionFilter === 'all') {
      return {
         ga: player.goals + player.assists,
         goals: player.goals,
         assists: player.assists,
         wins: player.wins,
         draws: player.draws,
         losses: player.losses,
      };
    }

    if (!data?.matches) return { ga: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0 };

    const playerMatches = data.matches.filter(m => {
      const isRed = m.redRoster?.some(r => r.id === player.id) || m.gkRed?.id === player.id;
      const isWhite = m.whiteRoster?.some(r => r.id === player.id) || m.gkWhite?.id === player.id;
      return isRed || isWhite;
    }).sort((m1, m2) => new Date(m1.date).getTime() - new Date(m2.date).getTime());

    let filteredMatches = playerMatches;

    if (activePeriodRanges) {
      filteredMatches = playerMatches.filter(m => {
         const t = new Date(m.date).getTime();
         if (isNaN(t)) return true;
         return activePeriodRanges.some(r => t >= r.from.getTime() && t <= r.to.getTime());
      });
    }

    let matchCount = 0;

    for (const m of filteredMatches) {
      const isRed = m.redRoster?.some(r => r.id === player.id) || m.gkRed?.id === player.id;
      const isWhite = m.whiteRoster?.some(r => r.id === player.id) || m.gkWhite?.id === player.id;

      if (isRed || isWhite) matchCount++;

      let matchGoals = 0;
      let matchAssists = 0;
      for (const ev of m.events) {
        if (ev.type === 'goal') {
          if (ev.playerId === player.id) matchGoals++;
          if (ev.assistId === player.id) matchAssists++;
        }
      }

      statGoals += matchGoals;
      statAssists += matchAssists;
      statGa += (matchGoals + matchAssists);

      const redWin = m.scoreA > m.scoreB;
      const whiteWin = m.scoreB > m.scoreA;
      if ((isRed && redWin) || (isWhite && whiteWin)) statWins++;
      else if (!redWin && !whiteWin) statDraws++;
      else statLosses++;
    }

    return { matches: matchCount, ga: statGa, goals: statGoals, assists: statAssists, wins: statWins, draws: statDraws, losses: statLosses };
  }, [data?.matches, player, evolutionFilter, activePeriodRanges]);

  const dynamicRating = useMemo(() => {
    if (evolutionFilter === 'all') return player.rating;
    
    const rawChart: {date: string, nota: number, rawDate: string}[] = (player as any).evolution_chart || [];
    if (rawChart.length > 0 && activePeriodRanges) {
        const periodChart = rawChart.filter(c => {
          const t = new Date(c.rawDate || c.date).getTime();
          if (Number.isNaN(t)) return false;
          return activePeriodRanges.some(r => t >= r.from.getTime() && t <= r.to.getTime());
        }).sort((a, b) => new Date(a.rawDate || a.date).getTime() - new Date(b.rawDate || b.date).getTime());
        
        if (periodChart.length > 0) {
          return periodChart[periodChart.length - 1].nota;
        }
    }
    // Retorna a base ou 6.5 caso não tenha jogado na temporada
    return rules?.base ?? 6.5;
  }, [player, evolutionFilter, activePeriodRanges, rules]);

  // Achievements / Badges Logic
  const badges = useMemo(() => {
    const list = [];
    if (player.goals >= 50) list.push({ icon: Flame, name: "Artilheiro Ouro", desc: "50+ Gols", color: "#FFD700" });
    else if (player.goals >= 20) list.push({ icon: Flame, name: "Artilheiro Prata", desc: "20+ Gols", color: "#C0C0C0" });
    
    if (player.assists >= 30) list.push({ icon: Handshake, name: "Garçom Mestre", desc: "30+ Assis.", color: "#4FC3F7" });
    
    if (matchMvpCount >= 5) list.push({ icon: Trophy, name: "Rei da Pelada", desc: "5+ MVPs", color: "#FFD700" });
    else if (matchMvpCount >= 2) list.push({ icon: Trophy, name: "MVP", desc: "2+ MVPs", color: "#CD7F32" });

    if (a.hatTricks >= 3) list.push({ icon: Goal, name: "Goleador Nato", desc: "3+ Hat-Tricks", color: "#89D185" });
    if (clutchGoals >= 2) list.push({ icon: Activity, name: "Clutch", desc: "2+ Gols Decisivos", color: "#F48771" });
    
    if (player.gkStats && player.gkStats.clean_sheets >= 5) list.push({ icon: Shield, name: "Paredão", desc: "5+ Clean Sheets", color: "#DCDCAA" });
    
    if (a.ownGoals >= 3) list.push({ icon: Frown, name: "Inimigo Íntimo", desc: "3+ Gols Contra", color: "#F48771" });
    
    return list;
  }, [player, matchMvpCount, a, clutchGoals]);

  // Breakdown Rating Math: replaced by static legend matching the app
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#252526] border border-[#3E3E42] rounded-md max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#252526] border-b border-[#3E3E42] p-5 flex items-center gap-4 z-40">
          <ImageWithFallback src={player.avatar} alt={player.name} className="w-14 h-14 rounded-md object-cover border border-[#3E3E42]" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-xl tracking-tight">{player.name}</div>
            <div className="flex items-center gap-2 text-xs text-[#858585] mt-1 relative">
              <span>#{player.id.slice(0, 8)}</span>
              <span>·</span>
              <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                    onMouseEnter={() => setShowRatingBreakdown(true)}
                    onMouseLeave={() => setShowRatingBreakdown(false)}>
                <span>Rating <strong className="text-[#89D185] tabular-nums">{dynamicRating.toFixed(2)}</strong></span>
                <Info className="w-3 h-3 text-[#4FC3F7]" />
              </span>
              <span>·</span>
              <span>Jogos <strong className="text-[#D4D4D4] tabular-nums">{dynamicStats.matches}</strong></span>
              
              {/* RATING BREAKDOWN POPUP */}
              {showRatingBreakdown && (
                <div className="absolute top-full left-10 mt-2 w-72 bg-[#252526] border border-[#3E3E42] p-4 rounded-md shadow-2xl z-50 text-xs text-[#D4D4D4]">
                  <div className="font-bold text-white mb-2 pb-1 border-b border-[#3E3E42]">Composição da Nota</div>
                  <div className="mb-3 text-[#858585] text-[10px] leading-relaxed">
                    A sua nota é a média do seu desempenho em todas as partidas jogadas. Cada partida começa com uma Nota Base e sofre ajustes com base nos seus eventos em campo:
                  </div>
                  <div className="flex justify-between py-1"><span>Nota Base</span><span className="text-white">{rules?.base ?? "6.5"}</span></div>
                  <div className="flex justify-between py-1"><span>Gol Feito</span><span className="text-[#89D185]">+{rules?.goal ?? "0.9"}</span></div>
                  <div className="flex justify-between py-1"><span>Assistência</span><span className="text-[#89D185]">+{rules?.assist ?? "0.8"}</span></div>
                  <div className="flex justify-between py-1"><span>Vitória</span><span className="text-[#89D185]">+{rules?.win ?? "1.5"}</span></div>
                  <div className="flex justify-between py-1"><span>Derrota</span><span className="text-[#F48771]">{rules?.loss ?? "-1.5"}</span></div>
                  <div className="flex justify-between py-1"><span>Cartão Amarelo</span><span className="text-[#DCDCAA]">{rules?.yellow ?? "-1.0"}</span></div>
                  <div className="flex justify-between py-1"><span>Cartão Vermelho</span><span className="text-[#F48771]">{rules?.red ?? "-2.0"}</span></div>
                  <div className="flex justify-between py-1"><span>Gol Contra</span><span className="text-[#F48771]">{rules?.own_goal ?? "-1.0"}</span></div>
                  
                  <div className="mt-3 text-[10px] text-[#858585] italic leading-tight border-t border-[#3E3E42] pt-2">
                    * Nota EMA: A nota final considera um bônus residual de temporadas passadas (comportamento de carrego de nota base para veteranos).
                  </div>
                  <div className="flex justify-between py-1 mt-2 font-bold text-white text-sm">
                    <span className="text-[#4FC3F7]">Sua Média Atual:</span>
                    <span className="text-[#4FC3F7]">{dynamicRating.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-col items-start gap-3 w-full">
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setShowSelector(true)} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#007ACC] hover:bg-[#005A9E] text-white text-xs font-medium transition"
                >
                  <Scale className="w-3.5 h-3.5" /> Comparar X1
                </button>

                <div className="flex items-center bg-[#1E1E1E] border border-[#3E3E42] rounded-md p-0.5 flex-wrap">
                  {data?.seasonsConfig && data.seasonsConfig.length > 0 && (
                    <select 
                      value={data.seasonsConfig.find(s => s.id === evolutionFilter) ? evolutionFilter : ""}
                      onChange={(e) => {
                        if (e.target.value) setEvolutionFilter(e.target.value);
                      }}
                      className="bg-transparent text-[10px] uppercase text-[#007ACC] font-bold px-2 py-0.5 outline-none cursor-pointer"
                    >
                      <option value="" disabled>Temporadas</option>
                      {data.seasonsConfig.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#252526] text-[#D4D4D4]">
                          Temporada: {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {data?.seasonsConfig && data.seasonsConfig.length > 0 && <div className="w-px h-3 bg-[#3E3E42] mx-1"></div>}
                  <button onClick={() => setEvolutionFilter('last')} className={`px-2 py-0.5 rounded text-[10px] uppercase ${evolutionFilter === 'last' ? "bg-[#007ACC] text-white" : "text-[#CCCCCC] hover:text-white"}`}>Última Pelada</button>
                  <button onClick={() => setEvolutionFilter('month')} className={`px-2 py-0.5 rounded text-[10px] uppercase ${evolutionFilter === 'month' ? "bg-[#007ACC] text-white" : "text-[#CCCCCC] hover:text-white"}`}>Mês</button>
                  <button onClick={() => setEvolutionFilter('year')} className={`px-2 py-0.5 rounded text-[10px] uppercase ${evolutionFilter === 'year' ? "bg-[#007ACC] text-white" : "text-[#CCCCCC] hover:text-white"}`}>Ano</button>
                  <button onClick={() => setEvolutionFilter('all')} className={`px-2 py-0.5 rounded text-[10px] uppercase ${evolutionFilter === 'all' ? "bg-[#007ACC] text-white" : "text-[#CCCCCC] hover:text-white"}`}>Tudo</button>
                  <button onClick={() => setEvolutionFilter('custom')} className={`px-2 py-0.5 rounded text-[10px] uppercase ${evolutionFilter === 'custom' ? "bg-[#007ACC] text-white" : "text-[#CCCCCC] hover:text-white"}`}>Personalizado</button>
                </div>
              </div>
              
              {evolutionFilter === 'custom' && (
                <div className="px-3 py-2 rounded-md border border-[#3E3E42] bg-[#1E1E1E] flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] uppercase tracking-widest text-[#858585]">Período</span>
                  <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-2 py-0.5 rounded bg-[#252526] border border-[#3E3E42] text-xs text-[#D4D4D4] focus:outline-none focus:border-[#007ACC]" />
                  <span className="text-[10px] text-[#858585]">até</span>
                  <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-2 py-0.5 rounded bg-[#252526] border border-[#3E3E42] text-xs text-[#D4D4D4] focus:outline-none focus:border-[#007ACC]" />
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-md bg-[#2D2D30] border border-[#3E3E42] hover:bg-[#3E3E42] flex items-center justify-center shrink-0 self-start">
            <X className="w-4 h-4 text-[#CCCCCC]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[#858585] mb-3">Estatísticas Principais ({evolutionFilter === 'all' ? 'Todo o Histórico' : 'Filtradas'})</div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <MainStat label="G + A" value={dynamicStats.ga} color="#89D185" />
              <MainStat label="Gols" value={dynamicStats.goals} />
              <MainStat label="Assistências" value={dynamicStats.assists} color="#DCDCAA" />
              <MainStat label="Vitórias" value={dynamicStats.wins} color="#89D185" />
              <MainStat label="Empates" value={dynamicStats.draws} />
              <MainStat label="Derrotas" value={dynamicStats.losses} color="#F48771" />
            </div>
          </div>

          <div>
            <div className="flex flex-col h-full w-full">
              <div className="flex items-center justify-between mb-2 gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => setActiveTab('rating')} className={`text-[11px] uppercase tracking-widest transition-colors ${activeTab === 'rating' ? 'text-[#4FC3F7]' : 'text-[#858585] hover:text-[#D4D4D4]'}`}>Evolução (Nota)</button>
                  <button onClick={() => setActiveTab('form')} className={`text-[11px] uppercase tracking-widest transition-colors ${activeTab === 'form' ? 'text-[#89D185]' : 'text-[#858585] hover:text-[#D4D4D4]'}`}>Correlação (G+A)</button>
                </div>
              </div>
              <div className="rounded-md bg-[#1E1E1E] border border-[#3E3E42] w-full h-[350px] p-4">
                {activeTab === 'rating' ? (
                  evolutionChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolutionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3E3E42" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#858585', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: '#858585', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#252526', borderColor: '#3E3E42', color: '#D4D4D4' }}
                          itemStyle={{ color: '#007ACC' }}
                          labelFormatter={formatDate}
                          formatter={(value: number | string) => [Number(value).toFixed(2), 'Nota']}
                        />
                        <Line type="monotone" dataKey="nota" stroke="#007ACC" strokeWidth={3} dot={{ fill: '#007ACC', r: 4 }} activeDot={{ r: 6, fill: '#4FC3F7' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-[#858585]">Gráfico indisponível</div>
                  )
                ) : (
                  formChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3E3E42" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#858585', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#858585', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#252526', borderColor: '#3E3E42', color: '#D4D4D4' }}
                          labelFormatter={formatDate}
                        />
                        <Line name="G+A" type="monotone" dataKey="ga" stroke="#4FC3F7" strokeWidth={3} dot={false} isAnimationActive={false} />
                        <Line name="Gols" type="monotone" dataKey="goals" stroke="#89D185" strokeWidth={2} dot={{ fill: '#89D185', r: 3 }} isAnimationActive={false} />
                        <Line name="Assistências" type="monotone" dataKey="assists" stroke="#DCDCAA" strokeWidth={2} dot={{ fill: '#DCDCAA', r: 3 }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-[#858585]">Gráfico de forma indisponível</div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2 relative">
                <div className="text-[11px] uppercase tracking-widest text-[#858585]">Desempenho (Radar)</div>
                <Info 
                  className="w-3.5 h-3.5 text-[#858585] cursor-pointer hover:text-white transition-colors" 
                  onMouseEnter={() => setShowRadarInfo(true)}
                  onMouseLeave={() => setShowRadarInfo(false)}
                />
                {showRadarInfo && (
                  <div className="absolute bottom-full mb-2 left-0 w-64 bg-[#252526] border border-[#3E3E42] p-3 rounded-md shadow-2xl z-50 text-xs">
                    <div className="font-bold text-white mb-2 pb-1 border-b border-[#3E3E42]">Entenda o Gráfico</div>
                    <div className="mb-1"><strong className="text-[#4FC3F7]">Ataque:</strong> Média de gols por jogo.</div>
                    <div className="mb-1"><strong className="text-[#4FC3F7]">Visão:</strong> Média de assistências por jogo.</div>
                    <div className="mb-1"><strong className="text-[#4FC3F7]">Defesa:</strong> Frequência de clean sheets.</div>
                    <div className="mb-1"><strong className="text-[#4FC3F7]">Tática:</strong> Participação em gols indiretos do time.</div>
                    <div><strong className="text-[#4FC3F7]">Gana:</strong> Aproveitamento de vitórias.</div>
                  </div>
                )}
              </div>
              <div className="rounded-md bg-[#1E1E1E] border border-[#3E3E42] h-64 flex items-center justify-center p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#3E3E42" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#858585', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Stats" dataKey="A" stroke="#007ACC" fill="#007ACC" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="text-[11px] uppercase tracking-widest text-[#858585] mb-2">Conquistas & Badges <Trophy className="inline w-3 h-3 text-[#FFD700] ml-1" /></div>
              {badges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {badges.map((b, i) => (
                    <div key={i} className="bg-[#1E1E1E] border border-[#3E3E42] rounded-md px-3 py-2 flex items-center gap-2 relative overflow-hidden group hover:border-[#4FC3F7]/50 transition-colors w-[calc(50%-0.25rem)]">
                      <b.icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" style={{ color: b.color }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-[#D4D4D4] truncate">{b.name}</span>
                        <span className="text-[9px] text-[#858585] truncate">{b.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[#858585] bg-[#1E1E1E] border border-[#3E3E42] rounded-md p-4 flex items-center justify-center h-full min-h-[100px]">Nenhuma badge conquistada.</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-widest text-[#858585] mb-2">Estatísticas Avançadas</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <AdvCard icon={Flame} label="Hat-Tricks" value={`${a.hatTricks} marcados`} />
              <AdvCard icon={Goal} label="Gols Decisivos" value={`${clutchGoals} marcados`} sub="Desempate (Último min)" />
              <AdvCard icon={Trophy} label="MVP da Pelada" value={`${matchMvpCount} vezes`} sub="Maior G+A" />
              <AdvCard icon={Shield} label="Sem sofrer gol" value={`${a.cleanSheets} jogos`} />
              <AdvCard icon={Trophy} label="Maior Vitória" value={a.biggestWinScore} />
              <AdvCard icon={TrendingDown} label="Maior Derrota" value={a.biggestLossScore} />
              <AdvCard icon={Activity} label="Sequência Invicta" value={`${a.maxUnbeatenStreak} jogos`} />
              <AdvCard icon={Goal} label="Gols do Time" value={`${a.totalTeamGoals} gols`} />
              <AdvCard icon={AlertTriangle} label="Cartões Amarelos" value={`${a.yellowCards}`} />
              <AdvCard icon={AlertOctagon} label="Cartões Vermelhos" value={`${a.redCards}`} />
              <AdvCard icon={Frown} label="Gols Contra" value={`${a.ownGoals}`} />
              <AdvCard icon={Handshake} label="Mais o Assistiu" value={a.topAssister.name} sub={`${a.topAssister.count} ass`} />
              <AdvCard icon={Dribbble} label="Mais Assistiu" value={a.topAssisted.name} sub={`${a.topAssisted.count} ass`} />
              <AdvCard icon={Users} label="Mais Jogou Junto" value={a.mostPlayedWith.name} sub={`${a.mostPlayedWith.count} j.`} />
              <AdvCard icon={ThumbsUp} label="Mais Venceu Junto" value={a.mostWinsWith.name} sub={`${a.mostWinsWith.count} v.`} />
              <AdvCard icon={ThumbsDown} label="Mais Perdeu Junto" value={a.mostLossesWith.name} sub={`${a.mostLossesWith.count} d.`} />
              <AdvCard icon={Users} label="Mais Enfrentou" value={a.mostPlayedAgainst.name} sub={`${a.mostPlayedAgainst.count} j.`} />
              <AdvCard icon={Smile} label="Maior Freguês" value={a.mostWinsAgainst.name} sub={`${a.mostWinsAgainst.count} v.`} />
              <AdvCard icon={Frown} label="Carrasco (Contra)" value={a.mostLossesAgainst.name} sub={`${a.mostLossesAgainst.count} d.`} />
              <AdvCard icon={Scale} label="Rival Equilibrado" value={a.mostDrawsAgainst.name} sub={`${a.mostDrawsAgainst.count} e.`} />
            </div>
          </div>

          {player.gkStats && player.gkStats.games > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[#858585] mb-2">Estatísticas de Goleiro</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <AdvCard icon={Shield} label="Partidas" value={`${player.gkStats.games} jogos`} />
                <AdvCard icon={Trophy} label="Vitórias" value={`${player.gkStats.wins} vitórias`} />
                <AdvCard icon={Activity} label="Clean Sheets" value={`${player.gkStats.clean_sheets} jogos`} />
                <AdvCard icon={TrendingDown} label="Gols Sofridos" value={`${player.gkStats.goals_conceded} gols`} />
                <AdvCard icon={Activity} label="Média Sofridos" value={`${(player.gkStats.goals_conceded / player.gkStats.games).toFixed(2)} / jogo`} />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showSelector && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSelector(false)}>
          <div className="bg-[#252526] border border-[#3E3E42] rounded-md max-w-sm w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#3E3E42]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-sm font-medium tracking-tight">Escolher Adversário</h3>
                <button onClick={() => setShowSelector(false)} className="text-[#858585] hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#858585]" />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar jogador..." className="w-full pl-9 pr-3 py-2 rounded-md bg-[#1E1E1E] border border-[#3E3E42] text-sm text-[#D4D4D4] focus:outline-none focus:border-[#007ACC]" />
              </div>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {data?.players.filter(p => p.id !== player.id && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <button key={p.id} onClick={() => { setComparingWith(p); setShowSelector(false); }} className="w-full flex items-center gap-3 p-2 hover:bg-[#2A2D2E] rounded-md text-left transition-colors">
                  <ImageWithFallback src={p.avatar} alt={p.name} className="w-8 h-8 rounded-md object-cover border border-[#3E3E42]" />
                  <div className="flex-1">
                    <div className="text-sm text-[#D4D4D4]">{p.name}</div>
                    <div className="text-[10px] text-[#858585]">Rating: {p.rating.toFixed(2)}</div>
                  </div>
                </button>
              ))}
              {data?.players.filter(p => p.id !== player.id && p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="p-4 text-center text-sm text-[#858585]">Nenhum jogador encontrado.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {comparingWith && (
        <PlayerComparison playerA={player} playerB={comparingWith} onClose={() => setComparingWith(null)} />
      )}
    </div>
  );
}
