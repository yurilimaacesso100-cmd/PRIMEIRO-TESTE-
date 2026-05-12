import rcaData from './rcas_data.json';

export interface BattleMetric {
  meta: number;
  realizado: number;
  reach: string;
  posTela: number;
  posTotal: number;
}

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

export const RCA_METAS_DATA: RCAMeta[] = rcaData as RCAMeta[];
