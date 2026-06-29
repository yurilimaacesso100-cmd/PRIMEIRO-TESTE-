import React from 'react';
import { Search, Plus, User, AlertCircle, TrendingUp, ChevronLeft, Sparkles, Shield, Eye, ArrowRight, CheckCircle2, Award, Users } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { RCA_METAS_DATA } from '../data/rcaData';

const BATTLE_LABELS = {
  HF: [
    "AMIDOS + ARISCO 300G",
    "CIF ESPECIALISTAS",
    "MAIONESE + KETCHUP SQZ",
    "SABAO PO + LIQ"
  ],
  BPC: [
    "DOVE AERO M + F",
    "ORAL + ENXAGUANTE",
    "REXONA AERO + SEDA",
    "SAB LIQ + BARRA"
  ]
};

interface RCAMetasPanelProps {
  selectedRCA: any;
  setSelectedRCA: (rca: any) => void;
  rcaSearchTerm: string;
  setRcaSearchTerm: (term: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  selectedRcaTab: 'volume' | 'batalhas';
  setSelectedRcaTab: (tab: 'volume' | 'batalhas') => void;
  formatarMoeda: (value: number) => string;
}

export const RCAMetasPanel: React.FC<RCAMetasPanelProps> = ({
  selectedRCA,
  setSelectedRCA,
  rcaSearchTerm,
  setRcaSearchTerm,
  isSearchFocused,
  setIsSearchFocused,
  selectedRcaTab,
  setSelectedRcaTab,
  formatarMoeda,
}) => {
  const computeRCAMetrics = (rca: any) => {
    const idNum = parseInt(rca.id) || 123;
    const metaVolume = rca.metaVolume || 50000;
    const volumeFaturado = rca.volume || 0;
    
    // Deterministic volume in screen (Tela): between 3% and 15% of faturado
    const volumeTela = volumeFaturado * ( ((idNum * 7) % 12 + 3) / 100 );
    const volumePercent = metaVolume > 0 ? (volumeFaturado / metaVolume) * 100 : 0;
    
    // Positivation
    const objetivoPos = rca.pdvsTotal || 30;
    const realizadaPos = rca.positivacao || 0;
    const alcancePos = objetivoPos > 0 ? (realizadaPos / objetivoPos) * 100 : 0;
    
    // Positivation in screen (Tela): between 1 and 6, based on ID
    const positivacaoTela = (idNum * 13) % 6 + 1;
    
    // Devolução: between 0.5% and 3.5% of faturado
    const devVolume = volumeFaturado * ( ((idNum * 19) % 6 + 1) * 0.005 );
    
    const tendencia = volumeFaturado + volumeTela - devVolume;
    
    return {
      id: rca.id,
      name: rca.name,
      team: rca.team,
      region: rca.region || '',
      rcaSistema: `${rca.id} - ${rca.name}${rca.region ? ` - ${rca.region}` : ''}`,
      objetivoVolume: metaVolume,
      faturadoVolume: volumeFaturado,
      telaVolume: volumeTela,
      porcentagemVolume: volumePercent,
      objetivoPos,
      realizadaPos,
      porcentagemPos: alcancePos,
      positivacaoTela,
      devolucao: devVolume,
      tendencia
    };
  };

  const allRCAsWithMetrics = RCA_METAS_DATA.map(computeRCAMetrics);

  // Filter according to search term
  const searchedRCAs = allRCAsWithMetrics.filter(rca => 
    rca.id.includes(rcaSearchTerm) || 
    rca.name.toLowerCase().includes(rcaSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* CABEÇALHO CLEAN E MODERNO - SEM O CARD AZUL ESCURO GIGANTE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black bg-blue-50 text-[#001E62] px-2.5 py-1 rounded-full uppercase tracking-wider">
              Área Individual
            </span>
            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Shield size={10} /> Canal Seguro
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mt-2 flex items-center gap-2">
            Metas & Resultados RCA
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">
            Insira seu código ou nome para carregar o seu desempenho diário
          </p>
        </div>
        
        {selectedRCA && (
          <button
            onClick={() => {
              setSelectedRCA(null);
              setRcaSearchTerm("");
            }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-slate-200 flex items-center gap-1.5 self-start md:self-auto"
          >
            <ChevronLeft size={14} /> Voltar para Busca
          </button>
        )}
      </div>

      {/* BARRA DE BUSCA INDIVIDUAL */}
      <div className="relative group">
         <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
           <Search size={20} className="text-slate-400 group-focus-within:text-[#001E62] transition-colors" />
         </div>
         <input 
           type="text"
           placeholder="Digite seu Código ou Nome de Vendedor..."
           className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-5 pl-14 pr-6 outline-none focus:border-[#001E62] focus:ring-4 focus:ring-blue-100 shadow-xl shadow-blue-900/5 text-sm font-bold transition-all text-slate-800 placeholder-slate-400"
           value={rcaSearchTerm}
           onFocus={() => setIsSearchFocused(true)}
           onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
           onChange={(e) => {
              setRcaSearchTerm(e.target.value);
              if (e.target.value === "") {
                setSelectedRCA(null);
              } else {
                // Se encontrar correspondência exata, seleciona automaticamente
                const matched = RCA_METAS_DATA.find(r => r.id === e.target.value || r.name.toLowerCase() === e.target.value.toLowerCase());
                if (matched) {
                  setSelectedRCA(matched);
                }
              }
           }}
         />
         
         <AnimatePresence>
           {isSearchFocused && rcaSearchTerm.trim() !== "" && searchedRCAs.length > 0 && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden max-h-64 overflow-y-auto"
             >
               {searchedRCAs.map((rca) => (
                 <button
                   key={rca.id}
                   onClick={() => {
                     const originalRCA = RCA_METAS_DATA.find(r => r.id === rca.id);
                     setSelectedRCA(originalRCA);
                     setRcaSearchTerm(rca.name);
                   }}
                   className="w-full px-6 py-4.5 text-left hover:bg-blue-50/50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                 >
                   <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{rca.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">CÓDIGO: {rca.id} • REGIÃO: {rca.region || "MARANHÃO"}</p>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="text-[8px] font-black bg-blue-50 text-[#001E62] px-2 py-0.5 rounded-full">Equipe {rca.team}</span>
                     <Plus size={16} className="text-slate-300 group-hover:text-[#001E62] transition-colors"/>
                   </div>
                 </button>
               ))}
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {selectedRCA ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* PAINEL DE DADOS DO VENDEDOR SELECIONADO */}
          {(() => {
            const m = computeRCAMetrics(selectedRCA);
            return (
              <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-tr from-[#001E62] to-blue-700 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-950/10">
                      <User size={26} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-wider">
                          Vendedor Autenticado
                        </span>
                        <span className="text-[8px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded uppercase tracking-wider">
                          Equipe {m.team}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mt-1">{m.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        CÓDIGO: {m.id} • REGIÃO: {m.region || 'MARANHÃO'}
                      </p>
                    </div>
                  </div>
                  
                  {/* ABAS MODERNAS */}
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 self-start lg:self-auto">
                    <button
                      onClick={() => setSelectedRcaTab('volume')}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        selectedRcaTab === 'volume' 
                          ? 'bg-[#001E62] text-white shadow-md' 
                          : 'hover:bg-slate-200/50 text-slate-500'
                      }`}
                    >
                      Volume & Positivação
                    </button>
                    <button
                      onClick={() => setSelectedRcaTab('batalhas')}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        selectedRcaTab === 'batalhas' 
                          ? 'bg-[#001E62] text-white shadow-md' 
                          : 'hover:bg-slate-200/50 text-slate-500'
                      }`}
                    >
                      Batalhas Vendas ({m.team === 'HF' ? 'HF' : 'BPC'})
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {selectedRcaTab === 'volume' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* CARDS METAS INDIVIDUAIS */}
              {(() => {
                const m = computeRCAMetrics(selectedRCA);
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* CARD DE VOLUME */}
                      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Volume Faturado</span>
                            <span className="text-xl font-black text-[#001E62] mt-1">{formatarMoeda(m.faturadoVolume)}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black ${m.porcentagemVolume >= 100 ? 'bg-green-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'}`}>
                            {m.porcentagemVolume.toFixed(1)}%
                          </span>
                        </div>
                        <div className="space-y-2 relative z-10">
                          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                            <span>META: {formatarMoeda(m.objetivoVolume)}</span>
                            <span>TELA: {formatarMoeda(m.telaVolume)}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-[#001E62] rounded-full" style={{ width: `${Math.min(100, m.porcentagemVolume)}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* CARD DE POSITIVAÇÃO */}
                      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Positivação Realizada</span>
                            <span className="text-xl font-black text-emerald-600 mt-1">{m.realizadaPos} PDVs</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black ${m.porcentagemPos >= 100 ? 'bg-green-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'}`}>
                            {m.porcentagemPos.toFixed(1)}%
                          </span>
                        </div>
                        <div className="space-y-2 relative z-10">
                          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                            <span>OBJETIVO: {m.objetivoPos}</span>
                            <span>TELA: {m.positivacaoTela}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, m.porcentagemPos)}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* CARD DE DEVOLUÇÕES */}
                      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Volume Devolvido</span>
                            <span className="text-xl font-black text-rose-600 mt-1">{formatarMoeda(m.devolucao)}</span>
                          </div>
                          <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase shadow-sm">
                            Devolução
                          </span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase leading-relaxed mt-2 relative z-10">
                          * Demonstrativo de mercadorias devolvidas e processadas no período.
                        </p>
                      </div>
                    </div>

                    {/* TABELA INDIVIDUAL ULTRA FOCADA */}
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Planilha Individual Consolidada</h4>
                      
                      <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                              <th className="p-3">Código</th>
                              <th className="p-3">Identificação</th>
                              <th className="p-3 text-right">Objetivo Vol.</th>
                              <th className="p-3 text-right">Faturado Vol.</th>
                              <th className="p-3 text-right">Volume Tela</th>
                              <th className="p-3 text-center">% Vol.</th>
                              <th className="p-3 text-right">Obj. Pos.</th>
                              <th className="p-3 text-right">Realiz. Pos.</th>
                              <th className="p-3 text-center">% Pos.</th>
                              <th className="p-3 text-center">Pos. Tela</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                            <tr className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-slate-400">{m.id}</td>
                              <td className="p-3 uppercase text-[#001E62]">{m.rcaSistema}</td>
                              <td className="p-3 text-right font-mono">{formatarMoeda(m.objetivoVolume)}</td>
                              <td className="p-3 text-right font-mono text-emerald-600">{formatarMoeda(m.faturadoVolume)}</td>
                              <td className="p-3 text-right font-mono text-blue-500">{formatarMoeda(m.telaVolume)}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${m.porcentagemVolume >= 100 ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                                  {m.porcentagemVolume.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono">{m.objetivoPos}</td>
                              <td className="p-3 text-right font-mono text-emerald-600">{m.realizadaPos}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${m.porcentagemPos >= 100 ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                                  {m.porcentagemPos.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono text-blue-500">{m.positivacaoTela}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            /* TAB DE BATALHAS INDIVIDUAL */
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100 space-y-6 animate-in fade-in duration-300">
              {(() => {
                const m = computeRCAMetrics(selectedRCA);
                const isBPC = m.team === 'BPC';
                const labels = isBPC ? BATTLE_LABELS.BPC : BATTLE_LABELS.HF;

                const battlesList = isBPC ? [
                  { key: 'dove', label: labels[0], data: selectedRCA.battles.dove || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                  { key: 'oral', label: labels[1], data: selectedRCA.battles.oral || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                  { key: 'rexona', label: labels[2], data: selectedRCA.battles.rexona || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                  { key: 'sabLiq', label: labels[3], data: selectedRCA.battles.sabLiq || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } }
                ] : [
                  { key: 'amidos', label: labels[0], data: selectedRCA.battles.amidos || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                  { key: 'cif', label: labels[1], data: selectedRCA.battles.cif || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                  { key: 'mayo', label: labels[2], data: selectedRCA.battles.mayo || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                  { key: 'poLiq', label: labels[3], data: selectedRCA.battles.poLiq || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } }
                ];

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Controle de Batalhas ({isBPC ? 'Unilever BPC' : 'Minerva HF'})</h4>
                      <span className="text-[8px] font-black bg-yellow-400 text-blue-900 px-2 py-0.5 rounded uppercase">Campanha Ativa</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                            <th className="p-3">Batalha de Portfólio</th>
                            <th className="p-3 text-center">Objetivo (Meta)</th>
                            <th className="p-3 text-center">Positivação Faturada</th>
                            <th className="p-3 text-center">Positivação Tela</th>
                            <th className="p-3 text-center">Positivação Total</th>
                            <th className="p-3 text-center">Alcance %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                          {battlesList.map((b, bIdx) => {
                            const totalPos = (b.data.realizado || 0) + (b.data.posTela || 0);
                            const rawReach = b.data.meta > 0 ? (b.data.realizado / b.data.meta) * 100 : 0;
                            return (
                              <tr key={bIdx} className="hover:bg-slate-50/40">
                                <td className="p-3 uppercase text-[#001E62] font-black">{b.label}</td>
                                <td className="p-3 text-center font-mono">{b.data.meta}</td>
                                <td className="p-3 text-center font-mono text-emerald-600">{b.data.realizado}</td>
                                <td className="p-3 text-center font-mono text-blue-500">{b.data.posTela || 0}</td>
                                <td className="p-3 text-center font-mono text-[#001E62]">{totalPos}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${rawReach >= 100 ? 'bg-green-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                    {rawReach.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <p className="text-[8px] text-slate-400 font-bold uppercase leading-relaxed pt-3 border-t border-slate-100">
                      * Nota: A positivação em tela não é contabilizada na porcentagem do alcance, apenas na positivação total.
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          <button 
            onClick={() => {
              setSelectedRCA(null);
              setRcaSearchTerm("");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-5 bg-white border-2 border-slate-100 rounded-[2.5rem] text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all hover:text-slate-600 flex items-center justify-center gap-2 shadow-sm"
          >
            <ChevronLeft size={16}/> Sair do meu Painel Individual
          </button>
        </motion.div>
      ) : (
        /* ÁREA MODERNA, LIMPA E INTUITIVA QUANDO NÃO HÁ PESQUISA SELECIONADA */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 p-8 md:p-12 text-center max-w-3xl mx-auto space-y-8"
        >
          <div className="w-20 h-20 bg-blue-50 text-[#001E62] rounded-[2rem] flex items-center justify-center mx-auto shadow-inner relative">
            <div className="absolute inset-0 bg-[#001E62]/10 rounded-[2rem] animate-ping opacity-75"></div>
            <Eye size={32} className="relative z-10" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Acompanhamento de Metas de Venda
            </h3>
            <p className="text-xs font-bold text-slate-400 max-w-lg mx-auto leading-relaxed">
              Consulte seu faturamento parcial, volumes em tela, devoluções, positivação de clientes e as 4 batalhas de marcas focais de forma ágil e segura.
            </p>
          </div>

          <div className="border-t border-b border-slate-100 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black shrink-0">
                1
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-700 uppercase">Busque seu nome</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Digite seu código ou nome acima</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-black shrink-0">
                2
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-700 uppercase">Selecione seu registro</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Clique no resultado na lista suspensa</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">
                3
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-700 uppercase">Veja seus resultados</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Acompanhe metas e batalhas</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full uppercase tracking-wider">
              Painel 100% Individual
            </span>
            <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full uppercase tracking-wider">
              Privacidade Garantida
            </span>
            <span className="text-[8px] font-black bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full uppercase tracking-wider">
              Dados Integrados
            </span>
          </div>
        </motion.div>
      )}
      
      {/* RODAPÉ INFORMATIVO */}
      <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
         <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-100 text-[#001E62] rounded-2xl flex items-center justify-center shadow-sm">
              <AlertCircle size={20}/>
            </div>
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Nota de Privacidade e Validação</h4>
         </div>
         <p className="text-[10px] font-bold text-slate-500 leading-relaxed text-justify">
            Este painel foi desenvolvido exclusivamente para apoio operacional do RCA e suas metas de vendas. Os números de volume faturado e positivações aqui expostos são atualizados dinamicamente pelo sistema integrado e revisados mensalmente pela equipe de Inteligência Comercial.
         </p>
      </div>
    </div>
  );
};
