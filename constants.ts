import { GlobalConfig, ModuleType, InputFieldDef } from './types';

export const DEFAULT_CONFIG: GlobalConfig = {
  cementBagVol: 1.25, // Standard: 1.25 cft per 50kg bag
  dryVolCoeffConcrete: 1.54, // Dry volume factor for Concrete
  dryVolCoeffMortarBrick: 1.33, // Dry volume factor for Mortar
  dryVolCoeffMortarPlaster: 1.33, // Dry volume factor for Plaster
  rodWeights: {
    8: 0.12,  // kg/ft approx (0.395 kg/m) -> 0.12 kg/ft
    10: 0.19, // 0.617 kg/m -> 0.188 kg/ft
    12: 0.27, // 0.888 kg/m -> 0.27 kg/ft
    16: 0.48, // 1.58 kg/m -> 0.48 kg/ft
    20: 0.75, // 2.47 kg/m -> 0.75 kg/ft
    22: 0.90, // 2.98 kg/m -> 0.90 kg/ft
    25: 1.17, // 3.85 kg/m -> 1.17 kg/ft
    32: 2.47  // 6.31 kg/m -> 1.92 kg/ft (approx)
  },
  rates: {
    cement: 550,    // Per Bag
    sand: 45,       // Per cft
    aggregate: 160, // Per cft
    steel: 95       // Per kg
  }
};

export const MODULE_PREFIXES: Record<ModuleType, string> = {
  [ModuleType.PILE]: 'P',
  [ModuleType.FOOTING_BOX]: 'F',
  [ModuleType.FOOTING_TRAPEZOIDAL]: 'TF',
  [ModuleType.COLUMN_RECTANGULAR]: 'C',
  [ModuleType.COLUMN_CIRCULAR]: 'CC',
  [ModuleType.COLUMN_SHORT]: 'SC',
  [ModuleType.BEAM]: 'B',
  [ModuleType.SLAB]: 'S',
  [ModuleType.STAIR]: 'STR',
  [ModuleType.LINTEL]: 'L',
  [ModuleType.SUNSHADE]: 'SS',
  [ModuleType.BRICK_WORK]: 'BW',
  [ModuleType.PLASTER]: 'PL'
};

const CONCRETE_MIX_OPTIONS = [
  '1:1:2 (M25)',
  '1:1.5:3 (M20)',
  '1:2:4 (M15)',
  '1:3:6 (M10)',
  '1:4:8 (M7.5)',
  '1:5:10 (PCC)'
];

const MORTAR_MIX_OPTIONS = [
  '1:3 (Rich - Ceiling/Ext)',
  '1:4 (Standard - Walls)',
  '1:5 (Medium - Partition)',
  '1:6 (Lean - Brickwork)'
];

const ROD_DIA_OPTIONS = ['8', '10', '12', '16', '20', '22', '25', '32'];

export const MODULE_FIELDS: Record<ModuleType, InputFieldDef[]> = {
  [ModuleType.PILE]: [
    { key: 'count', label: 'No. of Piles', unit: 'Nos', defaultValue: 10 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'diameter', label: 'Diameter (D)', unit: 'Inch', defaultValue: 20, highlightKey: 'diameter' },
    { key: 'length', label: 'Length (L)', unit: 'Feet', defaultValue: 60, highlightKey: 'length' },
    { key: 'clear_cover', label: 'Clear Cover', unit: 'Inch', defaultValue: 3 },
    { key: 'spiral_pitch', label: 'Spiral Spacing', unit: 'Inch', defaultValue: 5, highlightKey: 'spacing' },
    { key: 'main_rod_dia', label: 'Main Bar Dia', unit: 'mm', defaultValue: '20', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'main_rod_nos', label: 'Main Bar Nos', unit: 'Nos', defaultValue: 7 },
    { key: 'spiral_dia', label: 'Spiral Dia', unit: 'mm', defaultValue: '10', type: 'select', options: ROD_DIA_OPTIONS },
  ],
  [ModuleType.FOOTING_BOX]: [
    { key: 'count', label: 'Quantity', unit: 'Nos', defaultValue: 1 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'length', label: 'Length (L)', unit: 'Feet', defaultValue: 6, highlightKey: 'length' },
    { key: 'breadth', label: 'Breadth (B)', unit: 'Feet', defaultValue: 6, highlightKey: 'width' },
    { key: 'thickness', label: 'Thickness (H)', unit: 'Inch', defaultValue: 18, highlightKey: 'height' },
    { key: 'clear_cover', label: 'Clear Cover', unit: 'Inch', defaultValue: 3 },
    { key: 'long_rod_dia', label: 'Long Bar Dia', unit: 'mm', defaultValue: '16', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'long_rod_spacing', label: 'Long Spacing', unit: 'Inch', defaultValue: 5 },
    { key: 'short_rod_dia', label: 'Short Bar Dia', unit: 'mm', defaultValue: '16', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'short_rod_spacing', label: 'Short Spacing', unit: 'Inch', defaultValue: 6 },
  ],
  [ModuleType.FOOTING_TRAPEZOIDAL]: [
    { key: 'count', label: 'Quantity', unit: 'Nos', defaultValue: 1 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'length', label: 'Bottom Length (L)', unit: 'Feet', defaultValue: 6, highlightKey: 'length' },
    { key: 'breadth', label: 'Bottom Width (B)', unit: 'Feet', defaultValue: 6, highlightKey: 'width' },
    { key: 'top_length', label: 'Top Length (l)', unit: 'Inch', defaultValue: 18, highlightKey: 'top_length' },
    { key: 'top_breadth', label: 'Top Width (b)', unit: 'Inch', defaultValue: 18, highlightKey: 'top_width' },
    { key: 'rect_height', label: 'Rect. Height (h1)', unit: 'Inch', defaultValue: 12, highlightKey: 'height_rect' },
    { key: 'slope_height', label: 'Slope Height (h2)', unit: 'Inch', defaultValue: 12, highlightKey: 'height_slope' },
    { key: 'rod_dia', label: 'Bar Dia', unit: 'mm', defaultValue: '16', type: 'select', options: ROD_DIA_OPTIONS, fullWidth: true },
    { key: 'rod_spacing', label: 'Bar Spacing', unit: 'Inch', defaultValue: 5 },
    { key: 'clear_cover', label: 'Clear Cover', unit: 'Inch', defaultValue: 3 },
  ],
  [ModuleType.COLUMN_RECTANGULAR]: [
    { key: 'count', label: 'Quantity', unit: 'Nos', defaultValue: 5 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'length', label: 'Size (L)', unit: 'Inch', defaultValue: 12, highlightKey: 'length' },
    { key: 'width', label: 'Size (B)', unit: 'Inch', defaultValue: 15, highlightKey: 'width' },
    { key: 'height', label: 'Clear Height', unit: 'Feet', defaultValue: 10, highlightKey: 'height' }, 
    { key: 'clear_cover', label: 'Clear Cover', unit: 'Inch', defaultValue: 1.5 },
    { key: 'main_rod_dia', label: 'Main Bar Dia', unit: 'mm', defaultValue: '20', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'main_rod_nos', label: 'Main Bar Nos', unit: 'Nos', defaultValue: 6 },
    { key: 'tie_dia', label: 'Tie Bar Dia', unit: 'mm', defaultValue: '10', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'tie_spacing', label: 'Tie Spacing', unit: 'Inch', defaultValue: 6, highlightKey: 'spacing' },
  ],
  [ModuleType.COLUMN_SHORT]: [
    { key: 'count', label: 'Quantity', unit: 'Nos', defaultValue: 5 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'length', label: 'Size (L)', unit: 'Inch', defaultValue: 12, highlightKey: 'length' },
    { key: 'width', label: 'Size (B)', unit: 'Inch', defaultValue: 12, highlightKey: 'width' },
    { key: 'height', label: 'Clear Height', unit: 'Feet', defaultValue: 4, highlightKey: 'height' },
    { key: 'clear_cover', label: 'Clear Cover', unit: 'Inch', defaultValue: 1.5 },
    { key: 'main_rod_dia', label: 'Main Bar Dia', unit: 'mm', defaultValue: '16', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'main_rod_nos', label: 'Main Bar Nos', unit: 'Nos', defaultValue: 4 },
    { key: 'tie_dia', label: 'Tie Bar Dia', unit: 'mm', defaultValue: '10', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'tie_spacing', label: 'Tie Spacing', unit: 'Inch', defaultValue: 6, highlightKey: 'spacing' },
  ],
  [ModuleType.COLUMN_CIRCULAR]: [
    { key: 'count', label: 'Quantity', unit: 'Nos', defaultValue: 5 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'diameter', label: 'Diameter', unit: 'Inch', defaultValue: 18, highlightKey: 'diameter' },
    { key: 'height', label: 'Clear Height', unit: 'Feet', defaultValue: 10, highlightKey: 'height' },
    { key: 'clear_cover', label: 'Clear Cover', unit: 'Inch', defaultValue: 1.5 },
    { key: 'spiral_pitch', label: 'Spiral Pitch', unit: 'Inch', defaultValue: 6, highlightKey: 'spacing' },
    { key: 'main_rod_dia', label: 'Main Bar Dia', unit: 'mm', defaultValue: '20', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'main_rod_nos', label: 'Main Bar Nos', unit: 'Nos', defaultValue: 8 },
    { key: 'spiral_dia', label: 'Spiral Dia', unit: 'mm', defaultValue: '8', type: 'select', options: ROD_DIA_OPTIONS },
  ],
  [ModuleType.BEAM]: [
    { key: 'count', label: 'Quantity', unit: 'Nos', defaultValue: 1 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'width', label: 'Width (B)', unit: 'Inch', defaultValue: 10, highlightKey: 'width' },
    { key: 'depth', label: 'Depth (D)', unit: 'Inch', defaultValue: 18, highlightKey: 'height' },
    { key: 'length', label: 'Total Length', unit: 'Feet', defaultValue: 15, highlightKey: 'length' },
    { key: 'clear_cover', label: 'Clear Cover', unit: 'Inch', defaultValue: 1.5 },
    { key: 'main_rod_dia', label: 'Main Bar Dia', unit: 'mm', defaultValue: '16', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'main_rod_nos', label: 'Main Bar Nos', unit: 'Nos', defaultValue: 4 },
    { key: 'tie_dia', label: 'Stirrup Dia', unit: 'mm', defaultValue: '10', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'stirrup_spacing', label: 'Stirrup Spacing', unit: 'Inch', defaultValue: 6, highlightKey: 'spacing' },
  ],
  [ModuleType.SLAB]: [
     { key: 'area', label: 'Slab Area', unit: 'Sq. Ft', defaultValue: 1200, highlightKey: 'area' },
     { key: 'thickness', label: 'Thickness', unit: 'Inch', defaultValue: 5, highlightKey: 'height' },
     { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:2:4 (M15)', type: 'select', options: CONCRETE_MIX_OPTIONS, fullWidth: true },
     { key: 'rod_dia', label: 'Bar Dia', unit: 'mm', defaultValue: '10', type: 'select', options: ROD_DIA_OPTIONS },
     { key: 'rod_spacing', label: 'Grid Spacing', unit: 'Inch', defaultValue: 6, highlightKey: 'spacing' },
     { key: 'clear_cover', label: 'Clear Cover', unit: 'Inch', defaultValue: 0.75 },
  ],
  [ModuleType.STAIR]: [
    { key: 'steps', label: 'No. of Steps', unit: 'Nos', defaultValue: 10 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'step_length', label: 'Step Width', unit: 'Feet', defaultValue: 4, highlightKey: 'width' },
    { key: 'waist_thickness', label: 'Waist Thick.', unit: 'Inch', defaultValue: 6 },
    { key: 'riser', label: 'Riser (R)', unit: 'Inch', defaultValue: 6, highlightKey: 'height' },
    { key: 'tread', label: 'Tread (T)', unit: 'Inch', defaultValue: 10, highlightKey: 'length' },
    { key: 'landing_area', label: 'Landing Area', unit: 'Sq. Ft', defaultValue: 16, fullWidth: true },
  ],
  [ModuleType.LINTEL]: [
    { key: 'count', label: 'Quantity', unit: 'Nos', defaultValue: 5 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'length', label: 'Length', unit: 'Feet', defaultValue: 5, highlightKey: 'length' },
    { key: 'width', label: 'Width', unit: 'Inch', defaultValue: 10, highlightKey: 'width' },
    { key: 'thickness', label: 'Thickness', unit: 'Inch', defaultValue: 6, highlightKey: 'height' },
    { key: 'main_rod_dia', label: 'Main Bar Dia', unit: 'mm', defaultValue: '10', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'main_rod_nos', label: 'Main Bar Nos', unit: 'Nos', defaultValue: 4 },
    { key: 'stirrup_dia', label: 'Stirrup Dia', unit: 'mm', defaultValue: '8', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'stirrup_spacing', label: 'Stirrup Spacing', unit: 'Inch', defaultValue: 6 },
  ],
  [ModuleType.SUNSHADE]: [
    { key: 'count', label: 'Quantity', unit: 'Nos', defaultValue: 5 },
    { key: 'mix_ratio', label: 'Concrete Mix', defaultValue: '1:1.5:3 (M20)', type: 'select', options: CONCRETE_MIX_OPTIONS },
    { key: 'length', label: 'Length', unit: 'Feet', defaultValue: 5, highlightKey: 'length' },
    { key: 'projection', label: 'Projection', unit: 'Inch', defaultValue: 18, highlightKey: 'width' },
    { key: 'avg_thickness', label: 'Avg Thickness', unit: 'Inch', defaultValue: 3, highlightKey: 'height', fullWidth: true },
    { key: 'main_rod_dia', label: 'Main Bar Dia', unit: 'mm', defaultValue: '10', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'main_rod_spacing', label: 'Main Spacing', unit: 'Inch', defaultValue: 6 },
    { key: 'dist_rod_dia', label: 'Dist. Bar Dia', unit: 'mm', defaultValue: '8', type: 'select', options: ROD_DIA_OPTIONS },
    { key: 'dist_rod_spacing', label: 'Dist. Spacing', unit: 'Inch', defaultValue: 8 },
  ],
  [ModuleType.BRICK_WORK]: [
    { key: 'area', label: 'Wall Area', unit: 'Sq. Ft', defaultValue: 500, highlightKey: 'area' },
    { key: 'thickness', label: 'Wall Thickness', unit: 'Inch (5/10)', defaultValue: 5, highlightKey: 'width' },
    { key: 'mix_ratio', label: 'Mortar Mix', defaultValue: '1:5 (Medium)', type: 'select', options: MORTAR_MIX_OPTIONS, fullWidth: true },
    { key: 'opening_deduction', label: 'Openings (Door/Win)', unit: 'Sq. Ft', defaultValue: 20, fullWidth: true },
  ],
  [ModuleType.PLASTER]: [
     { key: 'area', label: 'Plaster Area', unit: 'Sq. Ft', defaultValue: 1000, highlightKey: 'area' },
     { key: 'thickness', label: 'Thickness', unit: 'mm', defaultValue: 12, highlightKey: 'width' },
     { key: 'mix_ratio', label: 'Mortar Mix', defaultValue: '1:4 (Standard)', type: 'select', options: MORTAR_MIX_OPTIONS, fullWidth: true },
  ]
};