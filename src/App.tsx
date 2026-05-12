import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Gift, Trash2, Plus, Share2, CheckCircle2, Search, Calculator, User, Briefcase, Users, RefreshCw, Loader2, Camera, FileText, Sparkles, AlertCircle, Lock, Clock, BarChart3, TrendingUp, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { RCA_METAS_DATA } from './data/rcaData';

/**
 * BONIFICAÇÃO UNILEVER - v12.0
 * CRIADO POR YURI LIMA
 * REGRAS: Design Intocado | Arredondamento 0.52 | Base de Produtos via Google Sheets
 */

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSu-AB7a5WEcbUwdqYrBbosDZMTXmEqBH-fPWxsairBggIpjz4XmmzXT76maDkCx3ewinpuLWW__-j0/pub?output=csv";

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

const App = () => {
  const [isSupervisorMode, setIsSupervisorMode] = useState(false);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bonusText, setBonusText] = useState("");
  const [orderImage, setOrderImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [produtosBD, setProdutosBD] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState<{ open: boolean, target: 'venda' | 'bonifica', uid: number | null }>({ open: false, target: 'venda', uid: null });
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [isMetasUnlocked, setIsMetasUnlocked] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'bonificacao' | 'metas'>('bonificacao');
  const [rcaSearchTerm, setRcaSearchTerm] = useState("");
  const [selectedRCA, setSelectedRCA] = useState<any>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredRCAs = RCA_METAS_DATA.filter(rca => 
        rca.id.includes(rcaSearchTerm) || 
        rca.name.toLowerCase().includes(rcaSearchTerm.toLowerCase())
      );

  const [metasData, setMetasData] = useState({
    volume: "",
    positivacao: "",
    PDVsTotal: "",
    batalhas: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [headerData, setHeaderData] = useState({
    equipe: "",
    supervisor: "",
    cd: "",
    vendedor: "",
    cliente: "",
    pedido: "",
    prazo: ""
  });

  const [blocos, setBlocos] = useState([
    {
      uid: Date.now(),
      vendaCod: "",
      vendaQtd: '',
      vendaPNota: '',
      bonificaId: "",
      inputBuscaBonifica: "",
      bonificaPrecoPraticado: '',
      reportedBonus: '',
      res: { saldo: 0, bonus: 0, valorBonificado: 0, rentabilidade: 0 }
    }
  ]);

  const [copiado, setCopiado] = useState(false);

  const fetchData = async () => {
    setIsLoadingDB(true);
    try {
      const response = await fetch(SHEET_CSV_URL);
      if (!response.ok) throw new Error("Erro ao acessar a planilha");
      
      const csvData = await response.text();
      const rows = csvData.split(/\r?\n/).map(row => {
        // Handle CSV cells that might contain commas within quotes
        const matches = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : row.split(',').map(c => c.trim());
      });
      
      if (rows.length < 2) throw new Error("Planilha vazia ou mal formatada");
      
      const headers = rows[0].map(h => h.trim().toUpperCase());
      
      // Encontra os índices das colunas baseados nos nomes fornecidos pelo usuário
      const idxId = headers.findIndex(h => h.includes("CODIGO") || h.includes("CÓDIGO"));
      const idxNome = headers.findIndex(h => h.includes("PRODUTO") && !h.includes("CODIGO"));
      const idxPromo = headers.findIndex(h => h.includes("PROMOCIONAL") || h.includes("PROMO") || h.includes("MÍNIMO") || h.includes("MINIMO"));
      const idxIdeal = headers.findIndex(h => h.includes("IDEAL") || h.includes("TABELA") || h.includes("PREÇO") || h.includes("PRECO"));

      const parsePrice = (val: string | undefined) => {
        if (!val) return 0;
        const clean = val.replace(/[^\d,.-]/g, '').replace(',', '.');
        return parseFloat(clean) || 0;
      };

      const formattedData = rows.slice(1)
        .filter(row => row[idxNome] && row[idxNome].trim() !== "")
        .map(row => {
          const id = row[idxId]?.trim() || "";
          const nome = row[idxNome]?.trim() || "";
          const promo = parsePrice(row[idxPromo]);
          const ideal = parsePrice(row[idxIdeal]);
          
          return {
            id,
            nome,
            ideal,
            promo,
            preco: promo > 0 ? promo : ideal // Prioriza Promo se existir
          };
        });

      setProdutosBD(formattedData.sort((a, b) => a.id.localeCompare(b.id)));
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError("Erro ao carregar banco de dados de produtos.");
      console.error(err);
    } finally {
      setIsLoadingDB(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  useEffect(() => {
    if (produtosBD.length === 0) return;

    const novosBlocos = blocos.map(bloco => {
      const prodVenda = produtosBD.find(p => p.id === bloco.vendaCod.trim());
      const prodBonifica = produtosBD.find(p => p.id === bloco.bonificaId);
      
      const precoNotaVenda = parseFloat(bloco.vendaPNota) || 0;
      const qtdVenda = parseFloat(bloco.vendaQtd) || 0;
      const precoBonifica = parseFloat(bloco.bonificaPrecoPraticado) || (prodBonifica ? prodBonifica.preco : 0);

      // A fórmula solicitada é: (Preço de Nota - Preço Praticado) * Quantidade / Preço Praticado
      // O investimento é gerado pela diferença entre o preço vendido e o preço praticado (promoção)
      const totalInvestimento = (precoNotaVenda - precoBonifica) * qtdVenda;

      const qtdBruta = precoBonifica > 0 ? totalInvestimento / precoBonifica : 0;
      
      // Regra de arredondamento solicitada:
      // 1. Se o investimento for menor que o preço praticado (qtdBruta < 1), bônus é 0
      // 2. Se a parte decimal for >= 0.78, arredonda para cima (ex: 1.79 -> 2)
      // 3. Caso contrário, mantém o inteiro (ex: 1.77 -> 1)
      let bonusFinal = 0;
      if (qtdBruta >= 1) {
        const decimal = Number((qtdBruta % 1).toFixed(4));
        bonusFinal = decimal >= 0.78 ? Math.ceil(qtdBruta) : Math.floor(qtdBruta);
      }

      // O valor da bonificação exibido agora é o total do investimento (diferença * quantidade)
      // conforme solicitado pelo usuário (ex: 0,60 * 120 = 72)
      return { 
        ...bloco, 
        res: { 
          saldo: totalInvestimento, 
          bonus: bonusFinal > 0 ? bonusFinal : 0, 
          valorBonificado: totalInvestimento > 0 ? totalInvestimento : 0,
          rentabilidade: 0
        } 
      };
    });

    if (JSON.stringify(novosBlocos.map(b => b.res)) !== JSON.stringify(blocos.map(b => b.res))) {
      setBlocos(novosBlocos);
    }
  }, [blocos, produtosBD]);

  const addBloco = () => {
    setBlocos([...blocos, {
      uid: Date.now() + Math.random(),
      vendaCod: "",
      vendaQtd: '',
      vendaPNota: '',
      bonificaId: "",
      inputBuscaBonifica: "",
      bonificaPrecoPraticado: '',
      reportedBonus: '',
      res: { saldo: 0, bonus: 0, valorBonificado: 0, rentabilidade: 0 }
    }]);
  };

  const removeBloco = (uid: number) => {
    if (blocos.length > 1) setBlocos(blocos.filter(b => b.uid !== uid));
  };

  const updateBloco = (uid: number, fields: any) => {
    setBlocos(blocos.map(b => {
      if (b.uid === uid) {
        let updated = { ...b, ...fields };
        if (fields.inputBuscaBonifica !== undefined) {
          const match = produtosBD.find(p => p.id === fields.inputBuscaBonifica.trim());
          if (match) {
            updated.bonificaId = match.id;
            updated.bonificaPrecoPraticado = match.preco.toString();
          }
        }
        return updated;
      }
      return b;
    }));
  };

  const getGeneratedMessage = () => {
    let msg = `EQUIPE:${headerData.equipe}\n`;
    msg += `CD:${headerData.cd}\n`;
    msg += `CLIENTE:${headerData.cliente}\n`;
    msg += `RCA:${headerData.vendedor}\n`;
    msg += `Nº DO PEDIDO: ${headerData.pedido}\n`;
    msg += `SUPERVISOR:${headerData.supervisor}\n`;
    msg += `PRAZO:${headerData.prazo}\n\n`;
    
    const blocosComBonus = blocos.filter(b => b.res.bonus > 0);

    // Parte 1: Códigos e Quantidades
    blocosComBonus.forEach((b) => {
      msg += `${b.bonificaId}-${b.res.bonus}\n`;
    });
    
    if (blocosComBonus.length > 0) {
      msg += `\n`;
    }

    // Parte 2: Detalhamento
    blocosComBonus.forEach((b) => {
      const prodVenda = produtosBD.find(p => p.id === b.vendaCod.trim());
      const prodBonif = produtosBD.find(p => p.id === b.bonificaId);
      
      const nomeVenda = prodVenda ? prodVenda.nome : "Produto não encontrado";
      const nomeBonif = prodBonif ? prodBonif.nome : "Produto não encontrado";
      
      // Usa o preço do campo ou o preço do banco de dados (mesma lógica do cálculo)
      const precoPraticado = parseFloat(b.bonificaPrecoPraticado) || (prodBonif ? prodBonif.preco : 0);
      const precoFormatado = precoPraticado.toFixed(2).replace('.', ',');
      
      msg += `${nomeVenda} ${precoFormatado} -> BONIF: ${nomeBonif}\n`;
    });
    
    // Adiciona a data do dia
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    msg += `\nDATA:${dataHoje}`;
    
    return msg.trim();
  };

  const copiarGeral = () => {
    const msg = getGeneratedMessage();
    const el = document.createElement('textarea');
    el.value = msg;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const limparTudo = () => {
    if (window.confirm("Deseja limpar todos os dados?")) {
      setBlocos([{
        uid: Date.now(),
        vendaCod: "524052",
        vendaQtd: '',
        vendaPNota: '',
        bonificaId: "524052",
        inputBuscaBonifica: "524052",
        bonificaPrecoPraticado: '',
        reportedBonus: '',
        res: { saldo: 0, bonus: 0, valorBonificado: 0, rentabilidade: 0 }
      }]);
      setHeaderData({
        ...headerData,
        vendedor: "",
        cliente: "",
        pedido: "",
        prazo: "32"
      });
      setBonusText("");
      setOrderImage(null);
      setError(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Por favor, selecione apenas arquivos de imagem.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrderImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e);
  };


  const handleSupervisorToggle = () => {
    setIsSupervisorMode(!isSupervisorMode);
  };

  const handleUpdateClick = () => {
    fetchData();
  };



  if (isLoadingDB) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Carregando Banco de Dados</h2>
        <p className="text-slate-500 text-sm mt-2">Sincronizando preços com o Google Sheets...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      {/* NAVEGAÇÃO SUPERIOR */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 flex items-center justify-around">
          <button 
            onClick={() => setActiveTab('bonificacao')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2 ${activeTab === 'bonificacao' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
            <Calculator size={18}/>
            <span className="text-[8px] font-black uppercase tracking-widest">Bonificação</span>
          </button>
          <button 
            onClick={() => {
              setIsMetasUnlocked(true);
              setActiveTab('metas');
            }}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2 ${activeTab === 'metas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
            <div className="relative">
              <TrendingUp size={18}/>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">Metas RCA</span>
          </button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto p-4 space-y-6 pt-6">
        {activeTab === 'bonificacao' ? (
          <>
            <section className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border-2 border-blue-500/20 overflow-hidden">
          <div 
            onClick={() => setIsConfigExpanded(!isConfigExpanded)}
            className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-800"/>
              <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Identificação do Envio</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  limparTudo();
                }} 
                className="text-[10px] font-black text-red-600 uppercase hover:opacity-70 transition-opacity"
              >
                LIMPAR
              </button>
              {isConfigExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </div>
          </div>
          <AnimatePresence>
            {isConfigExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {!isSupervisorMode ? (
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Equipe</label>
                        <input 
                          className="w-full text-[11px] font-bold p-2.5 bg-slate-50 rounded-xl border border-slate-200" 
                          value={headerData.equipe} 
                          onChange={e => setHeaderData({...headerData, equipe: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">C.D.</label>
                        <select 
                            className="w-full text-[11px] font-bold p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-blue-500/20 appearance-none" 
                            value={headerData.cd} 
                            onChange={e => setHeaderData({...headerData, cd: e.target.value})}
                          >
                            <option value="87">87</option>
                            <option value="116">116</option>
                          </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-800 uppercase ml-1 flex items-center gap-1"><User size={10}/> CLIENTE (CÓDIGO E NOME)</label>
                      <input 
                        className="w-full text-xs font-bold p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 outline-none focus:ring-2 ring-blue-500/20" 
                        placeholder="EX: 50501-ALDERICE V CUNHA"
                        value={headerData.cliente} 
                        onChange={e => setHeaderData({...headerData, cliente: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-800 uppercase ml-1 flex items-center gap-1"><Briefcase size={10}/> RCA (CÓDIGO E NOME)</label>
                      <input 
                        className="w-full text-xs font-bold p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 outline-none focus:ring-2 ring-blue-500/20" 
                        placeholder="EX: 19855-YURI LIMA-TUTOIA"
                        value={headerData.vendedor} 
                        onChange={e => setHeaderData({...headerData, vendedor: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-800 uppercase ml-1 flex items-center gap-1"><Calculator size={10}/> Nº DO PEDIDO</label>
                      <input 
                        className="w-full text-xs font-bold p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 outline-none focus:ring-2 ring-blue-500/20" 
                        placeholder="Ex: 318021-1"
                        value={headerData.pedido} 
                        onChange={e => setHeaderData({...headerData, pedido: e.target.value})} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Supervisor</label>
                        <input 
                          className="w-full text-[11px] font-bold p-2.5 bg-slate-50 rounded-xl border border-slate-200" 
                          value={headerData.supervisor} 
                          onChange={e => setHeaderData({...headerData, supervisor: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Prazo</label>
                        <select 
                          className="w-full text-[11px] font-bold p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-blue-500/20 appearance-none" 
                          value={headerData.prazo} 
                          onChange={e => setHeaderData({...headerData, prazo: e.target.value})}
                        >
                          <option value="32">1 - 32 DIAS</option>
                          <option value="22/32/42">2 - 22/32/42 DIAS</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/30">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold text-slate-600">
                      <div className="flex gap-2">
                        <span className="text-slate-400 uppercase">Vendedor:</span>
                        <span className="text-blue-900 uppercase">{headerData.vendedor || "Não informado"}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-400 uppercase">Cliente:</span>
                        <span className="text-blue-900 uppercase">{headerData.cliente || "Não informado"}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-400 uppercase">Pedido:</span>
                        <span className="text-blue-900 uppercase">{headerData.pedido || "---"}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-400 uppercase">Prazo:</span>
                        <span className="text-blue-900 uppercase">{headerData.prazo || "---"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {isSupervisorMode && (
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="text-yellow-600" size={20}/>
                <h2 className="text-sm font-black text-yellow-800 uppercase tracking-tight">Painel de Validação</h2>
              </div>
              <p className="text-xs text-yellow-700 font-medium leading-relaxed">
                Supervisor, use este modo para validar os pedidos enviados pelos seus RCAs. 
                Utilize a ferramenta de imagem e o texto de solicitação para conferência.
              </p>
            </motion.div>

            {/* SEÇÃO DE VALIDAÇÃO AUTOMÁTICA */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] shadow-xl border-2 border-blue-100 overflow-hidden"
            >
              <div className="bg-blue-900 p-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles size={18} className="text-yellow-400"/>
                  <h2 className="text-xs font-black uppercase tracking-widest">Validação de Pedido</h2>
                </div>
                <div className="bg-blue-800 px-3 py-1 rounded-full text-[8px] font-black text-blue-200 uppercase">Beta</div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* UPLOAD DE IMAGEM */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                      orderImage ? 'border-blue-500 bg-blue-50' : 
                      isDragging ? 'border-blue-600 bg-blue-100 scale-[1.02]' : 
                      'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                    }`}
                  >
                    {orderImage ? (
                      <>
                        <img src={orderImage} className="w-full h-full object-cover opacity-50" alt="Pedido" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-white/40 backdrop-blur-[2px]">
                          <CheckCircle2 size={32} className="text-blue-600 mb-2"/>
                          <span className="text-[10px] font-black text-blue-900 uppercase">Imagem Carregada</span>
                          <span className="text-[8px] font-bold text-blue-500 mt-1">Clique ou arraste para trocar</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderImage(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="mt-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera size={32} className={`mb-2 transition-transform ${isDragging ? 'scale-125 text-blue-600' : 'text-slate-300'}`}/>
                        <span className={`text-[10px] font-black uppercase text-center px-4 transition-colors ${isDragging ? 'text-blue-700' : 'text-slate-400'}`}>
                          {isDragging ? 'Solte a imagem aqui' : 'Imagem do Pedido'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase">Clique ou arraste</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                    />
                  </div>

                  {/* TEXTO DE BONIFICAÇÃO */}
                  <div className="flex flex-col gap-2">
                    <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-200 p-4 flex flex-col">
                      <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <FileText size={14}/>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Texto do RCA</span>
                      </div>
                      <textarea 
                        className="flex-1 w-full bg-transparent text-[11px] font-bold text-slate-700 outline-none resize-none placeholder:text-slate-300"
                        placeholder="Cole aqui o texto gerado pelo app do RCA..."
                        value={bonusText}
                        onChange={(e) => setBonusText(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* STATUS DAS BATALHAS (REPLACING OBSERVATIONS) */}
                {(() => {
                  const currentRCAId = headerData.vendedor.split('-')[0];
                  const rca = RCA_METAS_DATA.find(r => r.id === currentRCAId);
                  if (!rca) return null;

                  const labels = (rca.battles.dove || rca.battles.oral || rca.battles.rexona || rca.battles.sabLiq) ? BATTLE_LABELS.BPC : BATTLE_LABELS.HF;
                  const isBPC = (rca.battles.dove || rca.battles.oral || rca.battles.rexona || rca.battles.sabLiq);
                  
                  // Mapeamento dinâmico baseado no time
                  const battleEntries = isBPC ? [
                    { label: labels[0], data: rca.battles.dove || { meta: 0, realizado: 0, reach: "0%", posTela: 0, posTotal: 0 } },
                    { label: labels[1], data: rca.battles.oral || { meta: 0, realizado: 0, reach: "0%", posTela: 0, posTotal: 0 } },
                    { label: labels[2], data: rca.battles.rexona || { meta: 0, realizado: 0, reach: "0%", posTela: 0, posTotal: 0 } },
                    { label: labels[3], data: rca.battles.sabLiq || { meta: 0, realizado: 0, reach: "0%", posTela: 0, posTotal: 0 } }
                  ] : [
                    { label: labels[0], data: rca.battles.amidos || { meta: 0, realizado: 0, reach: "0%", posTela: 0, posTotal: 0 } },
                    { label: labels[1], data: rca.battles.cif || { meta: 0, realizado: 0, reach: "0%", posTela: 0, posTotal: 0 } },
                    { label: labels[2], data: rca.battles.mayo || { meta: 0, realizado: 0, reach: "0%", posTela: 0, posTotal: 0 } },
                    { label: labels[3], data: rca.battles.poLiq || { meta: 0, realizado: 0, reach: "0%", posTela: 0, posTotal: 0 } }
                  ];

                  return (
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-3 text-blue-800">
                        <Trophy size={14}/>
                        <span className="text-[9px] font-black uppercase tracking-widest">Status das Batalhas do RCA</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {battleEntries.map((battle, idx) => {
                          const alc = battle.data.meta > 0 ? (battle.data.realizado / battle.data.meta) * 100 : 0;
                          return (
                            <div key={idx} className="p-2 bg-white rounded-xl border border-slate-100 flex flex-col gap-1">
                              <span className="text-[7px] font-black text-slate-400 uppercase leading-none truncate">{battle.label}</span>
                              <div className="flex items-baseline justify-between">
                                <span className="text-[10px] font-black text-blue-900">{battle.data.realizado}/{battle.data.meta}</span>
                                <span className={`text-[8px] font-black ${alc >= 100 ? 'text-green-600' : 'text-blue-500'}`}>{battle.data.reach || alc.toFixed(0) + '%'}</span>
                              </div>
                              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${alc >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                  style={{ width: `${Math.min(alc, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isSupervisorMode && blocos.map((bloco, index) => (
              <motion.div 
                key={bloco.uid}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border-2 border-blue-500/20 overflow-hidden"
              >
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                      {index + 1}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloco de Cálculo</span>
                  </div>
                  <button onClick={() => removeBloco(bloco.uid)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* PRODUTO VENDIDO */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-blue-900">
                        <ShoppingCart size={14}/>
                        <h3 className="text-[10px] font-black uppercase tracking-tight">VENDA</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                          <input 
                            placeholder="Cód. ou Nome..."
                            className="w-full text-xs font-bold p-3 pl-9 bg-slate-50 rounded-xl border border-slate-200"
                            value={bloco.vendaCod}
                            onChange={e => updateBloco(bloco.uid, { vendaCod: e.target.value })}
                          />
                          {bloco.vendaCod.length > 2 && !produtosBD.find(p => p.id === bloco.vendaCod.trim()) && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                              {produtosBD.filter(p => p.nome.toLowerCase().includes(bloco.vendaCod.toLowerCase()) || p.id.includes(bloco.vendaCod)).slice(0, 10).map(p => (
                                <button key={p.id} onClick={() => updateBloco(bloco.uid, { vendaCod: p.id })} className="w-full p-2 text-left text-[10px] hover:bg-blue-50 border-b border-slate-50">
                                  <span className="font-black text-slate-400">{p.id}</span> - {p.nome}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => setShowStockModal({ open: true, target: 'venda', uid: bloco.uid })}
                          className="w-full py-2 bg-blue-50 text-blue-700 text-[8px] font-black uppercase rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          ACESSAR ESTOQUE
                        </button>
                        
                        {produtosBD.find(p => p.id === bloco.vendaCod.trim()) && (
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-blue-800 leading-tight">
                                {produtosBD.find(p => p.id === bloco.vendaCod.trim()).nome}
                              </span>
                              {produtosBD.find(p => p.id === bloco.vendaCod.trim()).promo > 0 && (
                                <span className="bg-red-600 text-white text-[7px] font-black px-2 py-0.5 rounded-md animate-bounce shadow-sm">AÇÃO DO DIA</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-1 border-t border-blue-100 pt-1">
                              <div className="flex flex-col">
                                <span className="text-[6px] text-blue-600 font-black uppercase">IDEAL</span>
                                <span className="text-[8px] font-bold text-blue-900">{formatarMoeda(produtosBD.find(p => p.id === bloco.vendaCod.trim()).ideal)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[6px] text-blue-600 font-black uppercase">PROMO</span>
                                <span className="text-[8px] font-bold text-blue-900">{formatarMoeda(produtosBD.find(p => p.id === bloco.vendaCod.trim()).promo)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Quantidade</label>
                            <input 
                              type="number"
                              className="w-full text-xs font-bold p-3 bg-slate-50 rounded-xl border border-slate-200"
                              value={bloco.vendaQtd}
                              onChange={e => updateBloco(bloco.uid, { vendaQtd: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Preço de Nota</label>
                            <input 
                              type="number"
                              step="0.01"
                              className="w-full text-xs font-bold p-3 bg-slate-50 rounded-xl border border-slate-200"
                              value={bloco.vendaPNota}
                              onChange={e => updateBloco(bloco.uid, { vendaPNota: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PRODUTO BONIFICADO */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <Gift size={14}/>
                        <h3 className="text-[10px] font-black uppercase tracking-tight">BONIFICAÇÃO</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                          <input 
                            placeholder="Cód. ou Nome..."
                            className="w-full text-xs font-bold p-3 pl-9 bg-slate-50 rounded-xl border border-slate-200"
                            value={bloco.inputBuscaBonifica}
                            onChange={e => updateBloco(bloco.uid, { inputBuscaBonifica: e.target.value })}
                          />
                          {bloco.inputBuscaBonifica.length > 2 && !produtosBD.find(p => p.id === bloco.inputBuscaBonifica.trim()) && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                              {produtosBD.filter(p => p.nome.toLowerCase().includes(bloco.inputBuscaBonifica.toLowerCase()) || p.id.includes(bloco.inputBuscaBonifica)).slice(0, 10).map(p => (
                                <button key={p.id} onClick={() => updateBloco(bloco.uid, { inputBuscaBonifica: p.id })} className="w-full p-2 text-left text-[10px] hover:bg-blue-50 border-b border-slate-50">
                                  <span className="font-black text-slate-400">{p.id}</span> - {p.nome}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => setShowStockModal({ open: true, target: 'bonifica', uid: bloco.uid })}
                          className="w-full py-2 bg-green-50 text-green-700 text-[8px] font-black uppercase rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                        >
                          ACESSAR ESTOQUE
                        </button>
                        <div className="p-3 bg-green-50 rounded-xl border border-green-100 min-h-[42px] flex flex-col justify-center">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-green-800 leading-tight">
                              {produtosBD.find(p => p.id === bloco.bonificaId)?.nome || "Produto não encontrado"}
                            </span>
                            {produtosBD.find(p => p.id === bloco.bonificaId)?.promo > 0 && (
                              <div className="bg-red-600 text-white text-[6px] font-black px-1.5 py-1 rounded-md shadow-sm flex flex-col items-center leading-none">
                                <span>AÇÃO DO</span>
                                <span>DIA</span>
                              </div>
                            )}
                          </div>
                          {produtosBD.find(p => p.id === bloco.bonificaId) && (
                            <div className="mt-1 grid grid-cols-3 gap-1 border-t border-green-100 pt-1">
                              <div className="flex flex-col">
                                <span className="text-[6px] text-green-600 font-black uppercase">IDEAL</span>
                                <span className="text-[8px] font-bold text-green-900">{formatarMoeda(produtosBD.find(p => p.id === bloco.bonificaId).ideal)}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[6px] text-green-600 font-black uppercase">PROMO</span>
                                <span className="text-[8px] font-bold text-green-900">{formatarMoeda(produtosBD.find(p => p.id === bloco.bonificaId).promo)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Preço Praticado</label>
                          <input 
                            type="number"
                            step="0.01"
                            className="w-full text-xs font-bold p-3 bg-slate-50 rounded-xl border border-slate-200"
                            value={bloco.bonificaPrecoPraticado}
                            onChange={e => updateBloco(bloco.uid, { bonificaPrecoPraticado: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RESULTADO DO BLOCO */}
                  <div className="bg-slate-900 rounded-3xl p-6 flex flex-col items-center text-center gap-6 shadow-lg">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Valor da Bonificação</span>
                      <p className="text-2xl font-black text-green-400">{formatarMoeda(bloco.res.valorBonificado)}</p>
                    </div>
                    
                    <div className="w-full pt-6 border-t border-slate-800 flex flex-col items-center gap-4">
                      {isSupervisorMode && (
                        <div className="flex flex-col items-center gap-1 mb-2">
                          <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">Informado RCA</span>
                          <input 
                            type="number"
                            className="w-20 bg-slate-800 rounded-lg p-2 text-center text-xl font-black text-yellow-400 outline-none border border-slate-700"
                            value={bloco.reportedBonus}
                            onChange={e => updateBloco(bloco.uid, { reportedBonus: e.target.value })}
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Bônus Cálculo</span>
                        <div className="flex items-baseline gap-1">
                          <p className="text-5xl font-black text-white leading-none">{bloco.res.bonus}</p>
                          <span className="text-xs font-black text-blue-400 uppercase">UN</span>
                        </div>
                        <div className="mt-3 px-4 py-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          <p className="text-[7px] font-black text-blue-400 uppercase leading-tight">
                            Regra: Investimento ≥ Preço Praticado<br/>
                            Decimal ≥ 0.78 arredonda p/ cima<br/>
                            Ex: 1.79 → 2 | 1.77 → 1 | 0.90 → 0
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>


        {!isSupervisorMode && (
          <button 
            onClick={addBloco}
            className="w-full py-6 rounded-[2.5rem] border-2 border-dashed border-blue-300 text-blue-500 bg-blue-50 hover:bg-blue-100 shadow-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Plus size={16}/> Adicionar Novo Bloco
          </button>
        )}
    </>
  ) : (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* CABEÇALHO METAS */}
            <div className="bg-[#001E62] rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/20 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse"></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <TrendingUp size={24} className="text-blue-300"/>
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Metas RCA</h2>
                 </div>
                 <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.3em] max-w-[200px] leading-relaxed">
                    Acompanhamento diário de indicadores e projeção de ganhos
                 </p>
               </div>
            </div>

            {/* BUSCA RCA */}
            <div className="relative group">
               <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                 <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
               </div>
               <input 
                 type="text"
                 placeholder="Pesquise seu Código ou Nome..."
                 className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-5 pl-14 pr-6 outline-none focus:border-blue-600 shadow-xl shadow-blue-900/5 text-sm font-bold transition-all"
                 value={rcaSearchTerm}
                 onFocus={() => setIsSearchFocused(true)}
                 onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                 onChange={(e) => {
                    setRcaSearchTerm(e.target.value);
                    if (e.target.value === "") setSelectedRCA(null);
                 }}
               />
               
               <AnimatePresence>
                 {(isSearchFocused || rcaSearchTerm.trim() !== "") && filteredRCAs.length > 0 && !selectedRCA && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden max-h-60 overflow-y-auto"
                   >
                     {filteredRCAs.map((rca) => (
                       <button
                         key={rca.id}
                         onClick={() => {
                           setSelectedRCA(rca);
                           setRcaSearchTerm(rca.name);
                         }}
                         className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
                       >
                         <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{rca.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{rca.id} • {rca.region}</p>
                         </div>
                         <Plus size={16} className="text-slate-300 group-hover:text-blue-600"/>
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {selectedRCA ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* INDICADORES PRINCIPAIS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* VOLUME */}
                  <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border-2 border-blue-500/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <BarChart3 size={24}/>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center w-full">
                          <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest">OBJETIVO VOLUME</h4>
                          <span className="text-[9px] font-black text-slate-800">{formatarMoeda(selectedRCA.metaVolume)}</span>
                        </div>
                        <div className="flex justify-between items-center w-full mt-1">
                          <h4 className="text-[7px] font-black text-blue-600 uppercase tracking-widest">VOLUME REALIZADO</h4>
                          <span className="text-[9px] font-black text-blue-800">{formatarMoeda(selectedRCA.volume)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(100, (selectedRCA.volume / selectedRCA.metaVolume) * 100)}%` }}
                         className={`h-full rounded-full shadow-lg ${selectedRCA.volume >= selectedRCA.metaVolume ? 'bg-green-500 shadow-green-500/50' : 'bg-blue-600 shadow-blue-500/50'}`}
                       ></motion.div>
                    </div>
                  </div>

                  {/* POSITIVAÇÃO */}
                  <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border-2 border-green-500/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={24}/>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center w-full">
                          <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest">OBJETIVO POSITIVAÇÃO</h4>
                          <span className="text-[9px] font-black text-slate-800">{selectedRCA.pdvsTotal} PDVs</span>
                        </div>
                        <div className="flex justify-between items-center w-full mt-1">
                          <h4 className="text-[7px] font-black text-green-600 uppercase tracking-widest">REALIZADO POSITIVAÇÃO</h4>
                          <span className="text-[9px] font-black text-green-800">{selectedRCA.positivacao} PDVs</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(100, (selectedRCA.positivacao / selectedRCA.pdvsTotal) * 100)}%` }}
                         className="bg-green-500 h-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                       ></motion.div>
                    </div>
                  </div>
                </div>

                {/* BATALHAS BREAKDOWN */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 border-4 border-yellow-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <Trophy size={48} className="text-yellow-500/10 -rotate-12"/>
                    </div>
                    
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
                        Status das Batalhas
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        {(() => {
                        const labels = (selectedRCA.battles.dove || selectedRCA.battles.oral || selectedRCA.battles.rexona || selectedRCA.battles.sabLiq) ? BATTLE_LABELS.BPC : BATTLE_LABELS.HF;
                        const isBPC = (selectedRCA.battles.dove || selectedRCA.battles.oral || selectedRCA.battles.rexona || selectedRCA.battles.sabLiq);
                        
                        // Mapeamento dinâmico baseado no time
                        const battleEntries = isBPC ? [
                          { label: labels[0], data: selectedRCA.battles.dove || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                          { label: labels[1], data: selectedRCA.battles.oral || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                          { label: labels[2], data: selectedRCA.battles.rexona || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                          { label: labels[3], data: selectedRCA.battles.sabLiq || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } }
                        ] : [
                          { label: labels[0], data: selectedRCA.battles.amidos || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                          { label: labels[1], data: selectedRCA.battles.cif || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                          { label: labels[2], data: selectedRCA.battles.mayo || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } },
                          { label: labels[3], data: selectedRCA.battles.poLiq || { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 } }
                        ];

                           return battleEntries.map((b, idx) => (
                             <div key={idx} className="bg-slate-50 rounded-3xl p-4 border border-slate-100 flex flex-col gap-2">
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{b.label}</p>
                                  <div className="flex justify-between text-[7px] font-bold uppercase mb-1">
                                    <span className="text-slate-500">OBJETIVO: {b.data.meta}</span>
                                    <span className="text-blue-600">POS FAT: {b.data.realizado}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                      <span className="text-xl font-black text-slate-800">{b.data.realizado}</span>
                                      <div className={`px-2 h-6 rounded-lg flex items-center justify-center text-[9px] font-black bg-${idx % 2 === 0 ? 'blue' : 'emerald'}-100 text-${idx % 2 === 0 ? 'blue' : 'emerald'}-600`}>
                                          ALCA%: {b.data.reach || "0,00%"}
                                      </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[7px] font-bold uppercase text-slate-400 pt-2 border-t border-slate-200/60">
                                  <div className="flex flex-col">
                                    <span>Pos Tela</span>
                                    <span className="text-slate-600">{b.data.posTela}</span>
                                  </div>
                                  <div className="flex flex-col text-right">
                                    <span>Pos Total</span>
                                    <span className="text-slate-600">{b.data.posTotal}</span>
                                  </div>
                                </div>
                            </div>
                          ));
                        })()}
                    </div>
                </div>

                {/* PROJEÇÃO FINANCEIRA */}
                <div className="bg-[#001E62] rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mb-32 blur-3xl"></div>
                    
                    {(() => {
                        const comissionBase = selectedRCA.volume * 0.01;
                        const reachGoalBonus = selectedRCA.volume >= selectedRCA.metaVolume ? selectedRCA.volume * 0.005 : 0;
                        const comissionVolume = comissionBase + reachGoalBonus;
                        
                        // Premiação dinâmica baseada no time
                        const isBPC = (selectedRCA.battles.dove || selectedRCA.battles.oral || selectedRCA.battles.rexona || selectedRCA.battles.sabLiq);
                        let premBat = 0;
                        if (isBPC) {
                          premBat = ((selectedRCA.battles.dove?.realizado || 0) * 10) + 
                                    ((selectedRCA.battles.oral?.realizado || 0) * 5) + 
                                    ((selectedRCA.battles.rexona?.realizado || 0) * 5) + 
                                    ((selectedRCA.battles.sabLiq?.realizado || 0) * 5);
                        } else {
                          premBat = ((selectedRCA.battles.poLiq?.realizado || 0) * 10) + 
                                    ((selectedRCA.battles.cif?.realizado || 0) * 5) + 
                                    ((selectedRCA.battles.mayo?.realizado || 0) * 5) + 
                                    ((selectedRCA.battles.amidos?.realizado || 0) * 5);
                        }
                        
                        const total = comissionVolume + premBat;

                        return (
                          <div className="relative z-10">
                              <div className="flex items-center justify-between mb-8">
                                  <div>
                                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.4em]">Remuneração Variável Parcial</span>
                                      <h3 className="text-4xl font-black tracking-tighter text-green-400 drop-shadow-lg">
                                          {formatarMoeda(total)}
                                      </h3>
                                  </div>
                                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                                      <Sparkles className="text-yellow-400" size={24}/>
                                  </div>
                              </div>

                              <div className="space-y-3 bg-black/20 rounded-3xl p-6 backdrop-blur-sm border border-white/5">
                                  <div className="flex justify-between items-center">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Comissão Estimada (Vol)</span>
                                      </div>
                                      <span className="text-xs font-black">{formatarMoeda(comissionVolume)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Premiação Batalhas</span>
                                      <span className="text-xs font-black">{formatarMoeda(premBat)}</span>
                                  </div>
                              </div>
                              
                              <p className="text-[8px] font-bold text-blue-300 uppercase italic mt-4 text-center opacity-60">
                                  * Valores aproximados baseados nos indicadores informados no sistema.
                              </p>
                          </div>
                        );
                    })()}
                </div>
                
                <button 
                  onClick={() => setSelectedRCA(null)}
                  className="w-full py-5 bg-white border-2 border-slate-100 rounded-[2.5rem] text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all hover:text-slate-600"
                >
                  Limpar Pesquisa
                </button>
              </motion.div>
            ) : (
                <div className="bg-white rounded-[3rem] p-12 text-center border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2.5rem] flex items-center justify-center">
                        <Search size={40}/>
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Aguardando Identificação</h4>
                        <p className="text-xs font-bold text-slate-400 max-w-[200px] mx-auto mt-1">
                            Utilize a barra de busca acima para carregar seus indicadores diários.
                        </p>
                    </div>
                </div>
            )}
            
            {/* RODAPÉ FEEDBACK */}
            <div className="bg-slate-50 rounded-[2.5rem] p-8 border-2 border-slate-100/50">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <AlertCircle size={20}/>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Atenção Importante</h4>
               </div>
               <p className="text-[10px] font-bold text-slate-500 leading-relaxed text-justify">
                  Este painel é uma ferramenta de apoio para o RCA acompanhar seu desempenho prévio. Os dados oficiais são validados mensalmente pela equipe de inteligência comercial. Caso identifique alguma divergência, entre em contato com seu Supervisor.
               </p>
            </div>
          </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#001E62] text-white shadow-2xl z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-black italic uppercase leading-none tracking-tighter">BONIFICAÇÃO UNILEVER</h1>
            <p className="text-[8px] font-bold text-yellow-400 tracking-[0.2em] uppercase mt-1">CRIADO POR YURI LIMA</p>
          </div>

          <div className="flex items-center gap-3">
            {!isSupervisorMode && (
              <button 
                onClick={handleUpdateClick}
                className="bg-blue-800 text-white p-3 rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg"
                title="Atualizar Banco de Dados"
              >
                <RefreshCw size={16} className={isLoadingDB ? "animate-spin" : ""} />
              </button>
            )}
            
            <button 
              onClick={handleSupervisorToggle}
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all shadow-lg ${isSupervisorMode ? 'bg-yellow-400 text-blue-900' : 'bg-blue-600 text-white'}`}
            >
              {isSupervisorMode ? "MODO SUPERVISOR" : "MODO RCA"}
            </button>

            <button 
              onClick={copiarGeral} 
              className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg"
            >
              {copiado ? <CheckCircle2 size={16}/> : <Share2 size={16}/>}
              {copiado ? "COPIADO!" : "ENVIAR TUDO"}
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL DE ESTOQUE */}
      <AnimatePresence>
        {showStockModal.open && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Estoque de Produtos</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Selecione um item abaixo</p>
                </div>
                <button 
                  onClick={() => setShowStockModal({ open: false, target: 'venda', uid: null })}
                  className="p-2 bg-slate-200 text-slate-500 rounded-full hover:bg-slate-300 transition-colors"
                >
                  <Plus size={20} className="rotate-45"/>
                </button>
              </div>
              
              <div className="p-4 bg-white border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <input 
                    autoFocus
                    placeholder="Pesquisar por nome ou código..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none focus:ring-2 ring-blue-500/20"
                    value={stockSearchTerm}
                    onChange={(e) => setStockSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {produtosBD
                  .filter(p => p.id.toLowerCase().includes(stockSearchTerm.toLowerCase()) || p.nome.toLowerCase().includes(stockSearchTerm.toLowerCase()))
                  .map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      if (showStockModal.target === 'venda') {
                        updateBloco(showStockModal.uid!, { vendaCod: p.id });
                      } else {
                        updateBloco(showStockModal.uid!, { inputBuscaBonifica: p.id });
                      }
                      setShowStockModal({ open: false, target: 'venda', uid: null });
                      setStockSearchTerm("");
                    }}
                    className="w-full p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-2xl flex items-center justify-between group transition-all"
                  >
                    <div className="text-left">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.id}</span>
                      <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{p.nome}</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-blue-600">{formatarMoeda(p.preco)}</span>
                      {p.promo > 0 && <span className="text-[6px] font-black text-green-600 uppercase">Promoção</span>}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
