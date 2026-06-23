// Documentação: Importamos o 'useState' do React para criar a memória do nosso componente
import { useState } from "react";
import { LayoutDashboard, BarChart3, History, Users, Trophy, Calendar, Handshake, Newspaper, BookOpen, Settings, Database, Activity } from "lucide-react";
import { Modal } from "./Modal";
import { useData } from "../DataContext";

export type Section = "dashboard" | "stats" | "history" | "members" | "hall" | "calendar" | "sponsors" | "press" | "wiki";

const items: { id: Section; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "stats", label: "Estatísticas dos Jogadores", icon: BarChart3 },
  { id: "history", label: "Peladas", icon: History },
  { id: "members", label: "Plantel", icon: Users },
  //{ id: "hall", label: "Hall of Fame", icon: Trophy },
  //{ id: "calendar", label: "Calendário", icon: Calendar },
  //{ id: "sponsors", label: "Patrocinadores", icon: Handshake },
  //{ id: "press", label: "Redação", icon: Newspaper },
  //{ id: "wiki", label: "Wiki", icon: BookOpen },
];

export function Sidebar({ active, onChange, mobileOpen, onCloseMobile }: { active: Section; onChange: (s: Section) => void, mobileOpen?: boolean, onCloseMobile?: () => void }) {
  // Documentação: Criamos o estado. Por padrão, começa como 'false' (aberta).
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const { data } = useData();

  const oldestMatch = data?.matches?.[data.matches.length - 1];
  const newestMatch = data?.matches?.[0];
  const startDate = oldestMatch ? new Date(oldestMatch.date).toLocaleDateString("pt-BR") : "N/A";
  const endDate = newestMatch ? new Date(newestMatch.date).toLocaleDateString("pt-BR") : "N/A";
  const totalMatches = data?.matches?.length || 0;
  const groupId = data?.groupId || "default";

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={onCloseMobile} />
      )}
      <aside 
        className={`shrink-0 bg-[#252526] border-r border-[#3E3E42] h-[100dvh] fixed md:sticky top-0 flex flex-col transition-all duration-300 ease-in-out z-50 ${
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-20" : "md:w-64"}`}
      >
      
      {/* Documentação: Transformamos esta div num botão. Ao clicar, inverte o valor de 'isCollapsed' */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        className={`px-6 py-5 flex items-center border-b border-[#3E3E42] hover:bg-[#2A2D2E] transition-colors cursor-pointer w-full text-left ${
          isCollapsed ? "justify-center px-0 hidden md:flex" : "gap-2.5"
        }`}
      >
        <div className="w-9 h-9 rounded-md flex items-center justify-center overflow-hidden border border-[#3E3E42] shrink-0">
          <img 
            src={`${import.meta.env.BASE_URL}society_favicon.jpeg`} 
            alt="Logo Society Futsal Club" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Documentação: Escondemos o texto se a barra estiver recolhida */}
        {!isCollapsed && (
          <div className="whitespace-nowrap overflow-hidden transition-all duration-300">
            <div className="text-white tracking-tight">Society</div>
            <div className="text-[11px] text-[#858585] uppercase tracking-widest">Futsal Club</div>
          </div>
        )}
      </button>

      <nav className="flex-1 p-3 space-y-1 overflow-x-hidden">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              title={isCollapsed ? it.label : ""} // Documentação: Mostra uma dica de ferramenta (tooltip) se estiver recolhido
              className={`w-full flex items-center py-2 rounded-md transition-colors ${
                // Documentação: Se recolhido, centra o ícone. Se aberto, alinha à esquerda com espaço.
                isCollapsed ? "justify-center px-0" : "gap-3 px-3 text-left"
              } ${
                isActive
                  ? "bg-[#007ACC]/15 text-white border-l-2 border-[#007ACC] -ml-[1px]"
                  : "text-[#CCCCCC] hover:text-white hover:bg-[#2A2D2E]"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#007ACC]" : ""}`} />
              
              {/* Documentação: Escondemos o texto do botão se a barra estiver recolhida */}
              {!isCollapsed && (
                <span className="text-sm whitespace-nowrap overflow-hidden">{it.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Documentação: Escondemos o rodapé da temporada inteiro se a barra estiver recolhida */}
      {!isCollapsed && (
        <button 
          onClick={() => setShowMetadata(true)}
          className="p-4 m-3 rounded-md bg-[#2D2D30] border border-[#3E3E42] whitespace-nowrap overflow-hidden transition-all duration-300 text-left hover:bg-[#333336] group"
        >
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs text-[#858585] group-hover:text-[#D4D4D4] transition-colors">Temporada</div>
            <Settings className="w-3.5 h-3.5 text-[#858585] group-hover:text-[#D4D4D4]" />
          </div>
          <div className="text-white">2026 / Q2</div>
          <div className="mt-2 h-1.5 rounded-full bg-[#3E3E42] overflow-hidden">
            <div className="h-full w-2/3 bg-[#89D185]" />
          </div>
        </button>
      )}

      </aside>

      <Modal open={showMetadata} onClose={() => setShowMetadata(false)} title="System Metadata Validation" size="md">
        <div className="space-y-6">
          <div className="bg-[#1E1E1E] border border-[#3E3E42] p-4 rounded-md">
            <div className="flex items-center gap-2 text-[#4FC3F7] font-medium mb-4 pb-2 border-b border-[#3E3E42]">
              <Database className="w-4 h-4" /> Configurações Estruturais
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#858585]">Group ID (Sync)</span>
                <span className="text-[#D4D4D4] font-mono">{groupId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#858585]">Rating Base Config</span>
                <span className="text-[#D4D4D4] font-mono">{data?.ratingRules?.base || "6.0"}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-[#858585]">Firebase Connection</span>
                <span className="px-2 py-0.5 rounded bg-[#89D185]/20 text-[#89D185] text-xs font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3" /> OK
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-[#3E3E42] p-4 rounded-md">
            <div className="flex items-center gap-2 text-[#89D185] font-medium mb-4 pb-2 border-b border-[#3E3E42]">
              <Calendar className="w-4 h-4" /> Dados da Temporada Atual
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#858585] mb-1">Início da Temporada</div>
                <div className="text-white tabular-nums">{startDate}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#858585] mb-1">Última Partida</div>
                <div className="text-white tabular-nums">{endDate}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] uppercase tracking-widest text-[#858585] mb-1">Total de Partidas Gravadas</div>
                <div className="text-white text-2xl tabular-nums">{totalMatches} <span className="text-sm text-[#858585] font-normal">jogos validados</span></div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}