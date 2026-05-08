import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Gift, Trash2, Plus, Share2, CheckCircle2, Search, Calculator, User, Briefcase, Users, RefreshCw, Loader2, Camera, FileText, Sparkles, AlertCircle, Lock, Clock } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";

/**
 * BONIFICAÇÃO UNILEVER - v12.0
 * CRIADO POR YURI LIMA
 * REGRAS: Design Intocado | Arredondamento 0.52 | Base de Produtos via Google Sheets
 */

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSu-AB7a5WEcbUwdqYrBbosDZMTXmEqBH-fPWxsairBggIpjz4XmmzXT76maDkCx3ewinpuLWW__-j0/pub?output=csv";

const App = () => {
  const [isSupervisorMode, setIsSupervisorMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bonusText, setBonusText] = useState("");
  const [orderImage, setOrderImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [produtosBD, setProdutosBD] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState<{ open: boolean, target: 'venda' | 'bonifica', uid: number | null }>({ open: false, target: 'venda', uid: null });
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [supervisorSummary, setSupervisorSummary] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [pendingAction, setPendingAction] = useState<'supervisor' | 'update_db' | null>(null);
  const [isAppAuthenticated, setIsAppAuthenticated] = useState(false);
  const [loginPass, setLoginPass] = useState("");
  const APP_PASSWORD = "@Ymol6628";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [headerData, setHeaderData] = useState({
    equipe: "31 COCAIS",
    supervisor: "YURI LIMA",
    cd: "CD 87",
    vendedor: "19855 YURI LIMA",
    cliente: "50501 ALDERICE V CUNHA",
    pedido: "318021-1",
    prazo: "32"
  });

  const [blocos, setBlocos] = useState([
    {
      uid: Date.now(),
      vendaCod: "524052",
      vendaQtd: '',
      vendaPNota: '',
      bonificaId: "524052",
      inputBuscaBonifica: "524052",
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
      vendaCod: "524052",
      vendaQtd: '',
      vendaPNota: '',
      bonificaId: "524052",
      inputBuscaBonifica: "524052",
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
    msg += `SUPERVISOR:${headerData.supervisor}\n`;
    msg += `CD:${headerData.cd}\n`;
    msg += `CLIENTE:${headerData.cliente}\n`;
    msg += `VENDEDOR:${headerData.vendedor}\n`;
    msg += `CODIGO DO PEDIDO: ${headerData.pedido}\n\n`;
    
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
    msg += `\nPRAZO:${headerData.prazo}`;
    
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
      setAiAnalysis(null);
      setSupervisorSummary("");
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

  const processValidation = async () => {
    if (!orderImage || !bonusText) {
      setError("Por favor, insira a imagem do pedido e o texto de bonificação.");
      return;
    }

    setIsProcessing(true);
    setAiAnalysis(null);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const imagePart = {
        inlineData: {
          mimeType: "image/png",
          data: orderImage.split(',')[1],
        }
      };

      const textPart = {
        text: `Você é um Supervisor de Vendas especialista em auditoria de pedidos.
        Analise a imagem do pedido de vendas e o texto de bonificação abaixo para verificar se há inconsistências.
        
        Texto de Bonificação:
        ${bonusText}
        
        Instruções de Extração e Auditoria:
        1. CABEÇALHO: Identifique Equipe, Supervisor, CD, Vendedor, Cliente e Pedido.
        2. ITENS: Extraia os códigos, quantidades e preços da imagem.
        3. CONFERÊNCIA: Verifique se o que o vendedor escreveu no texto (bonificação informada) faz sentido com o que está na imagem do pedido.
        4. ANÁLISE: No campo 'analysis', forneça uma frase curta dizendo se o pedido parece correto ou se há alguma divergência clara (ex: 'Pedido OK', ou 'Atenção: Quantidade no texto difere da imagem').
        
        Formato de Saída (JSON APENAS):
        {
          "header": {
            "equipe": "string",
            "supervisor": "string",
            "cd": "string",
            "vendedor": "string",
            "cliente": "string",
            "pedido": "string"
          },
          "items": [
            {
              "vendaCod": "codigo_venda",
              "vendaQtd": "quantidade_total_venda",
              "vendaPNota": "preco_unitario",
              "bonificaId": "codigo_bonus",
              "reportedBonus": "quantidade_bonus"
            }
          ],
          "analysis": "Sua análise aqui"
        }
        
        Importante: Retorne apenas o JSON.`,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [imagePart, textPart] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      
      if (result.analysis) {
        setAiAnalysis(result.analysis);
      }

      if (result.header) {
        setHeaderData(prev => ({
          ...prev,
          equipe: result.header.equipe || prev.equipe,
          supervisor: result.header.supervisor || prev.supervisor,
          cd: result.header.cd || prev.cd,
          vendedor: result.header.vendedor || prev.vendedor,
          cliente: result.header.cliente || prev.cliente,
          pedido: result.header.pedido || prev.pedido,
        }));
      }

      if (result.items && result.items.length > 0) {
        const newBlocos = result.items.map((item: any) => ({
          uid: Math.random(),
          vendaCod: item.vendaCod || "524052",
          vendaQtd: item.vendaQtd || '',
          vendaPNota: item.vendaPNota || '',
          bonificaId: item.bonificaId || "2012",
          inputBuscaBonifica: item.bonificaId || "2012",
          reportedBonus: item.reportedBonus || '',
          res: { saldo: 0, bonus: 0, valorBonificado: 0, rentabilidade: 0 }
        }));
        setBlocos(newBlocos);
      } else {
        setError("Não foi possível extrair dados suficientes da imagem/texto.");
      }

    } catch (err) {
      console.error(err);
      setError("Erro ao processar validação. Verifique a conexão e tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSupervisorToggle = () => {
    if (isSupervisorMode) {
      setIsSupervisorMode(false);
    } else {
      setPendingAction('supervisor');
      setShowPasswordModal(true);
    }
  };

  const handleUpdateClick = () => {
    setPendingAction('update_db');
    setShowPasswordModal(true);
  };

  const confirmPassword = () => {
    if (passwordInput === "SuperUnilever@2026") {
      if (pendingAction === 'supervisor') {
        setIsSupervisorMode(true);
      } else if (pendingAction === 'update_db') {
        fetchData();
      }
      setShowPasswordModal(false);
      setPasswordInput("");
      setPendingAction(null);
      setError(null);
    } else {
      setError("Senha incorreta!");
      setTimeout(() => setError(null), 3000);
    }
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

  if (!isAppAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">BONIFICAÇÃO UNILEVER</h2>
          <p className="text-slate-500 text-sm mb-8">Insira a senha de acesso para iniciar os cálculos.</p>
          
          <div className="space-y-4">
            <input 
              type="password"
              placeholder="Senha de Acesso"
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 text-center font-bold tracking-widest"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loginPass === APP_PASSWORD && setIsAppAuthenticated(true)}
            />
            <button 
              onClick={() => {
                if (loginPass === APP_PASSWORD) {
                  setIsAppAuthenticated(true);
                } else {
                   alert("Senha incorreta!");
                }
              }}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              Acessar Sistema
            </button>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aviso importante</p>
              <p className="text-[11px] font-black text-red-600 uppercase leading-tight">
                SOLICITE AO SEU GESTOR A VERSÃO PAGA DO APLICATIVO
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      <div className="max-w-xl mx-auto p-4 space-y-6 pt-6">
        <section className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border-2 border-blue-500/20 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-800"/>
              <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Identificação do Envio</h2>
            </div>
            <button onClick={limparTudo} className="text-[10px] font-black text-red-600 uppercase hover:opacity-70 transition-opacity">LIMPAR</button>
          </div>
          {!isSupervisorMode ? (
            <div className="p-6 space-y-4">
               <div className="grid grid-cols-3 gap-2">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Equipe</label>
                   <input className="w-full text-[11px] font-bold p-2.5 bg-slate-50 rounded-xl border border-slate-200" value={headerData.equipe} onChange={e => setHeaderData({...headerData, equipe: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Supervisor</label>
                   <input className="w-full text-[11px] font-bold p-2.5 bg-slate-50 rounded-xl border border-slate-200" value={headerData.supervisor} onChange={e => setHeaderData({...headerData, supervisor: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-1">C.D.</label>
                   <select 
                      className="w-full text-[11px] font-bold p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-blue-500/20 appearance-none" 
                      value={headerData.cd} 
                      onChange={e => setHeaderData({...headerData, cd: e.target.value})}
                    >
                      <option value="CD 87">CD 87</option>
                      <option value="CD 116">CD 116</option>
                    </select>
                 </div>
               </div>
               
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-blue-800 uppercase ml-1 flex items-center gap-1"><Briefcase size={10}/> VENDEDOR (CÓDIGO E NOME)</label>
                 <input 
                  className="w-full text-xs font-bold p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 outline-none focus:ring-2 ring-blue-500/20" 
                  placeholder="EX: 19855-YURI LIMA-TUTOIA"
                  value={headerData.vendedor} 
                  onChange={e => setHeaderData({...headerData, vendedor: e.target.value})} 
                 />
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
                 <label className="text-[9px] font-black text-blue-800 uppercase ml-1 flex items-center gap-1"><Calculator size={10}/> CÓDIGO DO PEDIDO</label>
                 <input 
                  className="w-full text-xs font-bold p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 outline-none focus:ring-2 ring-blue-500/20" 
                  placeholder="Ex: 318021-1"
                  value={headerData.pedido} 
                  onChange={e => setHeaderData({...headerData, pedido: e.target.value})} 
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-[9px] font-black text-blue-800 uppercase ml-1 flex items-center gap-1"><Clock size={10}/> PRAZO</label>
                 <select 
                   className="w-full text-xs font-bold p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 outline-none focus:ring-2 ring-blue-500/20 appearance-none" 
                   value={headerData.prazo} 
                   onChange={e => setHeaderData({...headerData, prazo: e.target.value})}
                 >
                   <option value="32">1 - 32 DIAS</option>
                   <option value="22/32/42">2 - 22/32/42 DIAS</option>
                 </select>
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
                {aiAnalysis && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1 text-blue-800">
                      <Sparkles size={14}/>
                      <span className="text-[10px] font-black uppercase tracking-widest">Análise da IA</span>
                    </div>
                    <p className="text-xs font-bold text-blue-900 leading-relaxed italic">
                      "{aiAnalysis}"
                    </p>
                  </div>
                )}

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

                {/* CAMPO DE DETALHAMENTO RESUMIDO */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <FileText size={14}/>
                    <span className="text-[9px] font-black uppercase tracking-widest">Detalhamento Resumido da Conferência</span>
                  </div>
                  <textarea 
                    className="w-full bg-transparent text-[11px] font-bold text-slate-700 outline-none resize-none min-h-[60px] placeholder:text-slate-300"
                    placeholder="Descreva o que está sendo feito durante esta conferência..."
                    value={supervisorSummary}
                    onChange={(e) => setSupervisorSummary(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-left duration-300">
                    <AlertCircle size={16}/>
                    <span className="text-[10px] font-bold uppercase">{error}</span>
                  </div>
                )}

                <button 
                  onClick={processValidation}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg border-b-4 ${isProcessing ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-600 text-white border-blue-800 hover:bg-blue-700 active:scale-95'}`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin"/>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18}/>
                      <span>Validar Pedido</span>
                    </>
                  )}
                </button>
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

          {!isSupervisorMode && (
            <div className="space-y-4">
              <button 
                onClick={addBloco}
                className="w-full py-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16}/> Adicionar Novo Bloco
              </button>

              {/* PREVIEW DA MENSAGEM */}
              {isSupervisorMode && (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-2">
                    <Share2 size={14} className="text-blue-600"/>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo da Solicitação</span>
                  </div>
                  <div className="p-6">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <pre className="text-[10px] font-bold text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {getGeneratedMessage()}
                      </pre>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 mt-3 uppercase text-center italic">
                      Esta é a mensagem que será enviada ao supervisor para validação.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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

      {/* MODAL DE SENHA SUPERVISOR */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32}/>
              </div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Acesso Restrito</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-6">Insira a senha de supervisor</p>
              
              <input 
                type="password"
                autoFocus
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-lg font-black outline-none focus:ring-2 ring-blue-500/20 mb-4"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmPassword()}
              />

              {error && <p className="text-red-500 text-[10px] font-bold uppercase mb-4">{error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setShowPasswordModal(false); setPasswordInput(""); setError(null); }}
                  className="py-3 rounded-xl font-black text-[10px] uppercase text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmPassword}
                  className="py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg border-b-4 border-blue-800 active:scale-95 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
