import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Plus,
  Box,
  Trash2,
  FlaskConical,
  ChevronLeft,
  Zap,
  Coins,
  Hammer,
  Component,
  Scissors
} from 'lucide-react';
import { DEFAULT_CONFIG } from '../constants';

// --- Shared Glass Styles ---
const GLASS_CARD = "bg-[#1c1c1e] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden";
const GLASS_INPUT = "bg-[#2c2c2e] text-white border border-white/5 rounded-xl px-4 py-3 w-full focus:outline-none focus:border-[#007aff] focus:ring-1 focus:ring-[#007aff] transition-all";
const ACTION_BTN = "bg-[#007aff] text-white rounded-xl py-3 px-4 font-semibold shadow-lg shadow-blue-900/20 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2";

// --- Helper: Unit Conversion Factors ---
const CONVERSION = {
  length: { m: 1, cm: 100, mm: 1000, ft: 3.28084, in: 39.3701 },
  area: { sqm: 1, sqft: 10.7639 },
  volume: { cum: 1, cft: 35.3147 },
  mass: { kg: 1, lb: 2.20462, tonne: 0.001 }
};

type UnitType = 'length' | 'area' | 'volume' | 'mass';
export type ToolType = 'menu' | 'converter' | 'volume' | 'steel' | 'mix' | 'construction' | 'bbs';

interface DashboardProps {
  initialTool?: ToolType;
  onBackToHome?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialTool, onBackToHome }) => {
  const [activeView, setActiveView] = useState<ToolType>('menu');

  // Sync with prop if provided
  useEffect(() => {
    if (initialTool && initialTool !== 'menu') {
      setActiveView(initialTool);
    } else {
      setActiveView('menu');
    }
  }, [initialTool]);

  const handleBack = () => {
    if (activeView === 'menu') {
        if (onBackToHome) onBackToHome();
    } else {
        setActiveView('menu');
    }
  };

  // --- Widget 1: Unit Converter State ---
  const [convType, setConvType] = useState<UnitType>('length');
  const [convVal, setConvVal] = useState<number>(1);
  const [unitFrom, setUnitFrom] = useState<string>('m');
  const [unitTo, setUnitTo] = useState<string>('ft');

  const convertedValue = useMemo(() => {
    const factors = CONVERSION[convType] as any;
    if (!factors[unitFrom] || !factors[unitTo]) return 0;
    
    // Let's normalize to Base first. 
    const valInBase = convVal / factors[unitFrom];
    const valInTarget = valInBase * factors[unitTo];
    
    return valInTarget;
  }, [convType, convVal, unitFrom, unitTo]);

  // --- Widget 2: Volume Calc State ---
  const [volItems, setVolItems] = useState<Array<{id: number, desc: string, l: number, w: number, h: number, qty: number, total: number}>>([]);
  const [volInput, setVolInput] = useState({ desc: 'Item 1', l: 10, w: 10, h: 5, qty: 1 });
  
  const addVolItem = () => {
    const total = volInput.l * volInput.w * volInput.h * volInput.qty;
    setVolItems([...volItems, { ...volInput, id: Date.now(), total }]);
    setVolInput({ ...volInput, desc: `Item ${volItems.length + 2}` });
  };
  const removeVolItem = (id: number) => setVolItems(volItems.filter(i => i.id !== id));
  const totalVolume = volItems.reduce((acc, i) => acc + i.total, 0);

  // --- Widget 3: Steel Weight State ---
  const [steelDia, setSteelDia] = useState<number>(10);
  const [steelLen, setSteelLen] = useState<number>(39); 
  const [steelQty, setSteelQty] = useState<number>(1);
  const [steelUnit, setSteelUnit] = useState<'ft' | 'm'>('ft');
  
  const steelWeight = useMemo(() => {
      let unitWeight = 0;
      if (steelUnit === 'ft') {
          unitWeight = (steelDia * steelDia) / 533;
      } else {
          unitWeight = (steelDia * steelDia) / 162.2;
      }
      return unitWeight * steelLen * steelQty;
  }, [steelDia, steelLen, steelQty, steelUnit]);

  const estimatedCost = steelWeight * DEFAULT_CONFIG.rates.steel;

  // --- Widget 4: Construction (Site Calc) State ---
  const [constType, setConstType] = useState<'column' | 'beam' | 'slab'>('column');
  const [constInput, setConstInput] = useState({ l: 10, w: 10, h: 10, qty: 1 });

  const constructionResult = useMemo(() => {
      const { l, w, h, qty } = constInput;
      let shuttering = 0; // Sft
      let casting = 0;    // Cft

      if (constType === 'column') {
          shuttering = (2 * (l + w) / 12) * h * qty;
          casting = ((l * w) / 144) * h * qty;
      } else if (constType === 'beam') {
          shuttering = ((2 * w + l) / 12) * h * qty; 
          casting = ((l * w) / 144) * h * qty;
      } else if (constType === 'slab') {
          shuttering = l * w * qty;
          casting = l * w * (h / 12) * qty;
      }

      return { shuttering, casting };
  }, [constType, constInput]);

  // --- Widget 5: BBS State ---
  const [bbsType, setBbsType] = useState<'stirrup' | 'ring' | 'crank'>('stirrup');
  const [bbsInput, setBbsInput] = useState({ 
      l: 12, // Width or Length
      w: 12, // Depth or Breadth
      d: 10, // Dia in mm
      cover: 1.5, // inches
      span: 12, // ft for crank
      depth: 6, // inch for slab depth
      bearing: 6 // inch for Ld/Bearing
  });

  const bbsResult = useMemo(() => {
      let cuttingLenInches = 0;
      let formula = '';
      const { l, w, d, cover, span, depth, bearing } = bbsInput;
      const barDiaInches = d / 25.4; // mm to inches

      if (bbsType === 'stirrup') {
          // Rectangular Stirrup
          const A = l - 2 * cover;
          const B = w - 2 * cover;
          
          if (A <= 0 || B <= 0) return { feet:0, inch:0, totalInch:0, formula: 'Invalid Dims' };

          // Formula: 2(A+B) + Hooks(2x10d) - Bends(3x2d for 90deg + 2x3d for 135deg)
          // Hooks = 20d
          // Bends = 6d + 6d = 12d
          // Net = 2(A+B) + 8d
          const netSteelAdd = 8 * barDiaInches;
          cuttingLenInches = 2 * (A + B) + netSteelAdd;
          formula = '2(A+B) + 8d';
      } else if (bbsType === 'ring') {
          // Circular Ring
          const coreD = l - 2 * cover;
          if (coreD <= 0) return { feet:0, inch:0, totalInch:0, formula: 'Invalid Dims' };
          
          // Formula: Pi*D + 20d (Hooks) - 2*3d (Bends) => Pi*D + 14d
          const netSteelAdd = 14 * barDiaInches;
          cuttingLenInches = (Math.PI * coreD) + netSteelAdd;
          formula = 'π(D-2c) + 14d';
      } else if (bbsType === 'crank') {
          // Crank / Bent-up Bar
          // L = Clear Span (ft to in) + 2*Bearing
          const clearSpanIn = span * 12;
          const bearings = 2 * bearing;
          
          // Crank Height H
          // H = SlabDepth - 2*Cover - BarDia
          const H = depth - (2 * cover) - barDiaInches;
          
          if (H <= 0) return { feet:0, inch:0, totalInch:0, formula: 'Invalid Depth' };

          // Inclined Length Increase = 0.42 * H per crank.
          // Assume Double Crank (both sides).
          const crankAdd = 2 * (0.42 * H);
          
          // Bend Deduction: 4 bends of 45 deg.
          // 1d per 45 deg. Total 4d.
          const bendDed = 4 * (1 * barDiaInches);

          cuttingLenInches = clearSpanIn + bearings + crankAdd - bendDed;
          formula = 'L + 2Ld + 2(0.42H) - 4d';
      }

      const feet = Math.floor(cuttingLenInches / 12);
      const inch = (cuttingLenInches % 12);
      
      return { feet, inch, totalInch: cuttingLenInches, formula };
  }, [bbsType, bbsInput]);


  // --- Views ---

  const MenuView = () => (
      <div className="grid grid-cols-2 gap-4 animate-fade-in pt-4">
          <button onClick={() => setActiveView('construction')} className={`${GLASS_CARD} flex flex-col items-center justify-center gap-3 p-6 hover:bg-[#2c2c2e] hover:border-white/20 active:scale-95 transition-all group`}>
              <div className="bg-blue-500/20 p-4 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                  <Hammer className="w-8 h-8" />
              </div>
              <div className="text-center">
                <span className="font-semibold text-lg text-white block">Site Calc</span>
                <span className="text-[10px] text-gray-500">Shuttering & Casting</span>
              </div>
          </button>
          
          <button onClick={() => setActiveView('bbs')} className={`${GLASS_CARD} flex flex-col items-center justify-center gap-3 p-6 hover:bg-[#2c2c2e] hover:border-white/20 active:scale-95 transition-all group`}>
              <div className="bg-teal-500/20 p-4 rounded-2xl text-teal-500 group-hover:scale-110 transition-transform">
                  <Scissors className="w-8 h-8" />
              </div>
              <div className="text-center">
                <span className="font-semibold text-lg text-white block">Bar Bending</span>
                <span className="text-[10px] text-gray-500">Cutting Length</span>
              </div>
          </button>

          <button onClick={() => setActiveView('converter')} className={`${GLASS_CARD} flex flex-col items-center justify-center gap-3 p-6 hover:bg-[#2c2c2e] hover:border-white/20 active:scale-95 transition-all group`}>
              <div className="bg-orange-500/20 p-4 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform">
                  <ArrowRightLeft className="w-8 h-8" />
              </div>
              <span className="font-semibold text-lg text-white">Converter</span>
          </button>

          <button onClick={() => setActiveView('steel')} className={`${GLASS_CARD} flex flex-col items-center justify-center gap-3 p-6 hover:bg-[#2c2c2e] hover:border-white/20 active:scale-95 transition-all group`}>
              <div className="bg-red-500/20 p-4 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8" />
              </div>
              <span className="font-semibold text-lg text-white">Steel Calc</span>
          </button>

          <button onClick={() => setActiveView('volume')} className={`${GLASS_CARD} flex flex-col items-center justify-center gap-3 p-6 hover:bg-[#2c2c2e] hover:border-white/20 active:scale-95 transition-all group`}>
              <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                  <Box className="w-8 h-8" />
              </div>
              <span className="font-semibold text-lg text-white">Volume</span>
          </button>
      </div>
  );

  const BBSView = () => (
      <div className="space-y-6 animate-fade-in">
          {/* Tabs */}
          <div className="flex bg-[#2c2c2e] p-1 rounded-xl">
              <button onClick={() => { setBbsType('stirrup'); setBbsInput({...bbsInput, l:12, w:12})}} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${bbsType === 'stirrup' ? 'bg-[#007aff] text-white shadow-md' : 'text-gray-400'}`}>Stirrup</button>
              <button onClick={() => { setBbsType('ring'); setBbsInput({...bbsInput, l:18})}} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${bbsType === 'ring' ? 'bg-[#007aff] text-white shadow-md' : 'text-gray-400'}`}>Ring</button>
              <button onClick={() => { setBbsType('crank'); setBbsInput({...bbsInput, span:12, depth:6, bearing: 6})}} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${bbsType === 'crank' ? 'bg-[#007aff] text-white shadow-md' : 'text-gray-400'}`}>Crank</button>
          </div>

          <div className={GLASS_CARD}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                 {bbsType === 'stirrup' && (
                     <>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Width (A) (in)</label>
                            <input type="number" value={bbsInput.l} onChange={(e) => setBbsInput({...bbsInput, l: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Depth (B) (in)</label>
                            <input type="number" value={bbsInput.w} onChange={(e) => setBbsInput({...bbsInput, w: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                     </>
                 )}
                 {bbsType === 'ring' && (
                     <div className="col-span-2">
                        <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Diameter (in)</label>
                        <input type="number" value={bbsInput.l} onChange={(e) => setBbsInput({...bbsInput, l: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                     </div>
                 )}
                 {bbsType === 'crank' && (
                     <>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Clear Span (ft)</label>
                            <input type="number" value={bbsInput.span} onChange={(e) => setBbsInput({...bbsInput, span: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Slab Thick (in)</label>
                            <input type="number" value={bbsInput.depth} onChange={(e) => setBbsInput({...bbsInput, depth: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Bearing/Ld (Each Side) (in)</label>
                            <input type="number" value={bbsInput.bearing} onChange={(e) => setBbsInput({...bbsInput, bearing: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                     </>
                 )}
                 
                 <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Clear Cover (in)</label>
                    <input type="number" value={bbsInput.cover} onChange={(e) => setBbsInput({...bbsInput, cover: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                 </div>
                 <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Bar Dia (mm)</label>
                    <select value={bbsInput.d} onChange={(e) => setBbsInput({...bbsInput, d: parseFloat(e.target.value)})} className={GLASS_INPUT}>
                        <option value="8">8 mm</option>
                        <option value="10">10 mm</option>
                        <option value="12">12 mm</option>
                        <option value="16">16 mm</option>
                        <option value="20">20 mm</option>
                    </select>
                 </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center">
                   <div className="flex items-center justify-center gap-2 mb-2">
                       <Scissors className="w-5 h-5 text-teal-400" />
                       <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cutting Length</span>
                   </div>
                   
                   <div className="text-4xl font-bold text-white mb-2">
                       {bbsResult.feet}' <span className="text-teal-400">{bbsResult.inch.toFixed(2)}"</span>
                   </div>
                   <div className="text-sm text-gray-500 mb-4">
                       Total: {bbsResult.totalInch.toFixed(2)} inches
                   </div>

                   <div className="text-[10px] bg-black/30 py-1 px-3 rounded-full inline-block text-gray-400">
                       Formula: {bbsResult.formula}
                   </div>
              </div>
          </div>
      </div>
  );

  const ConstructionView = () => (
      <div className="space-y-6 animate-fade-in">
          {/* Tabs */}
          <div className="flex bg-[#2c2c2e] p-1 rounded-xl">
              <button onClick={() => { setConstType('column'); setConstInput({l:12, w:12, h:10, qty:1})}} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${constType === 'column' ? 'bg-[#007aff] text-white shadow-md' : 'text-gray-400'}`}>Column</button>
              <button onClick={() => { setConstType('beam'); setConstInput({l:10, w:15, h:20, qty:1})}} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${constType === 'beam' ? 'bg-[#007aff] text-white shadow-md' : 'text-gray-400'}`}>Beam</button>
              <button onClick={() => { setConstType('slab'); setConstInput({l:20, w:30, h:6, qty:1})}} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${constType === 'slab' ? 'bg-[#007aff] text-white shadow-md' : 'text-gray-400'}`}>Slab</button>
          </div>

          <div className={GLASS_CARD}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                 {constType === 'column' && (
                     <>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Length (Inch)</label>
                            <input type="number" value={constInput.l} onChange={(e) => setConstInput({...constInput, l: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Width (Inch)</label>
                            <input type="number" value={constInput.w} onChange={(e) => setConstInput({...constInput, w: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Height (Feet)</label>
                            <input type="number" value={constInput.h} onChange={(e) => setConstInput({...constInput, h: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                     </>
                 )}
                 {constType === 'beam' && (
                     <>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Width (Inch)</label>
                            <input type="number" value={constInput.l} onChange={(e) => setConstInput({...constInput, l: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Depth (Inch)</label>
                            <input type="number" value={constInput.w} onChange={(e) => setConstInput({...constInput, w: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Length (Feet)</label>
                            <input type="number" value={constInput.h} onChange={(e) => setConstInput({...constInput, h: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                     </>
                 )}
                 {constType === 'slab' && (
                     <>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Length (Feet)</label>
                            <input type="number" value={constInput.l} onChange={(e) => setConstInput({...constInput, l: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Width (Feet)</label>
                            <input type="number" value={constInput.w} onChange={(e) => setConstInput({...constInput, w: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                        <div>
                            <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Thick. (Inch)</label>
                            <input type="number" value={constInput.h} onChange={(e) => setConstInput({...constInput, h: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                        </div>
                     </>
                 )}
                 <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase mb-1 block">Qty (Nos)</label>
                    <input type="number" value={constInput.qty} onChange={(e) => setConstInput({...constInput, qty: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                 </div>
              </div>

              <div className="space-y-3">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-500"><Component className="w-5 h-5"/></div>
                          <div>
                              <span className="text-xs text-gray-400 block font-medium">Shuttering Area</span>
                              <span className="text-[10px] text-gray-600">Formwork required</span>
                          </div>
                      </div>
                      <div className="text-right">
                          <span className="text-xl font-bold text-white block">{constructionResult.shuttering.toFixed(2)}</span>
                          <span className="text-xs text-gray-500">Sq. Feet (Sft)</span>
                      </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500"><Box className="w-5 h-5"/></div>
                          <div>
                              <span className="text-xs text-gray-400 block font-medium">Casting Volume</span>
                              <span className="text-[10px] text-gray-600">Wet Concrete</span>
                          </div>
                      </div>
                      <div className="text-right">
                          <span className="text-xl font-bold text-white block">{constructionResult.casting.toFixed(2)}</span>
                          <span className="text-xs text-gray-500">Cubic Feet (Cft)</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const ConverterView = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="flex bg-[#2c2c2e] p-1 rounded-xl">
              {(['length', 'area', 'volume', 'mass'] as UnitType[]).map(t => (
                  <button 
                    key={t}
                    onClick={() => { setConvType(t); setUnitFrom(Object.keys(CONVERSION[t])[0]); setUnitTo(Object.keys(CONVERSION[t])[1]); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-all ${convType === t ? 'bg-[#007aff] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                  >
                      {t}
                  </button>
              ))}
          </div>

          <div className={`${GLASS_CARD} space-y-6`}>
              <div>
                  <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 block">From</label>
                  <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={convVal} 
                        onChange={(e) => setConvVal(parseFloat(e.target.value) || 0)} 
                        className={GLASS_INPUT}
                      />
                      <select 
                        value={unitFrom} 
                        onChange={(e) => setUnitFrom(e.target.value)}
                        className={`${GLASS_INPUT} w-24`}
                      >
                          {Object.keys(CONVERSION[convType]).map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                  </div>
              </div>

              <div className="flex justify-center -my-2">
                  <div className="bg-[#2c2c2e] p-2 rounded-full border border-white/10 text-gray-400">
                      <ArrowRightLeft className="w-5 h-5 rotate-90" />
                  </div>
              </div>

              <div>
                  <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 block">To</label>
                  <div className="flex gap-2">
                      <div className={`${GLASS_INPUT} flex items-center bg-[#2c2c2e]/50 font-bold text-xl`}>
                          {convertedValue.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </div>
                      <select 
                        value={unitTo} 
                        onChange={(e) => setUnitTo(e.target.value)}
                        className={`${GLASS_INPUT} w-24`}
                      >
                          {Object.keys(CONVERSION[convType]).map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                  </div>
              </div>
          </div>
      </div>
  );

  const SteelView = () => (
      <div className="space-y-6 animate-fade-in">
          <div className={GLASS_CARD}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-500 fill-red-500" /> Steel Calc
                </h3>
                <div className="flex bg-[#2c2c2e] rounded-lg p-1">
                    <button onClick={() => { setSteelUnit('ft'); setSteelLen(39); }} className={`px-3 py-1 text-xs rounded-md transition-all ${steelUnit === 'ft' ? 'bg-red-500 text-white' : 'text-gray-400'}`}>Feet</button>
                    <button onClick={() => { setSteelUnit('m'); setSteelLen(12); }} className={`px-3 py-1 text-xs rounded-md transition-all ${steelUnit === 'm' ? 'bg-red-500 text-white' : 'text-gray-400'}`}>Meter</button>
                </div>
              </div>
              
              <div className="space-y-4">
                  <div>
                      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">Rod Diameter (mm)</label>
                      <select value={steelDia} onChange={(e) => setSteelDia(Number(e.target.value))} className={GLASS_INPUT}>
                          {[8,10,12,16,20,22,25,32].map(d => <option key={d} value={d}>{d} mm</option>)}
                      </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">Length ({steelUnit})</label>
                          <input type="number" value={steelLen} onChange={(e) => setSteelLen(parseFloat(e.target.value))} className={GLASS_INPUT} />
                          <div className="flex gap-2 mt-2">
                             <button onClick={() => setSteelLen(steelUnit === 'ft' ? 39 : 12)} className="bg-white/5 hover:bg-white/10 text-[10px] py-1 px-2 rounded border border-white/5 text-gray-300">
                                 Std ({steelUnit === 'ft' ? '39ft' : '12m'})
                             </button>
                             <button onClick={() => setSteelLen(1)} className="bg-white/5 hover:bg-white/10 text-[10px] py-1 px-2 rounded border border-white/5 text-gray-300">
                                 Unit (1)
                             </button>
                          </div>
                      </div>
                      <div>
                          <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">Quantity</label>
                          <input type="number" value={steelQty} onChange={(e) => setSteelQty(parseFloat(e.target.value))} className={GLASS_INPUT} />
                      </div>
                  </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Weight</span>
                    <span className="text-4xl font-bold text-white leading-none">
                        {steelWeight.toFixed(2)} <span className="text-base font-medium text-gray-500">kg</span>
                    </span>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-3 flex justify-between items-center border border-white/5">
                      <div className="flex items-center gap-2 text-gray-400">
                          <Coins className="w-4 h-4" />
                          <span className="text-xs font-medium">Est. Cost (@{DEFAULT_CONFIG.rates.steel}/kg)</span>
                      </div>
                      <span className="font-bold text-emerald-400">৳ {estimatedCost.toLocaleString()}</span>
                  </div>

                  <p className="text-[10px] text-gray-600 mt-3 text-center">
                      Formula: {steelUnit === 'ft' ? '(D² / 533.33) × L' : '(D² / 162.2) × L'}
                  </p>
              </div>
          </div>
      </div>
  );

  const VolumeView = () => (
      <div className="space-y-4 animate-fade-in h-full flex flex-col">
          <div className={`${GLASS_CARD} p-4`}>
              <div className="grid grid-cols-4 gap-2 mb-2">
                  <input placeholder="Item Name" value={volInput.desc} onChange={(e) => setVolInput({...volInput, desc: e.target.value})} className={`${GLASS_INPUT} col-span-4 mb-2`} />
                  <input type="number" placeholder="L" value={volInput.l} onChange={(e) => setVolInput({...volInput, l: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                  <input type="number" placeholder="W" value={volInput.w} onChange={(e) => setVolInput({...volInput, w: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                  <input type="number" placeholder="H" value={volInput.h} onChange={(e) => setVolInput({...volInput, h: parseFloat(e.target.value)})} className={GLASS_INPUT} />
                  <input type="number" placeholder="Qty" value={volInput.qty} onChange={(e) => setVolInput({...volInput, qty: parseFloat(e.target.value)})} className={GLASS_INPUT} />
              </div>
              <button onClick={addVolItem} className={`${ACTION_BTN} w-full py-2`}>
                  <Plus className="w-5 h-5" /> Add
              </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pb-32">
              {volItems.map(item => (
                  <div key={item.id} className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 flex justify-between items-center animate-fade-in">
                      <div>
                          <div className="text-sm font-bold text-white">{item.desc}</div>
                          <div className="text-[10px] text-gray-500">
                             {item.l} x {item.w} x {item.h} • Qty: {item.qty}
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <span className="text-emerald-400 font-bold">{item.total.toFixed(2)}</span>
                          <button onClick={() => removeVolItem(item.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              ))}
              
              {volItems.length > 0 && (
                  <div className="bg-[#007aff]/10 border border-[#007aff]/20 p-4 rounded-2xl mt-4">
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase text-[#007aff] tracking-wider">Total Volume</span>
                          <span className="text-2xl font-bold text-white">{totalVolume.toFixed(2)} <span className="text-sm font-normal text-gray-400">cft</span></span>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col">
       {/* Dashboard Header */}
       <div className="flex items-center gap-4 mb-6 mt-2">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-white capitalize">{activeView === 'menu' ? 'Tools Dashboard' : activeView}</h2>
       </div>

       {/* View Renderer */}
       <div className="flex-1 overflow-hidden">
           {activeView === 'menu' && <MenuView />}
           {activeView === 'converter' && <ConverterView />}
           {activeView === 'volume' && <VolumeView />}
           {activeView === 'steel' && <SteelView />}
           {activeView === 'construction' && <ConstructionView />}
           {activeView === 'bbs' && <BBSView />}
       </div>
    </div>
  );
};