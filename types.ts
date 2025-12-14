export enum ModuleType {
  PILE = 'PILE',
  FOOTING_BOX = 'FOOTING_BOX',
  FOOTING_TRAPEZOIDAL = 'FOOTING_TRAPEZOIDAL',
  COLUMN_RECTANGULAR = 'COLUMN_RECTANGULAR',
  COLUMN_CIRCULAR = 'COLUMN_CIRCULAR',
  COLUMN_SHORT = 'COLUMN_SHORT',
  BEAM = 'BEAM',
  SLAB = 'SLAB',
  STAIR = 'STAIR',
  LINTEL = 'LINTEL',
  SUNSHADE = 'SUNSHADE',
  BRICK_WORK = 'BRICK_WORK',
  PLASTER = 'PLASTER'
}

export interface SavedItem {
  id: string;
  name: string;
  moduleType: ModuleType;
  inputs: Record<string, number | string>;
  result: EstimationResult;
  timestamp: Date;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  address?: string;
  version: string;
  lastModified: Date;
  // Working state for each module (unsaved work)
  data: Record<string, ModuleData>;
  // Persisted list of estimated items
  items: SavedItem[];
}

export interface ModuleData {
  inputs: Record<string, number | string>;
  results: EstimationResult | null;
}

export interface EstimationResult {
  cementBags: number;
  sandCft: number;
  aggregateCft: number;
  steelKg: number;
  totalCost: number;
  details: string[];
}

export interface GlobalConfig {
  cementBagVol: number;
  dryVolCoeffConcrete: number;
  dryVolCoeffMortarBrick: number;
  dryVolCoeffMortarPlaster: number;
  rodWeights: Record<number, number>;
  rates: {
    cement: number;
    sand: number;
    aggregate: number;
    steel: number;
  };
}

export interface InputFieldDef {
  key: string;
  label: string;
  unit?: string;
  defaultValue: number | string;
  highlightKey?: string;
  type?: 'number' | 'select';
  options?: string[];
  fullWidth?: boolean;
}