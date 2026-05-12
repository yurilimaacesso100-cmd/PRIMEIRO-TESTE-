export interface RCAMeta {
  id: string;
  name: string;
  region?: string;
  team: 'HF' | 'BPC';
  volume: number | null;
  metaVolume: number;
  positivacao: number;
  pdvsTotal: number;
  battles: {
    amidos?: BattleMetric;
    cif?: BattleMetric;
    mayo?: BattleMetric;
    poLiq?: BattleMetric;
    dove?: BattleMetric;
    oral?: BattleMetric;
    rexona?: BattleMetric;
    sabLiq?: BattleMetric;
  };
}

export interface BattleMetric {
  meta: number;
  realizado: number;
  reach: string;
  posTela: number;
  posTotal: number;
}

export const RCA_METAS_DATA: RCAMeta[] = [
  {
    id: "33708",
    name: "ANA RITA",
    team: "HF",
    volume: 16103.45,
    metaVolume: 60000,
    positivacao: 23,
    pdvsTotal: 39,
    battles: {
      amidos: { meta: 20, realizado: 5, reach: "25,00%", posTela: 3, posTotal: 8 },
      cif: { meta: 20, realizado: 3, reach: "15,00%", posTela: 0, posTotal: 3 },
      mayo: { meta: 21, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 },
      poLiq: { meta: 26, realizado: 5, reach: "19,23%", posTela: 2, posTotal: 7 }
    }
  },
  {
    id: "20906",
    name: "JAIRO REIS",
    team: "HF",
    volume: 63590.19,
    metaVolume: 75000,
    positivacao: 20,
    pdvsTotal: 38,
    battles: {
      amidos: { meta: 19, realizado: 7, reach: "36,84%", posTela: 1, posTotal: 8 },
      cif: { meta: 22, realizado: 2, reach: "9,09%", posTela: 0, posTotal: 2 },
      mayo: { meta: 18, realizado: 7, reach: "38,89%", posTela: 0, posTotal: 7 },
      poLiq: { meta: 25, realizado: 8, reach: "32,00%", posTela: 3, posTotal: 11 }
    }
  },
  {
    id: "17233",
    name: "ANTONIO ALVES",
    team: "HF",
    volume: 43786.36,
    metaVolume: 170000,
    positivacao: 33,
    pdvsTotal: 65,
    battles: {
      amidos: { meta: 25, realizado: 2, reach: "8,00%", posTela: 1, posTotal: 3 },
      cif: { meta: 30, realizado: 0, reach: "0,00%", posTela: 1, posTotal: 1 },
      mayo: { meta: 23, realizado: 0, reach: "0,00%", posTela: 1, posTotal: 1 },
      poLiq: { meta: 34, realizado: 8, reach: "23,53%", posTela: 8, posTotal: 16 }
    }
  },
  {
    id: "17350",
    name: "AUZILANE DA COSTA",
    team: "BPC",
    volume: 67482.07,
    metaVolume: 180000,
    positivacao: 37,
    pdvsTotal: 75,
    battles: {
      dove: { meta: 45, realizado: 4, reach: "8,89%", posTela: 3, posTotal: 7 },
      oral: { meta: 0, realizado: 3, reach: "10,53%", posTela: 8, posTotal: 11 },
      rexona: { meta: 0, realizado: 9, reach: "20,69%", posTela: 7, posTotal: 16 },
      sabLiq: { meta: 0, realizado: 3, reach: "8,51%", posTela: 10, posTotal: 13 }
    }
  },
  {
    id: "17215",
    name: "EUDES L DA SILVA",
    team: "BPC",
    volume: 22071.84,
    metaVolume: 100000,
    positivacao: 22,
    pdvsTotal: 45,
    battles: {
      dove: { meta: 30, realizado: 6, reach: "20,00%", posTela: 1, posTotal: 7 },
      oral: { meta: 18, realizado: 1, reach: "5,56%", posTela: 0, posTotal: 1 },
      rexona: { meta: 29, realizado: 3, reach: "10,34%", posTela: 2, posTotal: 5 },
      sabLiq: { meta: 23, realizado: 4, reach: "17,39%", posTela: 1, posTotal: 5 }
    }
  },
  {
    id: "20000",
    name: "ALESSANDRA PEREIRA",
    team: "BPC",
    volume: 24512.47,
    metaVolume: 102000,
    positivacao: 20,
    pdvsTotal: 45,
    battles: {
      dove: { meta: 27, realizado: 4, reach: "14,81%", posTela: 4, posTotal: 8 },
      oral: { meta: 0, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 },
      rexona: { meta: 0, realizado: 6, reach: "22,99%", posTela: 5, posTotal: 11 },
      sabLiq: { meta: 0, realizado: 3, reach: "14,18%", posTela: 4, posTotal: 6 }
    }
  },
  {
    id: "12069",
    name: "ROSIANE ALVES",
    team: "BPC",
    volume: 84035.65,
    metaVolume: 180000,
    positivacao: 27,
    pdvsTotal: 65,
    battles: {
      dove: { meta: 34, realizado: 2, reach: "5,88%", posTela: 0, posTotal: 2 },
      oral: { meta: 20, realizado: 2, reach: "10,00%", posTela: 0, posTotal: 2 },
      rexona: { meta: 30, realizado: 4, reach: "13,33%", posTela: 0, posTotal: 4 },
      sabLiq: { meta: 26, realizado: 1, reach: "3,85%", posTela: 1, posTotal: 2 }
    }
  },
  {
    id: "10718",
    name: "DELMA FERNANDA",
    team: "BPC",
    volume: 20449.73,
    metaVolume: 170000,
    positivacao: 18,
    pdvsTotal: 45,
    battles: {
      dove: { meta: 32, realizado: 1, reach: "3,13%", posTela: 2, posTotal: 3 },
      oral: { meta: 18, realizado: 2, reach: "11,11%", posTela: 1, posTotal: 3 },
      rexona: { meta: 29, realizado: 10, reach: "34,48%", posTela: 1, posTotal: 11 },
      sabLiq: { meta: 22, realizado: 3, reach: "13,64%", posTela: 1, posTotal: 4 }
    }
  },
  {
    id: "24319",
    name: "LAYDE DAYANNE",
    team: "BPC",
    volume: 141193.21,
    metaVolume: 189000,
    positivacao: 29,
    pdvsTotal: 80,
    battles: {
      dove: { meta: 58, realizado: 3, reach: "5,17%", posTela: 1, posTotal: 4 },
      oral: { meta: 32, realizado: 0, reach: "0,00%", posTela: 0, posTotal: 0 },
      rexona: { meta: 0, realizado: 7, reach: "15,09%", posTela: 1, posTotal: 8 },
      sabLiq: { meta: 0, realizado: 3, reach: "7,98%", posTela: 1, posTotal: 4 }
    }
  },
  {
    id: "22320",
    name: "FRANCI GRACA",
    team: "BPC",
    volume: 14524.7,
    metaVolume: 125000,
    positivacao: 23,
    pdvsTotal: 65,
    battles: {
      dove: { meta: 0, realizado: 2, reach: "4,66%", posTela: 2, posTotal: 4 },
      oral: { meta: 26, realizado: 2, reach: "7,69%", posTela: 2, posTotal: 4 },
      rexona: { meta: 39, realizado: 4, reach: "10,26%", posTela: 2, posTotal: 6 },
      sabLiq: { meta: 0, realizado: 1, reach: "3,08%", posTela: 1, posTotal: 2 }
    }
  }
];
