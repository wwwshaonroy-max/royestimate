import { DEFAULT_CONFIG } from '../constants';
import { EstimationResult, GlobalConfig, ModuleType, SavedItem } from '../types';

const getConfig = (): GlobalConfig => DEFAULT_CONFIG;

// Parse "1:1.5:3 (M20)" -> { c:1, s:1.5, a:3 }
const parseMixRatio = (ratioStr: string | number): { c: number, s: number, a: number } => {
    if (typeof ratioStr === 'number') return { c: 1, s: ratioStr, a: 0 }; 
    if (!ratioStr) return { c: 1, s: 2, a: 4 };

    // Remove text in brackets e.g. " (M20)"
    const cleanStr = ratioStr.toString().split(' ')[0]; 
    const parts = cleanStr.split(':').map(Number);
    
    return {
       c: parts[0] || 1,
       s: parts[1] || 0,
       a: parts[2] || 0
    };
};

// Helper to get rod weight
const getRodWeight = (mm: number): number => {
  const weights = DEFAULT_CONFIG.rodWeights;
  if (weights[mm]) return weights[mm];
  return (mm * mm) / 533; // Fallback formula
};

export const calculateGrandTotal = (items: SavedItem[]): EstimationResult => {
    const total = {
        cementBags: 0,
        sandCft: 0,
        aggregateCft: 0,
        steelKg: 0,
        totalCost: 0,
        details: [] as string[]
    };

    items.forEach(item => {
        total.cementBags += item.result.cementBags;
        total.sandCft += item.result.sandCft;
        total.aggregateCft += item.result.aggregateCft;
        total.steelKg += item.result.steelKg;
        total.totalCost += item.result.totalCost;
    });

    // Formatting to 2 decimals
    return {
        cementBags: parseFloat(total.cementBags.toFixed(2)),
        sandCft: parseFloat(total.sandCft.toFixed(2)),
        aggregateCft: parseFloat(total.aggregateCft.toFixed(2)),
        steelKg: parseFloat(total.steelKg.toFixed(2)),
        totalCost: parseFloat(total.totalCost.toFixed(2)),
        details: [`Total Items: ${items.length}`]
    };
};

export const calculateEstimation = (type: ModuleType, inputs: Record<string, number | string>): EstimationResult => {
  const config = getConfig();
  const numericInputs: Record<string, number> = {};
  
  // Create numeric-only inputs map for calculations
  Object.keys(inputs).forEach(key => {
      const val = inputs[key];
      if (typeof val === 'number') numericInputs[key] = val;
      // If it looks like a number string "20", parse it
      else if (typeof val === 'string' && !isNaN(parseFloat(val)) && !val.includes(':')) {
          numericInputs[key] = parseFloat(val);
      } else {
          numericInputs[key] = 0; // Default for non-numeric like mix_ratio string
      }
  });

  const { c, s, a } = parseMixRatio(inputs.mix_ratio);
  const ratioSum = c + s + a;

  let cementBags = 0;
  let sandCft = 0;
  let aggregateCft = 0;
  let steelKg = 0;
  let details: string[] = [];
  
  // Helpers
  const getVal = (key: string, def: number = 0) => numericInputs[key] || def;

  switch (type) {
    case ModuleType.PILE: {
      const count = getVal('count', 1);
      const dFeet = getVal('diameter', 20) / 12;
      const hFeet = getVal('length', 60);
      
      const volPerPile = (Math.PI * Math.pow(dFeet, 2) * hFeet) / 4;
      const wetVol = volPerPile * count;
      const dryVol = wetVol * config.dryVolCoeffConcrete; 

      if (ratioSum > 0) {
        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;
      }

      const mainRodW = getRodWeight(getVal('main_rod_dia'));
      const mainSteel = (getVal('main_rod_nos') * hFeet * mainRodW) * count;
      
      const spiralPitchFt = getVal('spiral_pitch', 6) / 12;
      const rings = Math.ceil(hFeet / spiralPitchFt);
      const spiralDiaFt = dFeet - (2 * getVal('clear_cover', 3) / 12);
      const spiralLen = rings * (Math.PI * spiralDiaFt); 
      const spiralW = getRodWeight(getVal('spiral_dia'));
      const spiralSteel = (spiralLen * spiralW) * count;

      steelKg = mainSteel + spiralSteel;
      details.push(`Wet Vol: ${wetVol.toFixed(2)} cft`);
      details.push(`Dry Vol: ${dryVol.toFixed(2)} cft`);
      break;
    }

    case ModuleType.FOOTING_BOX: {
        const count = getVal('count', 1);
        const l = getVal('length');
        const b = getVal('breadth');
        const h = getVal('thickness') / 12;
        
        const vol = (l * b * h) * count;
        const dryVol = vol * config.dryVolCoeffConcrete;

        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;

        const coverFt = getVal('clear_cover', 3) / 12;
        const lLen = l - (2 * coverFt); 
        const sLen = b - (2 * coverFt);
        
        const lSpacingFt = getVal('long_rod_spacing', 5) / 12;
        const sSpacingFt = getVal('short_rod_spacing', 6) / 12;

        const lNos = Math.floor(sLen / lSpacingFt) + 1;
        const sNos = Math.floor(lLen / sSpacingFt) + 1;

        const lWeight = lNos * lLen * getRodWeight(getVal('long_rod_dia'));
        const sWeight = sNos * sLen * getRodWeight(getVal('short_rod_dia'));
        
        steelKg = (lWeight + sWeight) * count;
        details.push(`Long Bars: ${lNos} nos @ ${getVal('long_rod_spacing')}" c/c`);
        details.push(`Short Bars: ${sNos} nos @ ${getVal('short_rod_spacing')}" c/c`);
        break;
    }

    case ModuleType.FOOTING_TRAPEZOIDAL: {
        const count = getVal('count', 1);
        const L = getVal('length');
        const B = getVal('breadth');
        const l = getVal('top_length') / 12; // inputs in inch for top part usually, but prompt said feet for base. 
        // Based on fields: bottom is feet, top is inch
        const bTop = getVal('top_breadth') / 12;
        
        const h1 = getVal('rect_height') / 12;
        const h2 = getVal('slope_height') / 12;
        
        // Volume of Rectangular Part
        const v1 = L * B * h1;
        
        // Volume of Trapezoidal Part (Prismoidal Formula)
        const A1 = L * B;
        const A2 = l * bTop;
        const v2 = (h2 / 3) * (A1 + A2 + Math.sqrt(A1 * A2));
        
        const vol = (v1 + v2) * count;
        const dryVol = vol * config.dryVolCoeffConcrete;

        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;
        
        // Steel (Approx Grid for bottom mesh only, detailed slope steel is complex)
        // Assume standard bottom mesh
        const coverFt = getVal('clear_cover', 3) / 12;
        const effL = L - (2*coverFt);
        const effB = B - (2*coverFt);
        const spacingFt = getVal('rod_spacing', 5) / 12;
        
        const nosAlongL = Math.floor(effB / spacingFt) + 1;
        const nosAlongB = Math.floor(effL / spacingFt) + 1;
        
        const wPerFt = getRodWeight(getVal('rod_dia'));
        const steelOneFooting = (nosAlongL * effL * wPerFt) + (nosAlongB * effB * wPerFt);
        
        steelKg = steelOneFooting * count;
        details.push(`Rect Vol: ${v1.toFixed(2)} cft`);
        details.push(`Slope Vol: ${v2.toFixed(2)} cft`);
        break;
    }

    case ModuleType.COLUMN_RECTANGULAR: 
    case ModuleType.COLUMN_SHORT: {
        const count = getVal('count', 1);
        const lIn = getVal('length');
        const wIn = getVal('width');
        const hFt = getVal('height');
        
        const colArea = (lIn * wIn) / 144; 
        const wetVol = colArea * hFt * count;
        const dryVol = wetVol * config.dryVolCoeffConcrete;

        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;

        // Main Bars
        const mainSteel = getVal('main_rod_nos') * hFt * getRodWeight(getVal('main_rod_dia')) * count;
        
        // Ties
        const coverIn = getVal('clear_cover', 1.5);
        const perimeterFt = ((lIn + wIn) * 2 - (8 * coverIn)) / 12; 
        const spacingFt = getVal('tie_spacing', 6) / 12;
        const numTies = Math.ceil(hFt / spacingFt) + 1;
        
        const tieSteel = numTies * perimeterFt * getRodWeight(getVal('tie_dia')) * count;

        steelKg = mainSteel + tieSteel;
        details.push(`Wet Vol: ${wetVol.toFixed(2)} cft`);
        break;
    }

    case ModuleType.COLUMN_CIRCULAR: {
        const count = getVal('count', 1);
        const dIn = getVal('diameter');
        const hFt = getVal('height');
        
        const dFt = dIn / 12;
        const area = (Math.PI * dFt * dFt) / 4;
        const wetVol = area * hFt * count;
        const dryVol = wetVol * config.dryVolCoeffConcrete;

        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;

        // Main Bars
        const mainSteel = getVal('main_rod_nos') * hFt * getRodWeight(getVal('main_rod_dia')) * count;
        
        // Spiral Ties
        const pitchFt = getVal('spiral_pitch', 6) / 12;
        const coverFt = getVal('clear_cover', 1.5) / 12;
        const coreDia = dFt - (2 * coverFt);
        
        const turns = hFt / pitchFt;
        const circumference = Math.PI * coreDia;
        // Exact spiral length formula per turn: sqrt( (pi*D)^2 + p^2 )
        const lenPerTurn = Math.sqrt(Math.pow(circumference, 2) + Math.pow(pitchFt, 2));
        const totalSpiralLen = turns * lenPerTurn;
        
        const spiralSteel = totalSpiralLen * getRodWeight(getVal('spiral_dia')) * count;
        
        steelKg = mainSteel + spiralSteel;
        details.push(`Vol: ${wetVol.toFixed(2)} cft`);
        details.push(`Spiral Len: ${totalSpiralLen.toFixed(1)} ft`);
        break;
    }

    case ModuleType.BEAM: {
        const count = getVal('count', 1);
        const wIn = getVal('width');
        const dIn = getVal('depth');
        const lFt = getVal('length');

        const vol = (lFt * (wIn/12) * (dIn/12)) * count;
        const dryVol = vol * config.dryVolCoeffConcrete;

        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;

        const mainSteel = getVal('main_rod_nos') * lFt * getRodWeight(getVal('main_rod_dia')) * count;
        
        // Stirrups
        const coverIn = getVal('clear_cover', 1.5);
        // Perimeter of ring = 2*(w+d) - deductions
        const ringLenIn = 2 * ((wIn - 2*coverIn) + (dIn - 2*coverIn)) + 4; // +4 inch hook
        const ringLenFt = ringLenIn / 12;
        
        const spacingFt = getVal('stirrup_spacing', 6) / 12;
        const numStirrups = Math.ceil(lFt / spacingFt) + 1;
        
        const stirrupSteel = numStirrups * ringLenFt * getRodWeight(getVal('tie_dia')) * count;
        
        steelKg = mainSteel + stirrupSteel;
        break;
    }

    case ModuleType.STAIR: {
        const steps = getVal('steps');
        const width = getVal('step_length');
        const riser = getVal('riser');
        const tread = getVal('tread');
        const waist = getVal('waist_thickness');

        const oneStepVol = 0.5 * (riser/12) * (tread/12) * width;
        const stepsVol = oneStepVol * steps;

        const stepHyp = Math.sqrt(Math.pow(riser/12, 2) + Math.pow(tread/12, 2));
        const waistLen = stepHyp * steps;
        const waistVol = waistLen * width * (waist/12);
        
        const landingVol = getVal('landing_area') * (waist/12);

        const totalWetVol = stepsVol + waistVol + landingVol;
        const dryVol = totalWetVol * config.dryVolCoeffConcrete;

        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;

        // Approx Steel (1.2% of volume) - kept as approx since no inputs were added for Stair in prompt context
        steelKg = totalWetVol * 0.012 * 222; 
        details.push(`Wet Vol: ${totalWetVol.toFixed(2)} cft`);
        break;
    }

    case ModuleType.LINTEL: {
        const count = getVal('count', 1);
        const lFt = getVal('length');
        const wIn = getVal('width');
        const tIn = getVal('thickness');
        
        const vol = (lFt * (wIn/12) * (tIn/12)) * count;
        const dryVol = vol * config.dryVolCoeffConcrete;

        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;

        // Steel Calculation
        const mainRodDia = getVal('main_rod_dia', 10);
        const mainRodNos = getVal('main_rod_nos', 4);
        const mainSteel = mainRodNos * lFt * getRodWeight(mainRodDia);

        const stirrupDia = getVal('stirrup_dia', 8);
        const stirrupSpacingFt = getVal('stirrup_spacing', 6) / 12;
        
        // Perimeter approx
        const perimIn = 2 * (wIn + tIn);
        const perimFt = perimIn / 12;
        const numStirrups = Math.ceil(lFt / stirrupSpacingFt);
        const stirrupSteel = numStirrups * perimFt * getRodWeight(stirrupDia);

        steelKg = (mainSteel + stirrupSteel) * count;
        break;
    }

    case ModuleType.SUNSHADE: {
        const count = getVal('count', 1);
        const lFt = getVal('length');
        const projIn = getVal('projection');
        const tIn = getVal('avg_thickness');
        
        const projFt = projIn / 12;
        const tFt = tIn / 12;
        
        const vol = (lFt * projFt * tFt) * count;
        const dryVol = vol * config.dryVolCoeffConcrete;

        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;

        // Steel Calculation
        // Main Bars (Cantilever direction - Projection)
        const mainRodDia = getVal('main_rod_dia', 10);
        const mainSpacingFt = getVal('main_rod_spacing', 6) / 12;
        const numMainBars = Math.ceil(lFt / mainSpacingFt);
        const lenMainBar = projFt + 0.5; // + anchorage
        const mainSteel = numMainBars * lenMainBar * getRodWeight(mainRodDia);

        // Distribution Bars (Longitudinal direction - Length)
        const distRodDia = getVal('dist_rod_dia', 8);
        const distSpacingFt = getVal('dist_rod_spacing', 8) / 12;
        const numDistBars = Math.ceil(projFt / distSpacingFt);
        const lenDistBar = lFt;
        const distSteel = numDistBars * lenDistBar * getRodWeight(distRodDia);

        steelKg = (mainSteel + distSteel) * count;
        break;
    }

    case ModuleType.BRICK_WORK: {
        const actualArea = getVal('area') - getVal('opening_deduction');
        const thickFt = getVal('thickness') / 12;
        const wallVol = actualArea * thickFt;
        
        const wetMortarVol = wallVol * 0.30;
        const dryMortarVol = wetMortarVol * config.dryVolCoeffMortarBrick;

        cementBags = ((dryMortarVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryMortarVol * s) / ratioSum;
        
        const brickVolCft = (9.5 * 4.5 * 2.75) / 1728; 
        const brickMassVol = wallVol - wetMortarVol;
        const brickCount = brickMassVol / brickVolCft;

        details.push(`Wall Vol: ${wallVol.toFixed(1)} cft`);
        details.push(`Est. Bricks: ${Math.ceil(brickCount)} Nos`);
        break;
    }

    case ModuleType.SLAB: {
        const wetVol = getVal('area') * (getVal('thickness') / 12);
        const dryVol = wetVol * config.dryVolCoeffConcrete;

        cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
        sandCft = (dryVol * s) / ratioSum;
        aggregateCft = (dryVol * a) / ratioSum;

        const side = Math.sqrt(getVal('area'));
        const spacingFt = getVal('rod_spacing', 6) / 12;
        const barsPerSide = Math.floor(side / spacingFt) + 1;
        const totalLen = barsPerSide * side * 2; 
        
        steelKg = totalLen * 1.1 * getRodWeight(getVal('rod_dia'));
        details.push(`Wet Vol: ${wetVol.toFixed(2)} cft`);
        details.push(`Dry Vol: ${dryVol.toFixed(2)} cft`);
        break;
    }

    case ModuleType.PLASTER: {
         const wetVol = getVal('area') * (getVal('thickness') / 304.8); // mm to ft
         const dryVol = wetVol * config.dryVolCoeffMortarPlaster; // 1.33 coeff
         
         cementBags = ((dryVol * c) / ratioSum) / config.cementBagVol;
         sandCft = (dryVol * s) / ratioSum;
         break;
    }
  }

  const totalCost = 
    (Math.ceil(cementBags) * config.rates.cement) +
    (Math.ceil(sandCft) * config.rates.sand) +
    (Math.ceil(aggregateCft) * config.rates.aggregate) +
    (Math.ceil(steelKg) * config.rates.steel);

  return {
    cementBags: parseFloat(cementBags.toFixed(2)),
    sandCft: parseFloat(sandCft.toFixed(2)),
    aggregateCft: parseFloat(aggregateCft.toFixed(2)),
    steelKg: parseFloat(steelKg.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
    details
  };
};