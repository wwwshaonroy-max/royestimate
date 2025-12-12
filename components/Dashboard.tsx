import React, { useState, useMemo } from 'react';
import { 
  ArrowsRightLeftIcon, 
  CalculatorIcon, 
  Square3Stack3DIcon, 
  ScaleIcon, 
  PlusIcon,
  CubeIcon,
  ArrowsPointingOutIcon,
  MapIcon,
  ViewColumnsIcon,
  RectangleStackIcon,
  StopIcon,
  TableCellsIcon,
  ArrowDownOnSquareIcon,
  ChevronLeftIcon,
  SparklesIcon,
  BeakerIcon,
  SquaresPlusIcon
} from '@heroicons/react/24/outline';
import { DEFAULT_CONFIG } from '../constants';

// --- Helper: Unit Conversion Factors ---
const CONVERSION = {
  length: { m: 1, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254 },
  area: { sqm: 1, sqft: 0.092903 },
  volume: { cum: 1, cft: 0.0283168 },
  mass: { kg: 1, lb: 0.453592, tonne: 1000 }
};

type UnitType = 'length' | 'area' | 'volume' | 'mass';
type ToolType = 'menu' | 'converter' | 'volume' | 'shuttering' | 'steel' | 'mix' | 'flooring';

export const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<ToolType>('menu');

  // --- Widget 1: Unit Converter State ---
  const [convType, setConvType] = useState<UnitType>('length');
  const [convVal, setConvVal] = useState<number>(1);
  const [unitFrom, setUnitFrom] = useState<string>('m');
  const [unitTo, setUnitTo] = useState<string>('ft');

  const convertedValue = useMemo(() => {
    const base = convVal * (CONVERSION[convType] as any)[unitFrom];
    const target = base / (CONVERSION[convType] as any)[unitTo];
    return target;
  }, [convType, convVal, unitFrom, unitTo]);

  // --- Widget 2: Volume Calc State ---
  const [volItems, setVolItems] = useState<Array<{id: number, desc: string, l: number, w: number, h: number, qty: number, total: number}>>([]);
  const [volInput, setVolInput] = useState({ desc: 'Item 1', l: 10, w: 10, h: 5, qty: 1 });
  const [volUnit, setVolUnit] = useState<'ft' | 'm'>('ft');

  const addVolItem = () => {
    const total = volInput.l * volInput.w * volInput.h * volInput.qty;
    setVolItems([...volItems, { ...volInput, id: Date.now(), total }]);
    setVolInput({ ...volInput, desc: `Item ${volItems.length + 2}` });
  };
  const removeVolItem = (id: number) => setVolItems(volItems.filter(i => i.id !== id));
  const totalVolume = volItems.reduce((acc, curr) => acc + curr.total, 0);

  // --- Widget 3: Shuttering State ---
  const [shutType, setShutType] = useState<'column' | 'beam' | 'slab' | 'wall' | 'footing'>('column');
  const [shutDim, setShutDim] = useState({ l: 10, w: 12, h: 10 }); 
  const shutteringArea = useMemo(() => {
     if (shutType === 'column') return ((2 * (shutDim.l + shutDim.w)) / 12) * shutDim.h;
     if (shutType === 'beam') return ((shutDim.l + 2 * shutDim.w) / 12) * shutDim.h;
     if (shutType === 'slab') return shutDim.l * shutDim.w;
     if (shutType === 'wall') return (2 * shutDim.l * shutDim.w) + (2 * (shutDim.h / 12) * shutDim.w);
     if (shutType === 'footing') return 2 * (shutDim.l + shutDim.w) * (shutDim.h / 12);
     return 0;
  }, [shutType, shutDim]);

  // --- Widget 4: Steel Weight State ---
  const [steelItems, setSteelItems] = useState<Array<{id: number, dia: number, len: number, qty: number, weight: number}>>([]);
  const [steelInput, setSteelInput] = useState({ dia: 10, len: 10, qty: 1 });
  const unitWeight = useMemo(() => {
      const d = steelInput.dia;
      return DEFAULT_CONFIG.rodWeights[d] || (d * d) / 533;
  }, [steelInput.dia]);
  const addSteelItem = () => {
      if (steelInput.len <= 0 || steelInput.qty <= 0) return;
      const weight = unitWeight * steelInput.len * steelInput.qty;
      setSteelItems([...steelItems, { ...steelInput, id: Date.now(), weight }]);
  };
  const removeSteelItem = (id: number) => setSteelItems(steelItems.filter(i => i.id !== id));
  const totalSteelWeight = steelItems.reduce((acc, i) => acc + i.weight, 0);

  // --- Widget 5: Concrete Mix (NEW) ---
  const [mixInput, setMixInput] = useState({ vol: 100, unit: 'cft', ratio: '1:1.5:3' });
  const mixResult = useMemo(() => {
      const parts = mixInput.ratio.split(':').map(Number);
      const sum = parts.reduce((a,b) => a+b, 0);
      const dryCoeff = 1.54;
      
      const volCft = mixInput.unit === 'cft' ? mixInput.vol : mixInput.vol * 35.315;
      const dryVol = volCft * dryCoeff;

      const cementCft = (dryVol * parts[0]) / sum;
      const sandCft = (dryVol * parts[1]) / sum;
      const aggCft = (dryVol * parts[2]) / sum;

      return {
          bags: cementCft / 1.25,
          sand: sandCft,
          agg: aggCft
      }
  }, [mixInput]);

  // --- Widget 6: Flooring (NEW) ---
  const [floorInput, setFloorInput] = useState({ l: 12, w: 10, tileL: 24, tileW: 24, boxQty: 4 });
  const floorResult = useMemo(() => {
      const areaSqFt = floorInput.l * floorInput.w;
      const tileAreaSqFt = (floorInput.tileL * floorInput.tileW) / 144;
      const numTiles = Math.ceil((areaSqFt * 1.05) / tileAreaSqFt); // 5% wastage
      const boxes = Math.ceil(numTiles / floorInput.boxQty);
      return { area: areaSqFt, numTiles, boxes };
  }, [floorInput]);

  // --- Render Components ---

  const MenuCard = ({ id, title, icon: Icon, colorClass, bgClass }: any) => (
      <button 
        onClick={() => setActiveView(id)}
        className="group flex flex-col items-center justify-center p-4 rounded-[2rem] bg-white border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 hover:border-lime-200 transition-all duration-300 active:scale-95 aspect-[1/1] w-full relative overflow-hidden"
      >
          <div className={`p-4 rounded-2xl ${bgClass} ${colorClass} mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-stone-700 text-center leading-tight tracking-tight">{title}</h3>
      </button>
  );

  const ToolHeader = ({ title, icon: Icon, colorClass }: any) => (
      <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setActiveView('menu')}
            className="p-3 rounded-full bg-white border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300 transition-colors shadow-sm"
          >
              <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
                  <Icon className={`h-6 w-6 ${colorClass.replace('bg-', 'text-')}`} />
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">{title}</h2>
          </div>
      </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in min-h-[80vh]">
      
      {/* --- MENU VIEW --- */}
      {activeView === 'menu' && (
          <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-100">
                  <div>
                      <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                          <SparklesIcon className="h-8 w-8 text-lime-500" />
                          Engineering Suite
                      </h1>
                      <p className="text-stone-500 mt-2 font-medium">Professional tools for daily estimation</p>
                  </div>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <MenuCard 
                      id="mix"
                      title="Concrete Mix"
                      icon={BeakerIcon}
                      colorClass="text-emerald-600"
                      bgClass="bg-emerald-50"
                  />
                  <MenuCard 
                      id="steel"
                      title="Steel Weight"
                      icon={ScaleIcon}
                      colorClass="text-slate-600"
                      bgClass="bg-slate-50"
                  />
                  <MenuCard 
                      id="shuttering"
                      title="Shuttering Area"
                      icon={CalculatorIcon}
                      colorClass="text-rose-600"
                      bgClass="bg-rose-50"
                  />
                  <MenuCard 
                      id="volume"
                      title="Volume Calc"
                      icon={Square3Stack3DIcon}
                      colorClass="text-amber-600"
                      bgClass="bg-amber-50"
                  />
                  <MenuCard 
                      id="flooring"
                      title="Tiles & Floor"
                      icon={SquaresPlusIcon}
                      colorClass="text-cyan-600"
                      bgClass="bg-cyan-50"
                  />
                  <MenuCard 
                      id="converter"
                      title="Unit Converter"
                      icon={ArrowsRightLeftIcon}
                      colorClass="text-indigo-600"
                      bgClass="bg-indigo-50"
                  />
              </div>
          </div>
      )}

      {/* --- CONCRETE MIX TOOL (NEW) --- */}
      {activeView === 'mix' && (
          <div className="max-w-2xl mx-auto">
              <ToolHeader title="Concrete Mix Designer" icon={BeakerIcon} colorClass="bg-emerald-100 text-emerald-600" />
              <div className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-1">
                          <label className="label-xs">Wet Volume</label>
                          <div className="flex gap-2">
                              <input type="number" value={mixInput.vol} onChange={e => setMixInput({...mixInput, vol: parseFloat(e.target.value)})} className="input-base" />
                              <select value={mixInput.unit} onChange={e => setMixInput({...mixInput, unit: e.target.value})} className="bg-stone-50 rounded-xl font-bold text-sm px-2">
                                  <option value="cft">cft</option>
                                  <option value="cum">m³</option>
                              </select>
                          </div>
                      </div>
                      <div className="col-span-1">
                          <label className="label-xs">Mix Ratio</label>
                          <select value={mixInput.ratio} onChange={e => setMixInput({...mixInput, ratio: e.target.value})} className="input-base cursor-pointer">
                              <option value="1:1:2">M25 (1:1:2)</option>
                              <option value="1:1.5:3">M20 (1:1.5:3)</option>
                              <option value="1:2:4">M15 (1:2:4)</option>
                              <option value="1:3:6">M10 (1:3:6)</option>
                              <option value="1:4:8">M7.5 (1:4:8)</option>
                          </select>
                      </div>
                  </div>

                  <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
                      <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-white p-4 rounded-2xl shadow-sm">
                              <div className="text-3xl font-black text-emerald-700">{Math.ceil(mixResult.bags)}</div>
                              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Cement Bags</div>
                          </div>
                          <div className="bg-white p-4 rounded-2xl shadow-sm">
                              <div className="text-3xl font-black text-stone-700">{mixResult.sand.toFixed(1)}</div>
                              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Sand (cft)</div>
                          </div>
                          <div className="bg-white p-4 rounded-2xl shadow-sm">
                              <div className="text-3xl font-black text-stone-700">{mixResult.agg.toFixed(1)}</div>
                              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Agg (cft)</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- FLOORING TOOL (NEW) --- */}
      {activeView === 'flooring' && (
          <div className="max-w-2xl mx-auto">
              <ToolHeader title="Flooring Calculator" icon={SquaresPlusIcon} colorClass="bg-cyan-100 text-cyan-600" />
              <div className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-8">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div><label className="label-xs">Room Length (ft)</label><input type="number" value={floorInput.l} onChange={e => setFloorInput({...floorInput, l: parseFloat(e.target.value)})} className="input-base" /></div>
                      <div><label className="label-xs">Room Width (ft)</label><input type="number" value={floorInput.w} onChange={e => setFloorInput({...floorInput, w: parseFloat(e.target.value)})} className="input-base" /></div>
                      <div><label className="label-xs">Tile Length (inch)</label><input type="number" value={floorInput.tileL} onChange={e => setFloorInput({...floorInput, tileL: parseFloat(e.target.value)})} className="input-base" /></div>
                      <div><label className="label-xs">Tile Width (inch)</label><input type="number" value={floorInput.tileW} onChange={e => setFloorInput({...floorInput, tileW: parseFloat(e.target.value)})} className="input-base" /></div>
                      <div className="col-span-2"><label className="label-xs">Tiles per Box</label><input type="number" value={floorInput.boxQty} onChange={e => setFloorInput({...floorInput, boxQty: parseFloat(e.target.value)})} className="input-base" /></div>
                  </div>
                  
                  <div className="bg-cyan-50 p-6 rounded-2xl border border-cyan-100 flex justify-between items-center">
                      <div>
                          <span className="text-xs font-bold text-cyan-800 uppercase block mb-1">Total Tiles Needed</span>
                          <span className="text-4xl font-black text-cyan-600">{floorResult.numTiles}</span>
                          <span className="text-xs text-cyan-600 ml-2 font-medium">(inc 5% wastage)</span>
                      </div>
                      <div className="text-right">
                          <span className="text-xs font-bold text-cyan-800 uppercase block mb-1">Total Boxes</span>
                          <span className="text-4xl font-black text-cyan-600">{floorResult.boxes}</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- CONVERTER TOOL (Refined) --- */}
      {activeView === 'converter' && (
          <div className="max-w-2xl mx-auto">
              <ToolHeader title="Unit Converter" icon={ArrowsRightLeftIcon} colorClass="bg-indigo-100 text-indigo-600" />
              <div className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-6 md:p-8">
                {/* Type Selector */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                    {[
                        { id: 'length', icon: ArrowsPointingOutIcon, label: 'Length' },
                        { id: 'area', icon: MapIcon, label: 'Area' },
                        { id: 'volume', icon: CubeIcon, label: 'Volume' },
                        { id: 'mass', icon: ScaleIcon, label: 'Mass' }
                    ].map((item) => (
                        <button 
                           key={item.id}
                           onClick={() => { 
                               setConvType(item.id as UnitType); 
                               setUnitFrom(Object.keys(CONVERSION[item.id as UnitType])[0]); 
                               setUnitTo(Object.keys(CONVERSION[item.id as UnitType])[1]); 
                           }}
                           className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                               convType === item.id 
                               ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-105' 
                               : 'bg-white border-transparent text-stone-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'
                           }`}
                        >
                            <item.icon className="h-6 w-6 mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Conversion Interface */}
                <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-stone-400 uppercase mb-2 block px-1">From Value</label>
                        <div className="flex gap-4">
                            <input 
                                type="number" 
                                value={convVal} 
                                onChange={(e) => setConvVal(parseFloat(e.target.value) || 0)}
                                className="flex-1 p-4 bg-white border border-stone-200 rounded-xl font-mono text-2xl font-bold text-stone-900 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                            />
                            <select 
                                value={unitFrom}
                                onChange={(e) => setUnitFrom(e.target.value)}
                                className="w-24 p-2 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                {Object.keys(CONVERSION[convType]).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <div className="bg-white p-2 rounded-full border border-stone-200 shadow-sm text-stone-400">
                            <ArrowsRightLeftIcon className="h-5 w-5 rotate-90" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-400 uppercase mb-2 block px-1">Result</label>
                        <div className="flex gap-4">
                            <div className="flex-1 p-4 bg-indigo-50 border border-indigo-100 rounded-xl font-mono text-2xl font-bold text-indigo-700 overflow-hidden">
                                {convertedValue.toFixed(4)}
                            </div>
                            <select 
                                value={unitTo}
                                onChange={(e) => setUnitTo(e.target.value)}
                                className="w-24 p-2 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                {Object.keys(CONVERSION[convType]).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
              </div>
          </div>
      )}

      {/* --- VOLUME TOOL --- */}
      {activeView === 'volume' && (
          <div className="max-w-3xl mx-auto">
              <ToolHeader title="Volume Calculator" icon={Square3Stack3DIcon} colorClass="bg-amber-100 text-amber-600" />
              <div className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-6 md:p-8">
                  <div className="flex justify-end mb-6">
                       <div className="flex bg-stone-100 p-1 rounded-lg">
                           <button onClick={() => setVolUnit('ft')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${volUnit === 'ft' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>Feet</button>
                           <button onClick={() => setVolUnit('m')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${volUnit === 'm' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>Meter</button>
                       </div>
                  </div>

                  {/* Input Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 items-end bg-stone-50 p-6 rounded-2xl border border-stone-100">
                      <div className="md:col-span-3">
                          <label className="label-xs">Item Name</label>
                          <input type="text" value={volInput.desc} onChange={e => setVolInput({...volInput, desc: e.target.value})} className="input-base" placeholder="e.g. Footing 1" />
                      </div>
                      <div className="md:col-span-2">
                          <label className="label-xs">Length</label>
                          <input type="number" value={volInput.l} onChange={e => setVolInput({...volInput, l: parseFloat(e.target.value)})} className="input-base" />
                      </div>
                      <div className="md:col-span-2">
                          <label className="label-xs">Width</label>
                          <input type="number" value={volInput.w} onChange={e => setVolInput({...volInput, w: parseFloat(e.target.value)})} className="input-base" />
                      </div>
                      <div className="md:col-span-2">
                          <label className="label-xs">Height</label>
                          <input type="number" value={volInput.h} onChange={e => setVolInput({...volInput, h: parseFloat(e.target.value)})} className="input-base" />
                      </div>
                      <div className="md:col-span-1">
                          <label className="label-xs">Qty</label>
                          <input type="number" value={volInput.qty} onChange={e => setVolInput({...volInput, qty: parseFloat(e.target.value)})} className="input-base" />
                      </div>
                      <div className="md:col-span-2">
                          <button onClick={addVolItem} className="w-full p-3 bg-stone-900 hover:bg-black text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 shadow-lg shadow-stone-200 transition-all active:scale-95">
                              <PlusIcon className="h-4 w-4" /> Add
                          </button>
                      </div>
                  </div>

                  {/* List */}
                  <div className="space-y-3 mb-8">
                      {volItems.length === 0 ? (
                          <div className="py-12 flex flex-col items-center justify-center text-stone-300 border-2 border-dashed border-stone-100 rounded-2xl bg-stone-50/50">
                              <Square3Stack3DIcon className="h-12 w-12 mb-3 opacity-50" />
                              <span className="text-sm font-medium">Add dimensions to calculate volume</span>
                          </div>
                      ) : volItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-stone-100 rounded-xl shadow-sm hover:border-amber-200 transition-colors group">
                              <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                                      {item.qty}x
                                  </div>
                                  <div>
                                      <div className="font-bold text-stone-800">{item.desc}</div>
                                      <div className="text-xs text-stone-400 font-medium mt-0.5">
                                          {item.l} x {item.w} x {item.h} {volUnit}
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-6">
                                  <div className="text-right">
                                      <div className="text-lg font-black text-stone-900">{item.total.toFixed(2)}</div>
                                      <div className="text-[10px] font-bold text-stone-400 uppercase">{volUnit === 'ft' ? 'cft' : 'cum'}</div>
                                  </div>
                                  <button onClick={() => removeVolItem(item.id)} className="text-stone-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                      <ScaleIcon className="h-5 w-5" />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- SHUTTERING TOOL --- */}
      {activeView === 'shuttering' && (
          <div className="max-w-2xl mx-auto">
              <ToolHeader title="Shuttering Calculator" icon={CalculatorIcon} colorClass="bg-rose-100 text-rose-600" />
              <div className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-6 md:p-8">
                  {/* Type Grid */}
                  <div className="grid grid-cols-5 gap-3 mb-8">
                       {[
                          { id: 'column', icon: ViewColumnsIcon, label: 'Column' },
                          { id: 'beam', icon: RectangleStackIcon, label: 'Beam' },
                          { id: 'slab', icon: StopIcon, label: 'Slab' },
                          { id: 'wall', icon: TableCellsIcon, label: 'Wall' },
                          { id: 'footing', icon: ArrowDownOnSquareIcon, label: 'Footing' }
                       ].map((item) => (
                           <button 
                              key={item.id}
                              onClick={() => setShutType(item.id as any)}
                              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                                  shutType === item.id 
                                  ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200 transform scale-105' 
                                  : 'bg-white border-stone-100 text-stone-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100'
                              }`}
                           >
                               <item.icon className="h-6 w-6 mb-2" />
                               <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
                           </button>
                       ))}
                  </div>

                  <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 mb-8">
                        {shutType === 'column' && (
                            <div className="space-y-4">
                                <div className="section-badge bg-rose-100 text-rose-600">Column: 4 Side Contact Area</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label-xs">Size L (Inch)</label><input type="number" value={shutDim.l} onChange={e => setShutDim({...shutDim, l: parseFloat(e.target.value)})} className="input-base" /></div>
                                    <div><label className="label-xs">Size W (Inch)</label><input type="number" value={shutDim.w} onChange={e => setShutDim({...shutDim, w: parseFloat(e.target.value)})} className="input-base" /></div>
                                    <div className="col-span-2"><label className="label-xs">Height (Feet)</label><input type="number" value={shutDim.h} onChange={e => setShutDim({...shutDim, h: parseFloat(e.target.value)})} className="input-base" /></div>
                                </div>
                            </div>
                        )}
                        {/* (Other Shuttering inputs same as logic, just updated UI classes) */}
                        {shutType === 'beam' && (
                            <div className="space-y-4">
                                <div className="section-badge bg-rose-100 text-rose-600">Beam: Bottom + 2 Sides</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label-xs">Width (Inch)</label><input type="number" value={shutDim.l} onChange={e => setShutDim({...shutDim, l: parseFloat(e.target.value)})} className="input-base" /></div>
                                    <div><label className="label-xs">Depth (Inch)</label><input type="number" value={shutDim.w} onChange={e => setShutDim({...shutDim, w: parseFloat(e.target.value)})} className="input-base" /></div>
                                    <div className="col-span-2"><label className="label-xs">Length (Feet)</label><input type="number" value={shutDim.h} onChange={e => setShutDim({...shutDim, h: parseFloat(e.target.value)})} className="input-base" /></div>
                                </div>
                            </div>
                        )}
                        {shutType === 'slab' && (
                             <div className="space-y-4">
                                <div className="section-badge bg-rose-100 text-rose-600">Slab: Bottom Contact Area</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label-xs">Length (Feet)</label><input type="number" value={shutDim.l} onChange={e => setShutDim({...shutDim, l: parseFloat(e.target.value)})} className="input-base" /></div>
                                    <div><label className="label-xs">Width (Feet)</label><input type="number" value={shutDim.w} onChange={e => setShutDim({...shutDim, w: parseFloat(e.target.value)})} className="input-base" /></div>
                                </div>
                             </div>
                        )}
                        {shutType === 'wall' && (
                             <div className="space-y-4">
                                 <div className="section-badge bg-rose-100 text-rose-600">Shear Wall: 2 Faces + 2 Ends</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label-xs">Length (Feet)</label><input type="number" value={shutDim.l} onChange={e => setShutDim({...shutDim, l: parseFloat(e.target.value)})} className="input-base" /></div>
                                    <div><label className="label-xs">Height (Feet)</label><input type="number" value={shutDim.w} onChange={e => setShutDim({...shutDim, w: parseFloat(e.target.value)})} className="input-base" /></div>
                                    <div className="col-span-2"><label className="label-xs">Thickness (Inch)</label><input type="number" value={shutDim.h} onChange={e => setShutDim({...shutDim, h: parseFloat(e.target.value)})} className="input-base" /></div>
                                </div>
                             </div>
                        )}
                        {shutType === 'footing' && (
                             <div className="space-y-4">
                                 <div className="section-badge bg-rose-100 text-rose-600">Footing: Side Contact Area</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label-xs">Length (Feet)</label><input type="number" value={shutDim.l} onChange={e => setShutDim({...shutDim, l: parseFloat(e.target.value)})} className="input-base" /></div>
                                    <div><label className="label-xs">Width (Feet)</label><input type="number" value={shutDim.w} onChange={e => setShutDim({...shutDim, w: parseFloat(e.target.value)})} className="input-base" /></div>
                                    <div className="col-span-2"><label className="label-xs">Depth (Inch)</label><input type="number" value={shutDim.h} onChange={e => setShutDim({...shutDim, h: parseFloat(e.target.value)})} className="input-base" /></div>
                                </div>
                             </div>
                        )}
                  </div>

                  <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-rose-500 uppercase tracking-wide">Required Area</span>
                      <div className="text-right">
                          <div className="text-4xl font-black text-rose-600">{shutteringArea.toFixed(2)}</div>
                          <div className="text-xs font-bold text-rose-400 uppercase tracking-widest mt-1">Sq. Feet</div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- STEEL TOOL --- */}
      {activeView === 'steel' && (
          <div className="max-w-2xl mx-auto">
              <ToolHeader title="Steel Weight" icon={ScaleIcon} colorClass="bg-slate-200 text-slate-700" />
              <div className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-6 md:p-8">
                  {/* Diameter Selector */}
                  <div className="mb-8">
                       <label className="label-xs mb-3">Select Bar Diameter (mm)</label>
                       <div className="flex flex-wrap gap-3">
                           {[8, 10, 12, 16, 20, 25, 32].map(d => (
                               <button 
                                  key={d}
                                  onClick={() => setSteelInput({...steelInput, dia: d})}
                                  className={`h-14 w-14 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-200 relative ${
                                      steelInput.dia === d 
                                      ? 'bg-slate-800 border-slate-800 text-white shadow-lg scale-110 z-10' 
                                      : 'bg-white border-stone-200 text-stone-400 hover:border-slate-400 hover:text-slate-600'
                                  }`}
                               >
                                   <span className="text-sm font-bold leading-none">{d}</span>
                                   <span className="text-[9px] opacity-60">mm</span>
                               </button>
                           ))}
                       </div>
                  </div>
                  
                  {/* Input Form */}
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 grid grid-cols-5 gap-4 items-end mb-8">
                       <div className="col-span-2">
                           <label className="label-xs">Length (ft)</label>
                           <input 
                              type="number" 
                              value={steelInput.len}
                              onChange={e => setSteelInput({...steelInput, len: parseFloat(e.target.value) || 0})}
                              className="input-base"
                           />
                       </div>
                       <div className="col-span-2">
                           <label className="label-xs">Count (Nos)</label>
                           <input 
                              type="number" 
                              value={steelInput.qty}
                              onChange={e => setSteelInput({...steelInput, qty: parseFloat(e.target.value) || 0})}
                              className="input-base"
                           />
                       </div>
                       <div className="col-span-1">
                          <button onClick={addSteelItem} className="w-full h-[42px] bg-slate-800 hover:bg-black text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-slate-200">
                              <PlusIcon className="h-5 w-5" />
                          </button>
                       </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {steelItems.length === 0 ? (
                           <div className="py-8 flex flex-col items-center justify-center text-stone-300 border-2 border-dashed border-stone-100 rounded-2xl">
                              <span className="text-sm font-medium">Add bars to calculate weight</span>
                           </div>
                      ) : (
                          steelItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-stone-100 rounded-xl shadow-sm text-sm group">
                                  <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                                          {item.dia}
                                      </div>
                                      <div className="text-stone-600">
                                          <span className="font-bold text-stone-900">{item.qty}</span> bars x <span className="font-bold text-stone-900">{item.len}</span> ft
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <span className="font-bold text-slate-700 text-lg">{item.weight.toFixed(2)} <span className="text-xs font-normal text-stone-400">kg</span></span>
                                      <button onClick={() => removeSteelItem(item.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                                          <ScaleIcon className="h-4 w-4" />
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  {/* Footer Total */}
                  <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                       <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
                       
                       <div className="relative z-10 flex justify-between items-center">
                           <div>
                               <span className="text-xs text-slate-400 font-bold uppercase block">Total Items</span>
                               <span className="text-lg font-bold text-white">{steelItems.length}</span>
                           </div>
                           <div className="text-right">
                               <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total Weight</div>
                               <div className="text-4xl font-black text-white leading-none">{totalSteelWeight.toFixed(2)} <span className="text-sm text-slate-400 font-bold">kg</span></div>
                           </div>
                       </div>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .input-base {
            width: 100%;
            padding: 0.75rem;
            font-size: 0.875rem;
            font-weight: 600;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            outline: none;
            transition: all 0.2s;
            background-color: #fff;
        }
        .input-base:focus {
            border-color: #a3e635; /* Lime-400 */
            box-shadow: 0 0 0 3px rgba(163, 230, 53, 0.2);
        }
        .label-xs {
            display: block;
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            color: #a8a29e;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
        }
        .section-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};