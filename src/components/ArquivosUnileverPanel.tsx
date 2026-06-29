import React, { useState } from 'react';
import { Search, Download, BookOpen, FileDown, Sparkles, Shield, Award, Info, Layers, CheckCircle2, ChevronRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";

interface CatalogItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  colorClass: string;
  bgGradient: string;
  iconBg: string;
  sections: {
    category: string;
    brands: {
      name: string;
      pages: string;
      highlights: string[];
    }[];
  }[];
}

const CATALOGS_DATA: CatalogItem[] = [
  {
    id: 'hn',
    title: 'Home Care & Nutrition (HN)',
    subtitle: 'Alimentos, Cuidados com a Casa e Lavanderia',
    description: 'Catálogo oficial do Esquadrão Unilever para as marcas de Alimentos, Nutrição, Sabão em Pó, Amaciantes e Limpadores de alta performance.',
    badge: 'LAVANDERIA & ALIMENTOS',
    colorClass: 'text-blue-600 border-blue-100 bg-blue-50',
    bgGradient: 'from-blue-600 to-indigo-700',
    iconBg: 'bg-blue-100 text-blue-600',
    sections: [
      {
        category: 'NUTRITION (ALIMENTOS & NUTRIÇÃO)',
        brands: [
          { name: 'Maizena', pages: 'Pág. 01', highlights: ['Amidos Tradicionais', 'Cremo Gema Sabores', 'Arrozina Tradicional'] },
          { name: 'Knorr', pages: 'Pág. 02 - 03', highlights: ['Caldos em Cubos', 'Temperos e Arroz', 'Vegetais em Lata', 'Molhos de Pimenta', 'Sopão de Galinha'] },
          { name: 'Arisco', pages: 'Pág. 04 - 05', highlights: ['Caldos Econômicos', 'Temperos Alho e Sal', 'Mostarda Amarela', 'Maionese e Ketchup'] },
          { name: 'Hellmann\'s', pages: 'Pág. 06 - 07', highlights: ['Maionese Regular, Light e Suprema', 'Ketchup Tradicional e Picante', 'Mostarda e Molhos Especiais'] },
          { name: 'Mãe Terra', pages: 'Pág. 08 - 09', highlights: ['Biscoitos Orgânicos', 'Cookies Integrais', 'Salgadinhos Zooreta', 'Granolas Tradicionais e Castanhas'] }
        ]
      },
      {
        category: 'HOME CARE (CUIDADOS COM A CASA)',
        brands: [
          { name: 'Comfort', pages: 'Pág. 11 - 13', highlights: ['Amaciantes Concentrados 500ml e 1.5L', 'Amaciantes Tradicionais', 'Comfort Segredos Perfumados', 'Passa Roupas e Neutralizadores'] },
          { name: 'Omo', pages: 'Pág. 14 - 17', highlights: ['Sabão em Pó Lavagem Perfeita', 'Lava Roupas Líquido Finesse', 'Omo Cores e Omo Sanitiza', 'Omo Clinical e Desinfetantes'] },
          { name: 'Brilhante', pages: 'Pág. 18 - 19', highlights: ['Sabão em Pó Blindagem das Cores', 'Lava Roupas Líquido Higiene Total', 'Tira Manchas Brilhante'] },
          { name: 'Ala', pages: 'Pág. 20 - 21', highlights: ['Sabão em Pó Flor de Lis e Rosas', 'Lava Roupas Líquido Multi Benefícios', 'Sabão de Coco Ala'] },
          { name: 'Cif', pages: 'Pág. 22 - 23, 27 - 28', highlights: ['Limpadores Cremosos Multiuso', 'Cif Banheiro e Cif Cozinha', 'Derrete Gordura Cif', 'Secante e Detergente Lava Louças'] },
          { name: 'Vim', pages: 'Pág. 24, 29', highlights: ['Cloro Gel Vim', 'Limpadores Sanitários Vim'] },
          { name: 'Fofo', pages: 'Pág. 24, 29', highlights: ['Amaciantes Fofo Concentrado e Regular'] }
        ]
      }
    ]
  },
  {
    id: 'pb',
    title: 'Personal Care (PB)',
    subtitle: 'Higiene Pessoal, Cosméticos e Beleza',
    description: 'Catálogo completo de Cuidados Pessoais do Esquadrão Unilever, englobando desodorantes, shampoos, cremes de tratamento e sabonetes de beleza.',
    badge: 'HIGIENE & BELEZA',
    colorClass: 'text-purple-600 border-purple-100 bg-purple-50',
    bgGradient: 'from-purple-600 to-pink-700',
    iconBg: 'bg-purple-100 text-purple-600',
    sections: [
      {
        category: 'PERSONAL CARE (CUIDADOS PESSOAIS & CABELOS)',
        brands: [
          { name: 'Rexona', pages: 'Pág. 01 - 05', highlights: ['Desodorantes Aerosol 72h', 'Desodorantes Roll-on', 'Sabonete Líquido Antibacteriano', 'Sabonetes em Barra', 'Talcos e Desodorantes para Pés'] },
          { name: 'Dove', pages: 'Pág. 06 - 13', highlights: ['Desodorantes Aerosol Clinical e Men', 'Shampoos Reconstrução e Nutrição', 'Kits Promocionais Reconstrutores', 'Sabonete em Barra e Sabonete Líquido', 'Loções Hidratantes e Cremes de Tratamento', 'Produtos Baby Dove Completo'] },
          { name: 'Suave', pages: 'Pág. 14 - 15', highlights: ['Desodorantes Aerosol Erva Doce', 'Desodorante Roll-on', 'Shampoos e Condicionadores Nutrição'] },
          { name: 'Axe', pages: 'Pág. 16', highlights: ['Desodorantes Aerosol Masculinos Axe 48h Proteção'] },
          { name: 'Clear', pages: 'Pág. 17 - 18', highlights: ['Shampoos Anticaspa Clear Men', 'Condicionador Clear Hidratação'] },
          { name: 'Seda', pages: 'Pág. 19 - 24', highlights: ['Shampoos Seda Ceramidas e Mel', 'Condicionador Seda', 'Produtos Infantis Seda Kids', 'Cremes para Pentear e Máscaras de Tratamento'] },
          { name: 'Tresemmé', pages: 'Pág. 25 - 27', highlights: ['Shampoo Reconstrução e Brilho', 'Condicionadores e Cremes para Pentear', 'Máscaras de Tratamento Profissional'] },
          { name: 'Love Beauty and Planet', pages: 'Pág. 28', highlights: ['Condicionadores Veganos', 'Cremes para Pentear e Hidratação'] },
          { name: 'Lux', pages: 'Pág. 29 - 30', highlights: ['Sabonetes em Barra Botanicals', 'Sabonetes Líquidos Buquê de Jasmim e Rosas'] },
          { name: 'Closeup', pages: 'Pág. 31 - 32', highlights: ['Cremes Dentais Closeup Tripla Proteção', 'Enxaguante Bucal Closeup Fresh'] }
        ]
      }
    ]
  }
];

export const ArquivosUnileverPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Search function matching brand names, sections, categories or highlights
  const filteredCatalogs = CATALOGS_DATA.map(catalog => {
    const matchedSections = catalog.sections.map(section => {
      const filteredBrands = section.brands.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.highlights.some(h => h.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      return { ...section, brands: filteredBrands };
    }).filter(section => section.brands.length > 0);

    return { ...catalog, sections: matchedSections };
  }).filter(catalog => catalog.sections.length > 0);

  // Generates a beautiful standalone HTML file with CSS and interactive searching that works fully offline
  const handleDownload = (catalog: CatalogItem) => {
    const fileName = `Catalogo_Unilever_${catalog.id === 'hn' ? 'HomeCare_Nutrition' : 'PersonalCare'}.html`;
    
    // Construct inline HTML template
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo Unilever - ${catalog.title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }
        header {
            background: linear-gradient(135deg, ${catalog.id === 'hn' ? '#001E62, #1e3a8a' : '#581c87, #701a75'});
            color: white;
            padding: 3rem 1.5rem;
            text-align: center;
            border-bottom: 5px solid #fbbf24;
        }
        .header-tag {
            background-color: rgba(255, 255, 255, 0.2);
            color: #fbbf24;
            padding: 0.35rem 1rem;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            display: inline-block;
            margin-bottom: 1rem;
        }
        h1 {
            margin: 0;
            font-size: 2.25rem;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        .subtitle {
            margin-top: 0.5rem;
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .container {
            max-width: 900px;
            margin: -2rem auto 4rem auto;
            padding: 0 1rem;
        }
        .search-box {
            background: white;
            padding: 1.25rem;
            border-radius: 1.5rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            display: flex;
            gap: 0.75rem;
            margin-bottom: 2rem;
            border: 1px solid #e2e8f0;
        }
        .search-box input {
            flex: 1;
            padding: 0.75rem 1rem;
            border: 2px solid #f1f5f9;
            border-radius: 1rem;
            outline: none;
            font-size: 0.95rem;
            font-weight: bold;
            transition: all 0.2s;
        }
        .search-box input:focus {
            border-color: ${catalog.id === 'hn' ? '#001E62' : '#581c87'};
        }
        .category-block {
            background: white;
            border-radius: 2rem;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            border: 1px solid #f1f5f9;
        }
        .category-title {
            font-size: 0.9rem;
            color: ${catalog.id === 'hn' ? '#001E62' : '#581c87'};
            font-weight: 900;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 0.75rem;
            margin-top: 0;
            margin-bottom: 1.5rem;
        }
        .brand-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.25rem;
        }
        @media(min-width: 640px) {
            .brand-grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        .brand-card {
            background: #fafafa;
            border: 1px solid #f1f5f9;
            border-radius: 1.5rem;
            padding: 1.25rem;
            display: flex;
            flex-col;
            justify-content: space-between;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .brand-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.05);
            background: white;
        }
        .brand-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 0.75rem;
        }
        .brand-name {
            font-size: 1.15rem;
            font-weight: 800;
            color: #1e293b;
            margin: 0;
        }
        .brand-page {
            font-size: 0.75rem;
            background-color: #fef08a;
            color: #854d0e;
            font-weight: 800;
            padding: 0.25rem 0.65rem;
            border-radius: 8px;
            white-space: nowrap;
        }
        .highlight-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
        }
        .tag {
            font-size: 0.72rem;
            background-color: #f1f5f9;
            color: #475569;
            font-weight: bold;
            padding: 0.2rem 0.5rem;
            border-radius: 6px;
        }
        .footer-note {
            text-align: center;
            color: #64748b;
            font-size: 0.8rem;
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <header>
        <span class="header-tag">Esquadrão Unilever</span>
        <h1>Catálogo de Produtos</h1>
        <p class="subtitle">${catalog.title} - Armazém Mateus</p>
    </header>

    <div class="container">
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Buscar marca ou produto..." oninput="filterBrands()">
        </div>

        <div id="catalogContent">
            ${catalog.sections.map(sec => `
                <div class="category-block" data-section="${sec.category.toLowerCase()}">
                    <h2 class="category-title">${sec.category}</h2>
                    <div class="brand-grid">
                        ${sec.brands.map(brand => `
                            <div class="brand-card" data-brand="${brand.name.toLowerCase()}" data-highlights="${brand.highlights.join(' ').toLowerCase()}">
                                <div>
                                    <div class="brand-header">
                                        <h3 class="brand-name">${brand.name}</h3>
                                        <span class="brand-page">${brand.pages}</span>
                                    </div>
                                    <div class="highlight-tags">
                                        ${brand.highlights.map(h => `<span class="tag">${h}</span>`).join('')}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        <p class="footer-note">Este documento é um guia oficial de referência rápida para o RCA da Unilever & Armazém Mateus © 2026</p>
    </div>

    <script>
        function filterBrands() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const blocks = document.querySelectorAll('.category-block');
            
            blocks.forEach(block => {
                const cards = block.querySelectorAll('.brand-card');
                let blockHasMatch = false;

                cards.forEach(card => {
                    const name = card.getAttribute('data-brand');
                    const highlights = card.getAttribute('data-highlights');
                    
                    if (name.includes(query) || highlights.includes(query)) {
                        card.style.display = 'flex';
                        blockHasMatch = true;
                    } else {
                        card.style.display = 'none';
                    }
                });

                if (blockHasMatch) {
                    block.style.display = 'block';
                } else {
                    block.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>
    `;

    // Trigger download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(catalog.id);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* HEADER */}
      <div className="bg-[#001E62] rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/20 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Layers size={24} className="text-yellow-300"/>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Arquivos Unilever</h2>
          </div>
          <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.3em] max-w-[340px] leading-relaxed">
            Consulte os catálogos oficiais e baixe os arquivos de consulta rápida para o seu celular
          </p>
        </div>
      </div>

      {/* BUSCA INTEGRADA */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search size={20} className="text-slate-400 group-focus-within:text-[#001E62] transition-colors" />
        </div>
        <input 
          type="text"
          placeholder="Pesquisar marcas, produtos ou páginas..."
          className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-5 pl-14 pr-6 outline-none focus:border-[#001E62] focus:ring-4 focus:ring-blue-100 shadow-xl shadow-blue-900/5 text-sm font-bold transition-all text-slate-800 placeholder-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTA DE CATÁLOGOS */}
      <div className="space-y-6">
        {filteredCatalogs.map((catalog) => (
          <div 
            key={catalog.id}
            className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-5">
              <div className="space-y-1">
                <span className={`text-[8px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${catalog.colorClass}`}>
                  {catalog.badge}
                </span>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mt-2 flex items-center gap-2">
                  {catalog.title}
                </h3>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider leading-relaxed">
                  {catalog.subtitle}
                </p>
              </div>

              <button
                onClick={() => handleDownload(catalog)}
                className={`px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg self-start md:self-auto ${
                  downloadSuccess === catalog.id 
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
                    : 'bg-[#001E62] hover:bg-blue-800 text-white shadow-blue-900/20'
                }`}
              >
                {downloadSuccess === catalog.id ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Baixado!</span>
                  </>
                ) : (
                  <>
                    <FileDown size={16} />
                    <span>Baixar Catálogo (.HTML)</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              {catalog.description}
            </p>

            {/* SECTIONS & BRANDS INSIDE */}
            <div className="space-y-4">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={12} /> Estrutura do Documento
              </h4>

              <div className="grid grid-cols-1 gap-4">
                {catalog.sections.map((section, sIdx) => (
                  <div key={sIdx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100/60 space-y-3">
                    <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200/50 pb-2">
                      {section.category}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {section.brands.map((brand, bIdx) => (
                        <div key={bIdx} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-start justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-[#001E62] uppercase tracking-tight">
                                {brand.name}
                              </span>
                              <span className="text-[8px] font-black bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                {brand.pages}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {brand.highlights.map((h, hIdx) => (
                                <span key={hIdx} className="text-[7px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1 rounded uppercase">
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-300 shrink-0 self-center" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filteredCatalogs.length === 0 && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Info size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Nenhum resultado encontrado</h3>
              <p className="text-xs font-bold text-slate-400 uppercase">A busca por "{searchTerm}" não retornou marcas ou categorias.</p>
            </div>
          </div>
        )}
      </div>

      {/* BANNER ESQUADRÃO UNILEVER */}
      <div className="bg-gradient-to-tr from-[#001E62] to-blue-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mb-16 blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="text-yellow-400" size={20} />
              <span className="text-[9px] font-black text-yellow-400 uppercase tracking-wider">Compromisso de Sucesso</span>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">Esquadrão Unilever & Armazém Mateus</h3>
            <p className="text-xs text-blue-200 max-w-md leading-relaxed">
              Equipe treinada, focada e portfólio completo. Juntos, expandindo a cobertura física e faturamento no varejo de excelência.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5 self-start md:self-auto text-[9px] font-black uppercase tracking-widest">
            <Shield size={14} className="text-green-400" /> Canal Seguro
          </div>
        </div>
      </div>
    </div>
  );
};
