import { useState, useMemo, useEffect } from "react";
import { Shield, Search } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { type Player } from "./data";
import { useData } from "../DataContext";
import { PlayerCard } from "./PlayerCard";

type Sort = "rating" | "goals" | "assists" | "matches" | "name";

export function Members() {
  const { data } = useData();
  const players = data?.players ?? [];
  const [selected, setSelected] = useState<Player | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("rating");
  const [period, setPeriod] = useState<string>("all");
  const [hasSetDefault, setHasSetDefault] = useState(false);

  useEffect(() => {
    if (data?.seasonsConfig && data.seasonsConfig.length > 0 && !hasSetDefault) {
      const now = new Date();
      const current = data.seasonsConfig.find(s => {
         if (!s.startDate || !s.endDate) return false;
         const start = new Date(s.startDate);
         const end = new Date(s.endDate);
         end.setHours(23, 59, 59, 999);
         return now >= start && now <= end;
      });
      if (current) {
         const idToSet = current.isPreSeason && current.parentSeasonId ? current.parentSeasonId : current.id;
         setPeriod(idToSet);
      }
      setHasSetDefault(true);
    }
  }, [data?.seasonsConfig, hasSetDefault]);

  const validRanges = useMemo(() => {
    if (period === "all" || !data?.seasonsConfig) return null;
    const selectedSeason = data.seasonsConfig.find((s) => s.id === period);
    if (!selectedSeason) return null;

    const mainTo = new Date(selectedSeason.endDate);
    mainTo.setHours(23, 59, 59, 999);
    const ranges = [{
      from: new Date(selectedSeason.startDate),
      to: mainTo
    }];
    
    const preSeasons = data.seasonsConfig.filter((s) => s.isPreSeason && s.parentSeasonId === selectedSeason.id);
    for (const ps of preSeasons) {
      const psTo = new Date(ps.endDate);
      psTo.setHours(23, 59, 59, 999);
      ranges.push({
        from: new Date(ps.startDate),
        to: psTo
      });
    }
    return ranges;
  }, [period, data?.seasonsConfig]);

  const activeMatches = useMemo(() => {
    if (!data?.matches) return [];
    if (!validRanges) return data.matches;
    return data.matches.filter(m => {
      const t = new Date(m.date).getTime();
      if (Number.isNaN(t)) return false;
      return validRanges.some(r => t >= r.from.getTime() && t <= r.to.getTime());
    });
  }, [data?.matches, validRanges]);

  const list = useMemo(() => {
    let arr = players.map(p => {
       if (period === "all") return p;
       
       let matches = 0, goals = 0, assists = 0;
       for (const m of activeMatches) {
          const isRed = m.redRoster?.some(r => r.id === p.id) || m.gkRed?.id === p.id;
          const isWhite = m.whiteRoster?.some(r => r.id === p.id) || m.gkWhite?.id === p.id;
          if (isRed || isWhite) matches++;
          for (const ev of m.events) {
             if (ev.type === "goal" && ev.playerId === p.id) goals++;
             if (ev.type === "goal" && ev.assistId === p.id) assists++;
          }
       }
       
       let rating = p.rating;
       if (p.evolution_chart && validRanges) {
          const periodChart = p.evolution_chart.filter(c => {
            const t = new Date(c.rawDate || c.date).getTime();
            if (Number.isNaN(t)) return false;
            return validRanges.some(r => t >= r.from.getTime() && t <= r.to.getTime());
          }).sort((a, b) => new Date(a.rawDate || a.date).getTime() - new Date(b.rawDate || b.date).getTime());
          
          if (periodChart.length > 0) {
            rating = periodChart[periodChart.length - 1].nota;
          } else {
            rating = data?.ratingRules?.base ?? 6.5;
          }
       }
       
       return { ...p, matches, goals, assists, rating };
    });

    if (period !== "all") {
       arr = arr.filter(p => p.matches > 0);
    }

    if (query.trim()) arr = arr.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    arr.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return (b as any)[sort] - (a as any)[sort];
    });
    return arr;
  }, [query, sort, players, period, activeMatches, validRanges, data?.ratingRules?.base]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-white tracking-tight text-2xl mb-1">Plantel</h1>
          <p className="text-[#858585] text-sm">{list.length} de {players.length} jogadores</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#858585]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jogador..."
              className="pl-9 pr-3 py-2 rounded-md bg-[#3C3C3C] border border-[#3E3E42] text-sm text-[#D4D4D4] placeholder:text-[#858585] focus:outline-none focus:border-[#007ACC]"
            />
          </div>
          
          {data?.seasonsConfig && data.seasonsConfig.length > 0 && (
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-md bg-[#3C3C3C] border border-[#3E3E42] text-sm text-[#D4D4D4] focus:outline-none focus:border-[#007ACC]"
            >
              <option value="all">Todas as Temporadas</option>
              {data.seasonsConfig.map(s => (
                <option key={s.id} value={s.id}>Temporada: {s.name}</option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="px-3 py-2 rounded-md bg-[#3C3C3C] border border-[#3E3E42] text-sm text-[#D4D4D4] focus:outline-none focus:border-[#007ACC]"
          >
            <option value="rating">Ordenar: Rating</option>
            <option value="goals">Ordenar: Gols</option>
            <option value="assists">Ordenar: Assistências</option>
            <option value="matches">Ordenar: Partidas</option>
            <option value="name">Ordenar: Nome</option>
          </select>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="rounded-md border border-[#3E3E42] bg-[#252526] p-12 text-center text-[#858585]">
          Sem dados ainda. Configure o Firebase em src/app/firebase.ts.
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-md border border-[#3E3E42] bg-[#252526] p-12 text-center text-[#858585]">
          Nenhum jogador encontrado para "{query}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="text-left rounded-md border border-[#3E3E42] bg-[#252526] p-5 hover:border-[#007ACC] transition-colors"
            >
              <div className="flex items-start justify-between">
                <ImageWithFallback src={p.avatar} alt={p.name} className="w-16 h-16 rounded-md object-cover border border-[#3E3E42]" />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1E1E1E] border border-[#3E3E42]">
                  <Shield className="w-3 h-3 text-[#89D185]" />
                  <span className="text-[#89D185] text-xs tabular-nums">{Number(p.rating).toFixed(1)}</span>
                </div>
              </div>
              <div className="mt-4 text-white tracking-tight">{p.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-[#858585] mt-0.5">#{p.id}</div>
              <div className="mt-4 pt-4 border-t border-[#3E3E42] grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[#D4D4D4] tabular-nums">{p.matches}</div><div className="text-[10px] text-[#858585] uppercase tracking-widest">PJ</div></div>
                <div><div className="text-[#D4D4D4] tabular-nums">{p.goals}</div><div className="text-[10px] text-[#858585] uppercase tracking-widest">Gols</div></div>
                <div><div className="text-[#D4D4D4] tabular-nums">{p.assists}</div><div className="text-[10px] text-[#858585] uppercase tracking-widest">Assist.</div></div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <PlayerCard player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
