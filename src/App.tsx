import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Gift, Trash2, Plus, Share2, CheckCircle2, Search, Calculator, User, Briefcase, Users, RefreshCw, Loader2, Camera, FileText, Sparkles, AlertCircle, Lock, Clock, BarChart3, TrendingUp, Trophy, ChevronDown, ChevronUp, Store, MapPin, ArrowLeft, ChevronLeft, FolderDown } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { RCA_METAS_DATA } from './data/rcaData';
import { RCAMetasPanel } from './components/RCAMetasPanel';
import { ArquivosUnileverPanel } from './components/ArquivosUnileverPanel';
import unicoDataRaw from './data/unico_data.json';

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

const decompressUnicoData = (raw: any): any => {
  if (!raw || !raw.vendedores) return raw;
  
  const decompressItem = (item: any) => {
    return {
      cnpj: item.j || '',
      codCliente: item.c || '',
      cliente: raw.clientes[item.i] || '',
      cidade: raw.cidades[item.d] || '',
      classificacao: raw.classificacoes[item.l] || '',
      codVendedor: item.v || '',
      vendedor: raw.vendedores[item.r] || '',
      objSortHc: item.h || 0,
      objSortNt: item.n || 0,
      metaHc: item.mh || '',
      metaNt: item.mn || '',
      objSortBw: item.b || 0,
      objSortPc: item.p || 0,
      metaBw: item.mb || ''
    };
  };

  return {
    numericas: (raw.numericasHc || []).map(decompressItem),
    ponderadas: (raw.ponderadasHc || []).map(decompressItem),
    numericasHc: (raw.numericasHc || []).map(decompressItem),
    ponderadasHc: (raw.ponderadasHc || []).map(decompressItem),
    numericasPc: (raw.numericasPc || []).map(decompressItem),
    ponderadasPc: (raw.ponderadasPc || []).map(decompressItem),
    cob: (raw.cob || []).map(decompressItem),
    lastUpdate: raw.lastUpdate
  };
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
  const [isMetasUnlocked, setIsMetasUnlocked] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'bonificacao' | 'unico'>('bonificacao');
  const [unicoSearchCode, setUnicoSearchCode] = useState("");
  const [selectedUnicoRCA, setSelectedUnicoRCA] = useState<any>(null);
  const [unicoTeam, setUnicoTeam] = useState<'hc_nt' | 'pc_bw'>('hc_nt');
  const [unicoFilterType, setUnicoFilterType] = useState<'numericas' | 'ponderadas' | 'cob'>('numericas');
  const [unicoNumericaClassFilter, setUnicoNumericaClassFilter] = useState<'todos' | 'A' | 'B' | 'C'>('todos');
  const [unicoLiveDataset, setUnicoLiveDataset] = useState<any>(() => {
    const decompressed = decompressUnicoData(unicoDataRaw);
    return {
      numericas: decompressed.numericas || [],
      ponderadas: decompressed.ponderadas || [],
      numericasHc: decompressed.numericasHc || [],
      ponderadasHc: decompressed.ponderadasHc || [],
      numericasPc: decompressed.numericasPc || [],
      ponderadasPc: decompressed.ponderadasPc || [],
      cob: decompressed.cob || [],
      lastUpdate: decompressed.lastUpdate
    };
  });
  const [isUpdatingUnicoLive, setIsUpdatingUnicoLive] = useState(false);
  const [unicoViewMode, setUnicoViewMode] = useState<'individual' | 'dashboard' | 'todos_clientes'>('individual');
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState("");
  const [dashboardPage, setDashboardPage] = useState(1);
  const [expandedSellerCode, setExpandedSellerCode] = useState<string | null>(null);
  const [clientsSearchTerm, setClientsSearchTerm] = useState("");
  const [clientsPage, setClientsPage] = useState(1);

  // Relying entirely on local static json from unico_data.json to keep publishing lightweight and fast
  useEffect(() => {
    setIsUpdatingUnicoLive(false);
  }, []);

  // Compute unique sellers (vendedores)
  const uniqueVendedores = React.useMemo(() => {
    const map = new Map<string, string>();
    const isHc = unicoTeam === 'hc_nt';
    const numList = isHc ? (unicoLiveDataset.numericasHc || []) : (unicoLiveDataset.numericasPc || []);
    const pondList = isHc ? (unicoLiveDataset.ponderadasHc || []) : (unicoLiveDataset.ponderadasPc || []);
    const cobList = unicoLiveDataset.cob || [];

    const activeTeamCodes = new Set<string>();

    numList.forEach(item => {
      if (item.codVendedor) {
        const code = item.codVendedor.toString().trim();
        activeTeamCodes.add(code);
        map.set(code, (item.vendedor || '').toString().trim() || `${item.codVendedor} - Vendedor`);
      }
    });
    pondList.forEach(item => {
      if (item.codVendedor) {
        const code = item.codVendedor.toString().trim();
        activeTeamCodes.add(code);
        map.set(code, (item.vendedor || '').toString().trim() || `${item.codVendedor} - Vendedor`);
      }
    });
    cobList.forEach(item => {
      if (item.codVendedor) {
        const code = item.codVendedor.toString().trim();
        if (activeTeamCodes.has(code)) {
          map.set(code, (item.vendedor || '').toString().trim() || `${item.codVendedor} - Vendedor`);
        }
      }
    });
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [unicoLiveDataset, unicoTeam]);

  // Helper to determine store classification
  const getStoreClass = React.useCallback((classificacao: string): 'A' | 'B' | 'C' | 'Outros' => {
    const cl = (classificacao || '').trim().toLowerCase();
    if (cl.includes('num. a') || cl.includes('classe a') || cl === 'a' || cl.endsWith(' a')) return 'A';
    if (cl.includes('num. b') || cl.includes('classe b') || cl === 'b' || cl.endsWith(' b')) return 'B';
    if (cl.includes('num. c') || cl.includes('classe c') || cl === 'c' || cl.endsWith(' c')) return 'C';
    return 'Outros';
  }, []);

  // Compiled dashboard data for all sellers
  const sellersDashboardData = React.useMemo(() => {
    const list: any[] = [];
    uniqueVendedores.forEach(v => {
      const isHc = unicoTeam === 'hc_nt';
      const numStores = (isHc ? (unicoLiveDataset.numericasHc || []) : (unicoLiveDataset.numericasPc || []))
        .filter(item => (item.codVendedor || '').toString().trim() === v.code);
      const pondStores = (isHc ? (unicoLiveDataset.ponderadasHc || []) : (unicoLiveDataset.ponderadasPc || []))
        .filter(item => (item.codVendedor || '').toString().trim() === v.code);
      const cobStores = (unicoLiveDataset.cob || [])
        .filter(item => (item.codVendedor || '').toString().trim() === v.code);

      const classA = numStores.filter(item => getStoreClass(item.classificacao) === 'A');
      const classB = numStores.filter(item => getStoreClass(item.classificacao) === 'B');
      const classC = numStores.filter(item => getStoreClass(item.classificacao) === 'C');
      const classOther = numStores.filter(item => getStoreClass(item.classificacao) === 'Outros');

      let classA_val1 = 0, classA_val2 = 0;
      let classB_val1 = 0, classB_val2 = 0;
      let classC_val1 = 0, classC_val2 = 0;
      let total_val1 = 0, total_val2 = 0;

      if (isHc) {
        classA_val1 = classA.reduce((sum, item) => sum + (item.objSortHc || 0), 0);
        classA_val2 = classA.reduce((sum, item) => sum + (item.objSortNt || 0), 0);
        classB_val1 = classB.reduce((sum, item) => sum + (item.objSortHc || 0), 0);
        classB_val2 = classB.reduce((sum, item) => sum + (item.objSortNt || 0), 0);
        classC_val1 = classC.reduce((sum, item) => sum + (item.objSortHc || 0), 0);
        classC_val2 = classC.reduce((sum, item) => sum + (item.objSortNt || 0), 0);

        total_val1 = numStores.reduce((sum, item) => sum + (item.objSortHc || 0), 0);
        total_val2 = numStores.reduce((sum, item) => sum + (item.objSortNt || 0), 0);
      } else {
        classA_val1 = classA.reduce((sum, item) => sum + (item.objSortBw || 0), 0);
        classA_val2 = classA.reduce((sum, item) => sum + (item.objSortPc || 0), 0);
        classB_val1 = classB.reduce((sum, item) => sum + (item.objSortBw || 0), 0);
        classB_val2 = classB.reduce((sum, item) => sum + (item.objSortPc || 0), 0);
        classC_val1 = classC.reduce((sum, item) => sum + (item.objSortBw || 0), 0);
        classC_val2 = classC.reduce((sum, item) => sum + (item.objSortPc || 0), 0);

        total_val1 = numStores.reduce((sum, item) => sum + (item.objSortBw || 0), 0);
        total_val2 = numStores.reduce((sum, item) => sum + (item.objSortPc || 0), 0);
      }

      list.push({
        code: v.code,
        name: v.name,
        numCount: numStores.length,
        pondCount: pondStores.length,
        cobCount: cobStores.length,
        totalClients: numStores.length + pondStores.length + cobStores.length,
        classA_count: classA.length,
        classB_count: classB.length,
        classC_count: classC.length,
        classOther_count: classOther.length,
        classA_val1,
        classA_val2,
        classB_val1,
        classB_val2,
        classC_val1,
        classC_val2,
        total_val1,
        total_val2,
        clients: [
          ...numStores.map(s => ({ ...s, tipo: 'Numérica' })),
          ...pondStores.map(s => ({ ...s, tipo: 'Ponderada' })),
          ...cobStores.map(s => ({ ...s, tipo: 'COB' }))
        ]
      });
    });

    return list;
  }, [uniqueVendedores, unicoLiveDataset, getStoreClass, unicoTeam]);

  // Filter unique sellers for the main dropdown/search
  const filteredVendedores = React.useMemo(() => {
    const term = unicoSearchCode.trim().toLowerCase();
    if (!term) return [];
    return uniqueVendedores.filter(v => 
      v.code.toLowerCase().includes(term) || 
      v.name.toLowerCase().includes(term)
    );
  }, [unicoSearchCode, uniqueVendedores]);

  // Filter dashboard sellers
  const filteredDashboardSellers = React.useMemo(() => {
    const term = dashboardSearchTerm.trim().toLowerCase();
    if (!term) return sellersDashboardData;
    return sellersDashboardData.filter(v => 
      v.code.toLowerCase().includes(term) || 
      v.name.toLowerCase().includes(term) ||
      v.clients.some((c: any) => 
        (c.cliente || '').toLowerCase().includes(term) || 
        (c.codCliente || '').toLowerCase().includes(term) ||
        (c.cnpj || '').toLowerCase().includes(term)
      )
    );
  }, [dashboardSearchTerm, sellersDashboardData]);

  // Flattened clients list
  const allClientsList = React.useMemo(() => {
    const list: any[] = [];
    const isHc = unicoTeam === 'hc_nt';
    const numList = isHc ? (unicoLiveDataset.numericasHc || []) : (unicoLiveDataset.numericasPc || []);
    const pondList = isHc ? (unicoLiveDataset.ponderadasHc || []) : (unicoLiveDataset.ponderadasPc || []);
    const cobList = unicoLiveDataset.cob || [];

    const activeTeamCodes = new Set<string>();

    numList.forEach(item => {
      const code = (item.codVendedor || '').toString().trim();
      activeTeamCodes.add(code);
      list.push({
        ...item,
        codVendedor: code,
        tipo: 'Numérica',
        storeClass: getStoreClass(item.classificacao)
      });
    });
    pondList.forEach(item => {
      const code = (item.codVendedor || '').toString().trim();
      activeTeamCodes.add(code);
      list.push({
        ...item,
        codVendedor: code,
        tipo: 'Ponderada',
        storeClass: 'Ponderada'
      });
    });
    cobList.forEach(item => {
      const code = (item.codVendedor || '').toString().trim();
      if (activeTeamCodes.has(code)) {
        list.push({
          ...item,
          codVendedor: code,
          tipo: 'COB',
          storeClass: 'COB'
        });
      }
    });
    return list;
  }, [unicoLiveDataset, getStoreClass, unicoTeam]);

  // Filter flat client list
  const filteredAllClients = React.useMemo(() => {
    const term = clientsSearchTerm.trim().toLowerCase();
    if (!term) return allClientsList;
    return allClientsList.filter(c => 
      (c.cliente || '').toLowerCase().includes(term) || 
      (c.codCliente || '').toLowerCase().includes(term) ||
      (c.cnpj || '').toLowerCase().includes(term) ||
      (c.vendedor || '').toLowerCase().includes(term) ||
      (c.codVendedor || '').toLowerCase().includes(term) ||
      (c.cidade || '').toLowerCase().includes(term)
    );
  }, [clientsSearchTerm, allClientsList]);

  // Stores for selected vendedor
  const sellerStoresNumericas = React.useMemo(() => {
    if (!selectedUnicoRCA) return [];
    const isHc = unicoTeam === 'hc_nt';
    const list = isHc ? (unicoLiveDataset.numericasHc || []) : (unicoLiveDataset.numericasPc || []);
    return list.filter(item => (item.codVendedor || '').toString().trim() === (selectedUnicoRCA.code || '').toString().trim());
  }, [selectedUnicoRCA, unicoLiveDataset, unicoTeam]);

  const sellerStoresPonderadas = React.useMemo(() => {
    if (!selectedUnicoRCA) return [];
    const isHc = unicoTeam === 'hc_nt';
    const list = isHc ? (unicoLiveDataset.ponderadasHc || []) : (unicoLiveDataset.ponderadasPc || []);
    return list.filter(item => (item.codVendedor || '').toString().trim() === (selectedUnicoRCA.code || '').toString().trim());
  }, [selectedUnicoRCA, unicoLiveDataset, unicoTeam]);

  const sellerStoresCob = React.useMemo(() => {
    if (!selectedUnicoRCA) return [];
    const list = unicoLiveDataset.cob || [];
    return list.filter(item => (item.codVendedor || '').toString().trim() === (selectedUnicoRCA.code || '').toString().trim());
  }, [selectedUnicoRCA, unicoLiveDataset]);

  // Filter numerical stores by classification A, B, C
  const filteredSellerStoresNumericas = React.useMemo(() => {
    let list = sellerStoresNumericas;
    if (unicoNumericaClassFilter !== 'todos') {
      const matchClass = unicoNumericaClassFilter.toLowerCase();
      list = list.filter(item => {
        const cl = (item.classificacao || '').toLowerCase();
        return cl.includes(`num. ${matchClass}`) || cl.includes(`classe ${matchClass}`) || cl === matchClass || cl.endsWith(` ${matchClass}`);
      });
    }
    return list;
  }, [sellerStoresNumericas, unicoNumericaClassFilter]);

  const [rcaSearchTerm, setRcaSearchTerm] = useState("");
  const [selectedRCA, setSelectedRCA] = useState<any>(null);
  const [selectedRcaTab, setSelectedRcaTab] = useState<'volume' | 'batalhas'>('volume');
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
    cd: "87",
    vendedor: "",
    cliente: "",
    tipoCliente: "",
    pedido: "",
    prazo: "32"
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
    const totalBonificado = blocos.reduce((acc, b) => acc + (b.res.valorBonificado || 0), 0);

    let msg = `EQUIPE:${headerData.equipe}\n`;
    msg += `CD:${headerData.cd}\n`;
    msg += `CLIENTE:${headerData.cliente}\n`;
    msg += `TIPO DE CLIENTE:${headerData.tipoCliente}\n`;
    msg += `RCA:${headerData.vendedor}\n`;
    msg += `Nº DO PEDIDO: ${headerData.pedido}\n`;
    msg += `VALOR TOTAL BONIFICADO: ${formatarMoeda(totalBonificado)}\n`;
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
      
      // Preço de Nota do produto vendido
      const precoNotaVendaVal = parseFloat(b.vendaPNota) || 0;
      const precoNotaFormatado = precoNotaVendaVal.toFixed(2).replace('.', ',');

      // Usa o preço do campo ou o preço do banco de dados (mesma lógica do cálculo)
      const precoPraticado = parseFloat(b.bonificaPrecoPraticado) || (prodBonif ? prodBonif.preco : 0);
      const precoFormatado = precoPraticado.toFixed(2).replace('.', ',');
      
      msg += `${nomeVenda} (Nota: R$ ${precoNotaFormatado}) -> BONIF: ${nomeBonif} (Praticado: R$ ${precoFormatado})\n`;
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
        tipoCliente: "",
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
      {/* TOPO DE MARCA UNILEVER */}
      <div className="bg-gradient-to-r from-blue-900 via-[#001E62] to-blue-950 text-white border-b border-blue-800 shadow-sm relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-xs font-black uppercase tracking-widest leading-none bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Unilever Portal
              </h1>
              <span className="text-[7px] font-bold text-yellow-400 tracking-[0.2em] uppercase mt-0.5">
                Distribuição & Metas
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[7px] font-black px-2 py-0.5 bg-blue-800/80 text-blue-200 rounded border border-blue-700 uppercase tracking-widest">
              v12.0
            </span>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO SUPERIOR */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 flex items-center justify-around">
          <button 
            onClick={() => setActiveTab('bonificacao')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2 ${activeTab === 'bonificacao' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
            <Calculator size={18}/>
            <span className="text-[8px] font-black uppercase tracking-widest">BONIFICAÇÃO</span>
          </button>
          <button 
            onClick={() => setActiveTab('unico')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2 ${activeTab === 'unico' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
            <Sparkles size={18}/>
            <span className="text-[8px] font-black uppercase tracking-widest">ÚNICO</span>
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
                        <select 
                          className="w-full text-[11px] font-bold p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-blue-500/20 appearance-none uppercase" 
                          value={headerData.equipe} 
                          onChange={e => setHeaderData({...headerData, equipe: e.target.value})} 
                        >
                          <option value="">SELECIONE A EQUIPE</option>
                          <option value="423 - DISTRIBUICAO UNILEVER - IMPERATRIZ/METROPOLITANA PC - MA">423 - DISTRIBUICAO UNILEVER - IMPERATRIZ/METROPOLITANA PC - MA</option>
                          <option value="408 - DISTRIBUICAO UNILEVER - SUL PC - MA">408 - DISTRIBUICAO UNILEVER - SUL PC - MA</option>
                          <option value="185 - DISTRIBUICAO UNILEVER - COCAIS PC - MA">185 - DISTRIBUICAO UNILEVER - COCAIS PC - MA</option>
                          <option value="622 - DISTRIBUICAO UNILEVER - BAIXADA PC - MA">622 - DISTRIBUICAO UNILEVER - BAIXADA PC - MA</option>
                          <option value="591 - DISTRIBUICAO UNILEVER - CAPITAL/METROPOLITANA PC - MA">591 - DISTRIBUICAO UNILEVER - CAPITAL/METROPOLITANA PC - MA</option>
                          <option value="190 - DISTRIBUICAO UNILEVER - IMPERATRIZ/METROPOLITANA HF - MA">190 - DISTRIBUICAO UNILEVER - IMPERATRIZ/METROPOLITANA HF - MA</option>
                          <option value="178 - DISTRIBUICAO UNILEVER - SUL HF - MA">178 - DISTRIBUICAO UNILEVER - SUL HF - MA</option>
                          <option value="31 - DISTRIBUICAO UNILEVER - COCAIS HF - MA">31 - DISTRIBUICAO UNILEVER - COCAIS HF - MA</option>
                          <option value="623 - DISTRIBUICAO UNILEVER - BAIXADA HF - MA">623 - DISTRIBUICAO UNILEVER - BAIXADA HF - MA</option>
                          <option value="576 - DISTRIBUICAO UNILEVER - CAPITAL/METROPOLITANA HF - MA">576 - DISTRIBUICAO UNILEVER - CAPITAL/METROPOLITANA HF - MA</option>
                        </select>
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
                      <label className="text-[9px] font-black text-blue-800 uppercase ml-1 flex items-center gap-1">
                        <FileText size={10}/> TIPO DE CLIENTE
                      </label>
                      <select 
                        className="w-full text-xs font-bold p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 outline-none focus:ring-2 ring-blue-500/20 appearance-none uppercase" 
                        value={headerData.tipoCliente} 
                        onChange={e => setHeaderData({...headerData, tipoCliente: e.target.value})} 
                      >
                        <option value="">SELECIONE O TIPO (CPF / CNPJ)</option>
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="SEM CNPJ">SEM CNPJ</option>
                      </select>
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

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-green-700 uppercase ml-1 flex items-center gap-1"><Gift size={10}/> VALOR TOTAL BONIFICADO</label>
                      <div className="w-full text-sm font-black p-3.5 bg-green-50/50 rounded-2xl border border-green-200 text-green-800 shadow-inner flex items-center justify-between">
                         <span>TOTAL DO INVESTIMENTO:</span>
                         <span className="text-lg">{formatarMoeda(blocos.reduce((acc, b) => acc + (b.res.valorBonificado || 0), 0))}</span>
                      </div>
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
                        <span className="text-slate-400 uppercase">Tipo:</span>
                        <span className="text-blue-900 uppercase">{headerData.tipoCliente || "Não informado"}</span>
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
            {/* CABEÇALHO ÚNICO */}
            <div className="bg-[#001E62] rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse"></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Sparkles size={24} className="text-emerald-300"/>
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Indicador Único</h2>
                 </div>
                 <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.3em] max-w-[280px] leading-relaxed">
                    Consulte seus clientes e objetivos de sortimento e volume
                 </p>
                 {isUpdatingUnicoLive && (
                   <div className="absolute bottom-2 right-4 flex items-center gap-1.5 bg-emerald-500/20 px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider text-emerald-300">
                     <Loader2 size={10} className="animate-spin"/> Atualizando...
                   </div>
                 )}
               </div>
            </div>

            {/* SELEÇÃO DE EQUIPE */}
            <div className="flex flex-col gap-2 bg-white p-4 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Equipe Unilever Selecionada:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setUnicoTeam('hc_nt');
                    setSelectedUnicoRCA(null);
                    setUnicoSearchCode("");
                  }}
                  className={`py-3.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all flex flex-col items-center gap-0.5 ${
                    unicoTeam === 'hc_nt'
                      ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <span className="text-[8px] font-bold text-yellow-400">UNILEVER EQUIPE 1</span>
                  <span>HC e NT</span>
                </button>
                <button
                  onClick={() => {
                    setUnicoTeam('pc_bw');
                    setSelectedUnicoRCA(null);
                    setUnicoSearchCode("");
                  }}
                  className={`py-3.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all flex flex-col items-center gap-0.5 ${
                    unicoTeam === 'pc_bw'
                      ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <span className="text-[8px] font-bold text-yellow-400">UNILEVER EQUIPE 2</span>
                  <span>PC e BW</span>
                </button>
              </div>
            </div>

            {/* SUB-SELEÇÃO DE MODO DE VISUALIZAÇÃO */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl shadow-inner mb-6">
              <button
                onClick={() => setUnicoViewMode('individual')}
                className={`py-3 rounded-xl font-black text-[9px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                  unicoViewMode === 'individual'
                    ? 'bg-white text-[#001E62] shadow-sm font-black'
                    : 'text-slate-500 hover:text-[#001E62]'
                }`}
              >
                <User size={12} />
                <span>Consulta RCA</span>
              </button>
              <button
                onClick={() => setUnicoViewMode('dashboard')}
                className={`py-3 rounded-xl font-black text-[9px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                  unicoViewMode === 'dashboard'
                    ? 'bg-white text-[#001E62] shadow-sm font-black'
                    : 'text-slate-500 hover:text-[#001E62]'
                }`}
              >
                <Users size={12} />
                <span>Dashboard Geral</span>
              </button>
              <button
                onClick={() => setUnicoViewMode('todos_clientes')}
                className={`py-3 rounded-xl font-black text-[9px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                  unicoViewMode === 'todos_clientes'
                    ? 'bg-white text-[#001E62] shadow-sm font-black'
                    : 'text-slate-500 hover:text-[#001E62]'
                }`}
              >
                <Briefcase size={12} />
                <span>Ver Todos Clientes</span>
              </button>
            </div>

            {/* MODO 2: DASHBOARD GERAL DE VENDEDORES */}
            {unicoViewMode === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* CARDS DE MÉTRICAS RÁPIDAS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-white p-4 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Total Vendedores</span>
                    <span className="text-xl font-black text-blue-900">{uniqueVendedores.length}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Clientes Numéricos</span>
                    <span className="text-xl font-black text-blue-900">
                      {unicoTeam === 'hc_nt' ? (unicoLiveDataset.numericasHc || []).length : (unicoLiveDataset.numericasPc || []).length}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Clientes Ponderados</span>
                    <span className="text-xl font-black text-blue-900">
                      {unicoTeam === 'hc_nt' ? (unicoLiveDataset.ponderadasHc || []).length : (unicoLiveDataset.ponderadasPc || []).length}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Clientes COB</span>
                    <span className="text-xl font-black text-purple-600">{(unicoLiveDataset.cob || []).length}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col gap-1 col-span-2 md:col-span-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Total Geral (Filtrado)</span>
                    <span className="text-xl font-black text-emerald-600">{allClientsList.length} PDVs</span>
                  </div>
                </div>

                {/* BUSCA */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Buscar por vendedor, cliente, código ou CNPJ..."
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-blue-600 shadow-xl shadow-blue-900/5 text-sm font-bold transition-all"
                      value={dashboardSearchTerm}
                      onChange={(e) => {
                        setDashboardSearchTerm(e.target.value);
                        setDashboardPage(1);
                      }}
                    />
                  </div>
                </div>

                {/* LISTA DE VENDEDORES COMPILADA */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Vendedores ({filteredDashboardSellers.length})</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Clique na Linha para Expandir Lojas A, B, C e Objetivos</span>
                  </div>

                  {(() => {
                    const itemsPerPage = 10;
                    const totalPages = Math.ceil(filteredDashboardSellers.length / itemsPerPage);
                    const startIndex = (dashboardPage - 1) * itemsPerPage;
                    const paginatedSellers = filteredDashboardSellers.slice(startIndex, startIndex + itemsPerPage);

                    if (filteredDashboardSellers.length === 0) {
                      return (
                        <div className="text-center py-12 bg-white rounded-[2.5rem] border border-slate-100 text-slate-400 font-bold text-xs">
                          Nenhum vendedor encontrado com os filtros aplicados.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {paginatedSellers.map((v) => {
                          const isExpanded = expandedSellerCode === v.code;
                          return (
                            <div key={v.code} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden transition-all">
                              {/* CABEÇALHO DO VENDEDOR */}
                              <div 
                                onClick={() => setExpandedSellerCode(isExpanded ? null : v.code)}
                                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <User size={20} />
                                  </div>
                                  <div>
                                    <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">CÓD: {v.code}</span>
                                    <h4 className="text-xs font-black text-slate-800 uppercase mt-0.5">{v.name}</h4>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[8px] font-black px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 uppercase tracking-wider">
                                    Numéricas: {v.numCount}
                                  </span>
                                  <span className="text-[8px] font-black px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100 uppercase tracking-wider">
                                    Ponderadas: {v.pondCount}
                                  </span>
                                  <span className="text-[8px] font-black px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 uppercase tracking-wider">
                                    COB: {v.cobCount}
                                  </span>
                                  <span className="text-[8px] font-black px-2 py-1 bg-slate-50 text-slate-700 rounded border border-slate-200 uppercase tracking-wider">
                                    Total: {v.totalClients} PDVs
                                  </span>
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </div>
                                </div>
                              </div>

                              {/* PAINEL DE DETALHES DO VENDEDOR EXPANDIDO */}
                              {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6">
                                  {/* RESUMO DOS OBJETIVOS POR CLASSE DE LOJA */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-800 uppercase">Lojas Classe A</span>
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{v.classA_count} PDVs</span>
                                      </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-800 uppercase">Lojas Classe B</span>
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{v.classB_count} PDVs</span>
                                      </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-800 uppercase">Lojas Classe C</span>
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{v.classC_count} PDVs</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* LISTA COMPLETA DOS CLIENTES VINCULADOS */}
                                  <div className="space-y-2">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clientes Vinculados ({v.clients.length})</h5>
                                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden max-h-72 overflow-y-auto shadow-sm">
                                      <table className="w-full text-left border-collapse">
                                        <thead>
                                          <tr className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase border-b border-slate-100 tracking-wider">
                                            <th className="p-3 pl-4">Código / Cliente</th>
                                            <th className="p-3">CNPJ</th>
                                            <th className="p-3">Cidade</th>
                                            <th className="p-3">Classe</th>
                                            <th className="p-3">Tipo</th>
                                            <th className="p-3 text-right pr-4">
                                              {unicoTeam === 'hc_nt' ? 'Objetivos (HC / NT)' : 'Objetivos (BW / PC)'}
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {v.clients.map((c: any, cIdx: number) => (
                                            <tr key={c.codCliente + '-' + c.tipo + '-' + cIdx} className="hover:bg-slate-50/50 transition-colors">
                                              <td className="p-3 pl-4 text-xs font-black text-slate-800 uppercase truncate max-w-[220px]">
                                                {c.cliente || `${c.codCliente} - Cliente`}
                                              </td>
                                              <td className="p-3 text-[10px] font-mono text-slate-500">{c.cnpj || '-'}</td>
                                              <td className="p-3 text-[10px] font-bold text-slate-600 uppercase">{c.cidade || '-'}</td>
                                              <td className="p-3">
                                                <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded shadow-sm min-w-[70px] text-center ${
                                                  c.tipo === 'COB'
                                                    ? 'bg-emerald-600 text-white'
                                                    : c.tipo === 'Ponderada' 
                                                      ? 'bg-purple-600 text-white' 
                                                      : getStoreClass(c.classificacao) === 'A'
                                                        ? 'bg-rose-600 text-white'
                                                        : getStoreClass(c.classificacao) === 'B'
                                                          ? 'bg-amber-500 text-white'
                                                          : getStoreClass(c.classificacao) === 'C'
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-500 text-white'
                                                }`}>
                                                  {c.tipo === 'COB' ? 'COB' : c.tipo === 'Ponderada' ? 'POND' : `NUM ${getStoreClass(c.classificacao)}`}
                                                </span>
                                              </td>
                                              <td className="p-3 text-[10px] font-black text-slate-500 uppercase">{c.tipo}</td>
                                              <td className="p-3 text-right pr-4 font-mono text-xs font-bold text-slate-700">
                                                {c.tipo === 'COB' ? (
                                                  '-'
                                                ) : c.tipo === 'Ponderada' ? (
                                                  unicoTeam === 'hc_nt' ? `(Meta: ${c.metaHc || '-'} / ${c.metaNt || '-'})` : `(Meta: ${c.metaBw || '-'})`
                                                ) : (
                                                  unicoTeam === 'hc_nt' ? `${c.objSortHc} HC / ${c.objSortNt} NT` : `${c.objSortBw} BW / ${c.objSortPc} PC`
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* CONTROLES DE PAGINAÇÃO */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mt-4">
                            <button
                              disabled={dashboardPage === 1}
                              onClick={() => setDashboardPage(prev => Math.max(1, prev - 1))}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              Anterior
                            </button>
                            <span className="text-[10px] font-black text-slate-500 uppercase">Página {dashboardPage} de {totalPages}</span>
                            <button
                              disabled={dashboardPage === totalPages}
                              onClick={() => setDashboardPage(prev => Math.min(totalPages, prev + 1))}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              Próxima
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* MODO 3: TODOS OS CLIENTES */}
            {unicoViewMode === 'todos_clientes' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* BARRA DE BUSCA GERAL DE CLIENTES */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Buscar por cliente, código, CNPJ, cidade ou vendedor..."
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-blue-600 shadow-xl shadow-blue-900/5 text-sm font-bold transition-all"
                    value={clientsSearchTerm}
                    onChange={(e) => {
                      setClientsSearchTerm(e.target.value);
                      setClientsPage(1);
                    }}
                  />
                </div>

                {/* TABELA COMPLETA COM TODOS OS CLIENTES E OBJETIVOS */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Todos os Clientes ({filteredAllClients.length})</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Listagem Direta da Base Única</span>
                  </div>

                  {(() => {
                    const itemsPerPage = 20;
                    const totalPages = Math.ceil(filteredAllClients.length / itemsPerPage);
                    const startIndex = (clientsPage - 1) * itemsPerPage;
                    const paginatedClients = filteredAllClients.slice(startIndex, startIndex + itemsPerPage);

                    if (filteredAllClients.length === 0) {
                      return (
                        <div className="text-center py-12 bg-white rounded-[2.5rem] border border-slate-100 text-slate-400 font-bold text-xs">
                          Nenhum cliente encontrado na base geral.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl shadow-blue-900/5">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase border-b border-slate-100 tracking-wider">
                                  <th className="p-4 pl-6">Cliente</th>
                                  <th className="p-4">CNPJ</th>
                                  <th className="p-4">Cidade</th>
                                  <th className="p-4">Classe</th>
                                  <th className="p-4">Vendedor</th>
                                  <th className="p-4 text-right pr-6">
                                    {unicoTeam === 'hc_nt' ? 'Objetivo (HC / NT)' : 'Objetivo (BW / PC)'}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {paginatedClients.map((c: any, index) => (
                                  <tr key={c.codCliente + '-' + c.tipo + '-' + index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 pl-6">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-black text-slate-800 uppercase truncate max-w-[200px]">
                                          {c.cliente || `${c.codCliente} - Cliente`}
                                        </span>
                                        <span className="text-[8px] font-black text-slate-400">CÓD: {c.codCliente}</span>
                                      </div>
                                    </td>
                                    <td className="p-4 text-[10px] font-mono text-slate-500">{c.cnpj || '-'}</td>
                                    <td className="p-4 text-[10px] font-bold text-slate-600 uppercase">{c.cidade || '-'}</td>
                                    <td className="p-4">
                                      <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md shadow-sm min-w-[75px] text-center ${
                                        c.tipo === 'COB'
                                          ? 'bg-emerald-600 text-white'
                                          : c.tipo === 'Ponderada' 
                                            ? 'bg-purple-600 text-white' 
                                            : c.storeClass === 'A'
                                              ? 'bg-rose-600 text-white'
                                              : c.storeClass === 'B'
                                                ? 'bg-amber-500 text-white'
                                                : c.storeClass === 'C'
                                                  ? 'bg-blue-600 text-white'
                                                  : 'bg-slate-500 text-white'
                                      }`}>
                                        {c.tipo === 'COB' ? 'COB' : c.tipo === 'Ponderada' ? 'POND' : `NUM ${c.storeClass}`}
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[150px]">{c.vendedor || 'Sem Vendedor'}</span>
                                        <span className="text-[8px] font-bold text-slate-400">CÓD: {c.codVendedor || '-'}</span>
                                      </div>
                                    </td>
                                    <td className="p-4 text-right pr-6 font-mono text-xs font-bold text-slate-700">
                                      {c.tipo === 'COB' ? (
                                        '-'
                                      ) : c.tipo === 'Ponderada' ? (
                                        unicoTeam === 'hc_nt' ? `(Meta: ${c.metaHc || '-'} / ${c.metaNt || '-'})` : `(Meta: ${c.metaBw || '-'})`
                                      ) : (
                                        unicoTeam === 'hc_nt' ? `${c.objSortHc} HC / ${c.objSortNt} NT` : `${c.objSortBw} BW / ${c.objSortPc} PC`
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* CONTROLES DE PAGINAÇÃO */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <button
                              disabled={clientsPage === 1}
                              onClick={() => setClientsPage(prev => Math.max(1, prev - 1))}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              Anterior
                            </button>
                            <span className="text-[10px] font-black text-slate-500 uppercase">Página {clientsPage} de {totalPages}</span>
                            <button
                              disabled={clientsPage === totalPages}
                              onClick={() => setClientsPage(prev => Math.min(totalPages, prev + 1))}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              Próxima
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* MODO 1: INDIVIDUAL */}
            {unicoViewMode === 'individual' && (
              <div className="space-y-6">
                {/* BUSCA VENDEDOR */}
                {!selectedUnicoRCA ? (
              <div className="space-y-4">
                <div className="relative group">
                   <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                     <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                   </div>
                   <input 
                     type="text"
                     placeholder="Digite seu Código ou Nome de Vendedor..."
                     className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-5 pl-14 pr-6 outline-none focus:border-blue-600 shadow-xl shadow-blue-900/5 text-sm font-bold transition-all"
                     value={unicoSearchCode}
                     onChange={(e) => setUnicoSearchCode(e.target.value)}
                   />
                </div>

                {/* LISTA DE VENDEDORES ENCONTRADOS */}
                {unicoSearchCode.trim() !== "" ? (
                  <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100 max-h-96 overflow-y-auto space-y-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Vendedores Encontrados ({filteredVendedores.length})</h3>
                    {filteredVendedores.length > 0 ? (
                      filteredVendedores.map((v) => (
                        <button
                          key={v.code}
                          onClick={() => {
                            setSelectedUnicoRCA(v);
                            setUnicoSearchCode("");
                          }}
                          className="w-full text-left p-4 hover:bg-blue-50/50 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group transition-all"
                        >
                          <div>
                            <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">CÓDIGO: {v.code}</span>
                            <h4 className="text-xs font-black text-slate-800 uppercase mt-1 group-hover:text-blue-700 transition-colors">{v.name}</h4>
                          </div>
                          <Plus size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"/>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 font-bold text-xs">
                        Nenhum vendedor encontrado com este termo.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-[3rem] p-12 text-center border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2.5rem] flex items-center justify-center">
                      <User size={40}/>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Área do Vendedor</h4>
                      <p className="text-xs font-bold text-slate-400 max-w-[240px] mx-auto mt-1 leading-relaxed">
                        Digite seu código ou nome acima para visualizar a sua carteira de clientes, sortimentos e metas de volume.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* VENDEDOR SELECIONADO - PAINEL DO RCA */
              <div className="space-y-6">
                {/* CARD DE IDENTIFICAÇÃO DO VENDEDOR */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <User size={24} />
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">VENDEDOR SELECIONADO</span>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1 truncate max-w-[200px]">{selectedUnicoRCA.name}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUnicoRCA(null);
                      setUnicoSearchCode("");
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    ALTERAR
                  </button>
                </div>

                {/* FILTROS PRINCIPAIS: NUMÉRICAS VS PONDERADAS VS COB */}
                <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100">
                  <button
                    onClick={() => setUnicoFilterType('numericas')}
                    className={`py-4 rounded-xl font-black text-[10px] tracking-wider uppercase transition-all flex flex-col items-center gap-1 ${
                      unicoFilterType === 'numericas' 
                        ? 'bg-[#001E62] text-white shadow-lg' 
                        : 'hover:bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span className="text-sm font-black">{sellerStoresNumericas.length}</span>
                    <span>NUMÉRICAS</span>
                  </button>
                  <button
                    onClick={() => setUnicoFilterType('ponderadas')}
                    className={`py-4 rounded-xl font-black text-[10px] tracking-wider uppercase transition-all flex flex-col items-center gap-1 ${
                      unicoFilterType === 'ponderadas' 
                        ? 'bg-[#001E62] text-white shadow-lg' 
                        : 'hover:bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span className="text-sm font-black">{sellerStoresPonderadas.length}</span>
                    <span>PONDERADAS</span>
                  </button>
                  <button
                    onClick={() => setUnicoFilterType('cob')}
                    className={`py-4 rounded-xl font-black text-[10px] tracking-wider uppercase transition-all flex flex-col items-center gap-1 ${
                      unicoFilterType === 'cob' 
                        ? 'bg-[#001E62] text-white shadow-lg' 
                        : 'hover:bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span className="text-sm font-black">{sellerStoresCob.length}</span>
                    <span>COB</span>
                  </button>
                </div>

                {/* FILTRO SECUNDÁRIO PARA NUMÉRICAS (A, B, C) */}
                {unicoFilterType === 'numericas' && (
                  <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl overflow-x-auto animate-in fade-in duration-200">
                    <span className="text-[8px] font-black text-slate-400 uppercase px-2 tracking-wider">FILTRO CLASSE:</span>
                    {(['todos', 'A', 'B', 'C'] as const).map((cl) => (
                      <button
                        key={cl}
                        onClick={() => setUnicoNumericaClassFilter(cl)}
                        className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-wider transition-all whitespace-nowrap ${
                          unicoNumericaClassFilter === cl
                            ? 'bg-white text-blue-900 shadow-sm font-black'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {cl === 'todos' ? 'TODAS' : `CLASSE ${cl}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* LISTA DE LOJAS COM OBJETIVOS */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {unicoFilterType === 'numericas' ? 'LOJAS NUMÉRICAS' : unicoFilterType === 'ponderadas' ? 'LOJAS PONDERADAS' : 'CLIENTES COB'} (
                      {unicoFilterType === 'numericas' ? filteredSellerStoresNumericas.length : unicoFilterType === 'ponderadas' ? sellerStoresPonderadas.length : sellerStoresCob.length} CLIENTES)
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">OBJETIVOS UNILEVER</span>
                  </div>

                  <div className="space-y-3">
                    {unicoFilterType === 'numericas' ? (
                      filteredSellerStoresNumericas.length > 0 ? (
                        filteredSellerStoresNumericas.map((item, index) => (
                          <div key={index} className="bg-white rounded-3xl p-5 shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
                            {/* BADGE DE CLASSIFICAÇÃO */}
                            {(() => {
                              const storeCl = getStoreClass(item.classificacao);
                              const bgClass = item.classificacao === 'Ponderada' || storeCl === 'Outros'
                                ? 'bg-purple-600 text-white' 
                                : storeCl === 'A'
                                  ? 'bg-rose-600 text-white'
                                  : storeCl === 'B'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-blue-600 text-white';
                              return (
                                <div className={`absolute top-4 right-4 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm ${bgClass}`}>
                                  {item.classificacao || 'Numérica'}
                                </div>
                              );
                            })()}

                            <div className="flex flex-col gap-1 pr-20">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">COD CLIENTE: {item.codCliente}</span>
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">{item.cliente}</h4>
                              <div className="flex items-center gap-3 mt-1 text-slate-400 text-[8px] font-bold uppercase">
                                <span className="flex items-center gap-1"><MapPin size={10} /> {item.cidade}</span>
                                <span>CNPJ: {item.cnpj}</span>
                              </div>
                            </div>

                            {/* OBJETIVOS DE SORTIMENTO */}
                            {unicoTeam === 'hc_nt' ? (
                              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                                <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100/50 flex flex-col items-center text-center">
                                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">OBJ SORT HC</span>
                                  <span className="text-lg font-black text-blue-900 mt-1">{item.objSortHc} <span className="text-[10px] font-bold text-blue-500 uppercase">ITENS</span></span>
                                  <span className="text-[7px] font-bold text-blue-400 uppercase tracking-wider mt-1">Sugerido no Portfólio HC</span>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col items-center text-center">
                                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">OBJ SORT NT</span>
                                  <span className="text-lg font-black text-slate-800 mt-1">{item.objSortNt} <span className="text-[10px] font-bold text-slate-400 uppercase">ITENS</span></span>
                                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mt-1">Sugerido no Portfólio NT</span>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                                <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100/50 flex flex-col items-center text-center">
                                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">OBJ SORT BW</span>
                                  <span className="text-lg font-black text-blue-900 mt-1">{item.objSortBw} <span className="text-[10px] font-bold text-blue-500 uppercase">ITENS</span></span>
                                  <span className="text-[7px] font-bold text-blue-400 uppercase tracking-wider mt-1">Sugerido no Portfólio BW</span>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col items-center text-center">
                                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">OBJ SORT PC</span>
                                  <span className="text-lg font-black text-slate-800 mt-1">{item.objSortPc} <span className="text-[10px] font-bold text-slate-400 uppercase">ITENS</span></span>
                                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mt-1">Sugerido no Portfólio PC</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase">
                          Nenhuma loja numérica encontrada para esta classe.
                        </div>
                      )
                    ) : unicoFilterType === 'ponderadas' ? (
                      sellerStoresPonderadas.length > 0 ? (
                        sellerStoresPonderadas.map((item, index) => (
                          <div key={index} className="bg-white rounded-3xl p-5 shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
                            {/* BADGE DE CLASSIFICAÇÃO */}
                            <div className="absolute top-4 right-4 bg-purple-600 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                              {item.classificacao || 'Ponderada'}
                            </div>

                            <div className="flex flex-col gap-1 pr-24">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">COD CLIENTE: {item.codCliente}</span>
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">{item.cliente}</h4>
                              <div className="flex items-center gap-3 mt-1 text-slate-400 text-[8px] font-bold uppercase">
                                <span className="flex items-center gap-1"><MapPin size={10} /> {item.cidade}</span>
                                <span>CNPJ: {item.cnpj}</span>
                              </div>
                            </div>

                            {/* OBJETIVOS DE VOLUME E COBERTURA */}
                            {unicoTeam === 'hc_nt' ? (
                              <div className="space-y-3 pt-3 border-t border-slate-50">
                                {/* OBJETIVO DE VOLUME (DINHEIRO) */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-100 flex flex-col items-center text-center">
                                    <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">VOLUME META HC</span>
                                    <span className="text-sm font-black text-emerald-800 mt-1.5">{item.metaHc || 'R$ 0,00'}</span>
                                    <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Objetivo Financeiro</span>
                                  </div>
                                  <div className="bg-emerald-50/20 rounded-2xl p-3.5 border border-emerald-50 flex flex-col items-center text-center">
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">VOLUME META NT</span>
                                    <span className="text-sm font-black text-emerald-800 mt-1.5">{item.metaNt || 'R$ 0,00'}</span>
                                    <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Objetivo Financeiro</span>
                                  </div>
                                </div>

                                {/* OBJETIVO DE SORTIMENTO (ITENS) */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-blue-50/30 rounded-2xl p-3 border border-blue-100/30 flex flex-col items-center text-center">
                                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">SORTIMENTO HC</span>
                                    <span className="text-base font-black text-blue-900 mt-1">{item.objSortHc} <span className="text-[8px] font-bold text-blue-500 uppercase">ITENS</span></span>
                                  </div>
                                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50 flex flex-col items-center text-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SORTIMENTO NT</span>
                                    <span className="text-base font-black text-slate-800 mt-1">{item.objSortNt} <span className="text-[8px] font-bold text-slate-400 uppercase">ITENS</span></span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3 pt-3 border-t border-slate-50">
                                {/* OBJETIVO DE VOLUME (DINHEIRO) */}
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-100 flex flex-col items-center text-center">
                                    <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">VOLUME META BW</span>
                                    <span className="text-sm font-black text-emerald-800 mt-1.5">{item.metaBw || 'R$ 0,00'}</span>
                                    <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Objetivo Financeiro</span>
                                  </div>
                                </div>

                                {/* OBJETIVO DE SORTIMENTO (ITENS) */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-blue-50/30 rounded-2xl p-3 border border-blue-100/30 flex flex-col items-center text-center">
                                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">SORTIMENTO BW</span>
                                    <span className="text-base font-black text-blue-900 mt-1">{item.objSortBw} <span className="text-[8px] font-bold text-blue-500 uppercase">ITENS</span></span>
                                  </div>
                                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50 flex flex-col items-center text-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SORTIMENTO PC</span>
                                    <span className="text-base font-black text-slate-800 mt-1">{item.objSortPc} <span className="text-[8px] font-bold text-slate-400 uppercase">ITENS</span></span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase">
                          Nenhuma loja ponderada encontrada.
                        </div>
                      )
                    ) : (
                      sellerStoresCob.length > 0 ? (
                        sellerStoresCob.map((item, index) => (
                          <div key={index} className="bg-white rounded-3xl p-5 shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
                            {/* BADGE DE CLASSIFICAÇÃO */}
                            <div className="absolute top-4 right-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                              COB
                            </div>

                            <div className="flex flex-col gap-1 pr-20">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">COD CLIENTE: {item.codCliente}</span>
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">{item.cliente}</h4>
                              <div className="flex items-center gap-3 mt-1 text-slate-400 text-[8px] font-bold uppercase">
                                <span className="flex items-center gap-1"><MapPin size={10} /> {item.cidade}</span>
                                <span>CNPJ: {item.cnpj}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase">
                          Nenhum cliente COB encontrado.
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
              </div>
            )}

            {/* RODAPÉ FEEDBACK */}
            <div className="bg-slate-50 rounded-[2.5rem] p-8 border-2 border-slate-100/50">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <AlertCircle size={20}/>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Informativo Único</h4>
               </div>
               <p className="text-[10px] font-bold text-slate-500 leading-relaxed text-justify">
                  As classificações, sortimentos e metas de volumes exibidos neste painel servem para guiar o trabalho de atendimento. Foco no portfólio para o atingimento das metas propostas pela Unilever.
               </p>
            </div>
          </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#001E62] text-white shadow-2xl z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-base font-black italic uppercase leading-none tracking-tighter">BONIFICAÇÃO UNILEVER</h1>
              <p className="text-[8px] font-bold text-yellow-400 tracking-[0.2em] uppercase mt-1">CRIADO POR YURI LIMA</p>
            </div>
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
              className="px-8 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg bg-green-600 hover:bg-green-700 text-white"
            >
              {copiado ? (
                <CheckCircle2 size={16}/>
              ) : (
                <Share2 size={16}/>
              )}
              {copiado ? "COPIADO!" : "ENVIAR TUDO"}
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL DE SENHA METAS */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#001E62]/80 backdrop-blur-md z-[200] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ 
                scale: 1, 
                y: 0,
                x: passwordError ? [0, -10, 10, -10, 10, 0] : 0
              }}
              transition={{ 
                x: { duration: 0.4, ease: "easeInOut" }
              }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Lock size={40}/>
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">Área Restrita</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Digite a senha de acesso às Metas</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="password"
                    autoFocus
                    placeholder="SENHA"
                    className={`w-full p-5 bg-slate-50 rounded-2xl border-2 text-center font-black tracking-[0.5em] transition-all outline-none ${passwordError ? 'border-red-500' : 'border-slate-100 focus:border-blue-600'}`}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (passwordInput === '@Vendas@2026@007') {
                           setIsMetasUnlocked(true);
                           setShowPasswordModal(false);
                           setActiveTab('metas');
                        } else {
                           setPasswordError(true);
                           setTimeout(() => setPasswordError(false), 500);
                        }
                      }
                    }}
                  />
                  {passwordError && <p className="text-[10px] font-black text-red-500 uppercase mt-2">Senha Incorreta</p>}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordInput("");
                      setPasswordError(false);
                    }}
                    className="py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={() => {
                      if (passwordInput === '@Vendas@2026@007') {
                        setIsMetasUnlocked(true);
                        setShowPasswordModal(false);
                        setActiveTab('metas');
                      } else {
                        setPasswordError(true);
                        setTimeout(() => setPasswordError(false), 500);
                      }
                    }}
                    className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all"
                  >
                    ACESSAR
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
