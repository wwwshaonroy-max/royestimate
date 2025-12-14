import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ModuleType, Project, SavedItem } from './types';
import { MODULE_FIELDS, MODULE_PREFIXES } from './constants';
import { calculateEstimation, calculateGrandTotal } from './services/calculator';
import { Visualizer } from './components/Visualizer';
import { Dashboard, ToolType } from './components/Dashboard';
import { ReportTemplate } from './components/ReportTemplate';
import { db, auth } from './services/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';

import { 
  Bell, 
  Menu, 
  Search, 
  Home, 
  Grid, 
  Layout, 
  Plus, 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2,
  FileText,
  Hammer,
  Box,
  Layers,
  TrendingUp,
  Brush,
  Component,
  AlignVerticalJustifyCenter,
  ArrowDownToLine,
  SplitSquareHorizontal,
  RectangleVertical,
  Pencil,
  Briefcase,
  Calculator,
  FolderOpen,
  ArrowRightLeft,
  Zap,
  Cloud
} from 'lucide-react';

// --- Types for UI ---
type ViewState = 'home' | 'project_hub' | 'tool_selector' | 'estimator' | 'report' | 'tools';

const TOOL_CONFIG = [
  // Foundation & Structure
  { id: ModuleType.PILE, name: 'Piles', icon: AlignVerticalJustifyCenter, color: 'bg-emerald-600', category: 'Foundation' },
  { id: ModuleType.FOOTING_BOX, name: 'Footing', icon: Box, color: 'bg-teal-600', category: 'Foundation' },
  { id: ModuleType.COLUMN_RECTANGULAR, name: 'Column', icon: RectangleVertical, color: 'bg-blue-600', category: 'Structure' },
  { id: ModuleType.BEAM, name: 'Beam', icon: SplitSquareHorizontal, color: 'bg-indigo-600', category: 'Structure' },
  { id: ModuleType.SLAB, name: 'Slab', icon: Layers, color: 'bg-violet-600', category: 'Structure' },
  
  // Architectural
  { id: ModuleType.STAIR, name: 'Stairs', icon: TrendingUp, color: 'bg-amber-600', category: 'Structure' },
  { id: ModuleType.LINTEL, name: 'Lintel', icon: ArrowDownToLine, color: 'bg-orange-600', category: 'Structure' },
  { id: ModuleType.SUNSHADE, name: 'Sunshade', icon: Component, color: 'bg-rose-600', category: 'Architectural' },
  
  // Finish
  { id: ModuleType.BRICK_WORK, name: 'Brick', icon: Grid, color: 'bg-red-600', category: 'Finishing' },
  { id: ModuleType.PLASTER, name: 'Plaster', icon: Brush, color: 'bg-pink-600', category: 'Finishing' },
];

// --- Sub Components Defined Outside App to prevent Remounting ---

const HomeView: React.FC<{
    createNewProject: () => void;
    setActiveTab: (t: 'home'|'estimate'|'report'|'tools') => void;
    setView: (v: ViewState) => void;
    projectsCount: number;
    openTool: (t: ToolType) => void;
    activeProjectName: string;
}> = ({ createNewProject, setActiveTab, setView, projectsCount, openTool, activeProjectName }) => (
    <div className="animate-fade-in pb-32 pt-10">
        {/* Section: Project Management */}
        <div className="mb-8 px-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Projects</h3>
            <div className="grid grid-cols-4 gap-y-6">
                
                {/* Create New */}
                <div onClick={createNewProject} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center group-active:scale-95 transition-all shadow-lg">
                        <Plus className="w-7 h-7 text-[#007aff]" />
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium text-center leading-tight">New Project</span>
                </div>

                {/* My Projects */}
                <div onClick={() => { setActiveTab('estimate'); setView('project_hub'); }} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center group-active:scale-95 transition-all shadow-lg relative">
                         <FolderOpen className="w-7 h-7 text-blue-500" />
                         {projectsCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white border-2 border-black">{projectsCount}</span>}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium text-center leading-tight">My Projects</span>
                </div>

                 {/* Report (Latest) */}
                 <div onClick={() => { setActiveTab('report'); setView('report'); }} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center group-active:scale-95 transition-all shadow-lg">
                        <FileText className="w-7 h-7 text-emerald-500" />
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium text-center leading-tight">Reports</span>
                </div>

            </div>
        </div>

        {/* Section: Quick Tools */}
        <div className="mb-6 px-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Quick Tools</h3>
            <div className="grid grid-cols-4 gap-y-6">
                
                <div onClick={() => openTool('converter')} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center group-active:scale-95 transition-all shadow-lg">
                        <ArrowRightLeft className="w-7 h-7 text-orange-500" />
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium text-center leading-tight">Converter</span>
                </div>

                <div onClick={() => openTool('steel')} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center group-active:scale-95 transition-all shadow-lg">
                        <Zap className="w-7 h-7 text-red-500" />
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium text-center leading-tight">Steel Calc</span>
                </div>

                <div onClick={() => openTool('volume')} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center group-active:scale-95 transition-all shadow-lg">
                        <Box className="w-7 h-7 text-blue-500" />
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium text-center leading-tight">Volume</span>
                </div>

                <div onClick={() => openTool('menu')} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center group-active:scale-95 transition-all shadow-lg">
                        <Grid className="w-7 h-7 text-gray-400" />
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium text-center leading-tight">More</span>
                </div>

            </div>
        </div>

        {/* Section: Recent */}
        <div className="mt-8 px-4 py-4 bg-[#1c1c1e] rounded-3xl mx-2 border border-white/5">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center">
                     <Briefcase className="w-5 h-5" />
                 </div>
                 <div>
                     <div className="text-white font-bold text-sm">Continue Working</div>
                     <div className="text-gray-500 text-xs">On {activeProjectName}</div>
                 </div>
                 <button onClick={() => { setActiveTab('estimate'); setView('project_hub'); }} className="ml-auto bg-[#007aff] px-4 py-1.5 rounded-full text-xs font-bold text-white">
                     Open
                 </button>
             </div>
        </div>

    </div>
);

const ProjectHubView: React.FC<{
    activeProject: Project;
    setView: (v: ViewState) => void;
    isEditingProjectName: boolean;
    setIsEditingProjectName: (v: boolean) => void;
    updateProjectName: (n: string) => void;
    projectGrandTotal: any;
    handleEditItem: (i: SavedItem) => void;
    handleDeleteItem: (id: string) => void;
}> = ({ activeProject, setView, isEditingProjectName, setIsEditingProjectName, updateProjectName, projectGrandTotal, handleEditItem, handleDeleteItem }) => (
      <div className="animate-fade-in pb-32">
          {/* Header */}
          <div className="mt-2 mb-6 flex justify-between items-start">
             <div className="flex-1">
                 <button onClick={() => setView('home')} className="flex items-center gap-1 text-xs text-[#007aff] font-bold uppercase tracking-widest mb-2 hover:underline">
                    <ChevronLeft className="w-3 h-3" /> Home
                 </button>
                 {isEditingProjectName ? (
                     <input 
                        autoFocus
                        onBlur={() => setIsEditingProjectName(false)}
                        value={activeProject.name}
                        onChange={(e) => updateProjectName(e.target.value)}
                        className="bg-transparent border-b border-[#007aff] text-2xl font-bold text-white w-full outline-none pb-1"
                     />
                 ) : (
                     <h1 onClick={() => setIsEditingProjectName(true)} className="text-2xl font-bold text-white flex items-center gap-2 cursor-pointer group">
                         {activeProject.name}
                         <Pencil className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                     </h1>
                 )}
                 <p className="text-xs text-gray-500 mt-1">Last modified: {activeProject.lastModified.toLocaleDateString()}</p>
             </div>
          </div>

          {/* Cost Summary Card */}
          <div className="bg-gradient-to-br from-[#1c1c1e] to-[#000] rounded-[2rem] p-6 border border-white/10 shadow-lg relative overflow-hidden mb-8">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#007aff] rounded-full blur-[60px] opacity-20 pointer-events-none" />
               <div className="relative z-10">
                   <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Estimated Cost</p>
                   <h2 className="text-4xl font-bold text-white mb-6">৳ {projectGrandTotal.totalCost.toLocaleString()}</h2>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                            <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Cement</span>
                            <span className="text-lg font-semibold text-white">{Math.ceil(projectGrandTotal.cementBags)} <span className="text-xs text-gray-500 font-normal">bags</span></span>
                       </div>
                       <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                            <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Steel</span>
                            <span className="text-lg font-semibold text-white">{Math.ceil(projectGrandTotal.steelKg)} <span className="text-xs text-gray-500 font-normal">kg</span></span>
                       </div>
                   </div>
               </div>
          </div>

          {/* Items List */}
          <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Estimated Items</h3>
              <span className="text-xs text-gray-500 font-medium bg-[#1c1c1e] px-2 py-1 rounded-lg">{activeProject.items.length} Total</span>
          </div>

          <div className="space-y-3">
              {activeProject.items.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                      <p className="text-gray-500 text-sm font-medium">No items added yet.</p>
                      <p className="text-gray-600 text-xs mt-1">Tap the + button to start estimating.</p>
                  </div>
              ) : (
                  [...activeProject.items].reverse().map(item => {
                      const config = TOOL_CONFIG.find(t => t.id === item.moduleType);
                      return (
                        <div key={item.id} onClick={() => handleEditItem(item)} className="bg-[#1c1c1e] p-4 rounded-2xl flex items-center justify-between group border border-transparent hover:border-[#007aff]/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${config?.color || 'bg-gray-700'}`}>
                                    {config?.icon ? <config.icon className="w-6 h-6" /> : <Box className="w-6 h-6" />}
                                </div>
                                <div>
                                    <div className="text-white font-medium text-[15px]">{item.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        {config?.name}
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        ৳ {item.result.totalCost.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      )
                  })
              )}
          </div>

          {/* Floating Action Button */}
          <div className="fixed bottom-32 right-6 z-30">
              <button 
                  onClick={() => setView('tool_selector')}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[#007aff] to-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-900/40 border border-white/20 hover:scale-105 active:scale-95 transition-all"
              >
                  <Plus className="w-8 h-8" />
              </button>
          </div>
      </div>
);

const ToolSelectorView: React.FC<{
    setView: (v: ViewState) => void;
    setActiveModule: (m: ModuleType) => void;
    setEditingItemId: (id: string | null) => void;
}> = ({ setView, setActiveModule, setEditingItemId }) => (
      <div className="animate-fade-in pb-32">
          <div className="flex items-center gap-4 mb-8 mt-2">
               <button onClick={() => setView('project_hub')} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                   <ChevronLeft className="w-6 h-6" />
               </button>
               <h2 className="text-xl font-semibold text-white">Add to Estimate</h2>
          </div>

          {/* Search */}
          <div className="relative mb-8">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
             <input 
                type="text" 
                placeholder="Search components..." 
                className="w-full bg-[#1c1c1e] text-white rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#007aff] border border-white/5"
             />
          </div>

          <div className="grid grid-cols-3 gap-x-3 gap-y-6">
             {TOOL_CONFIG.map((tool) => (
                <button 
                  key={tool.id} 
                  onClick={() => {
                      setActiveModule(tool.id);
                      setEditingItemId(null);
                      setView('estimator');
                  }}
                  className="flex flex-col items-center gap-3 group cursor-pointer"
                >
                  <div className={`w-[72px] h-[72px] rounded-[24px] ${tool.color} bg-opacity-90 flex items-center justify-center shadow-lg shadow-black/30 border border-white/10 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-active:scale-95 relative overflow-hidden`}>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                    <tool.icon className="w-8 h-8 text-white stroke-[2] drop-shadow-md relative z-10" />
                  </div>
                  <span className="text-[12px] font-medium text-gray-400 group-hover:text-white transition-colors text-center w-full truncate px-1">
                    {tool.name}
                  </span>
                </button>
             ))}
          </div>
      </div>
);

const EstimatorView: React.FC<{
    setView: (v: ViewState) => void;
    editingItemId: string | null;
    activeModule: ModuleType;
    isVisualizerOpen: boolean;
    setIsVisualizerOpen: (v: boolean) => void;
    currentInputs: Record<string, any>;
    currentResults: any;
    currentItemName: string;
    setCurrentItemName: (v: string) => void;
    focusedField: string | undefined;
    setFocusedField: (v: string | undefined) => void;
    handleInputChange: (k: string, v: string, t?: string) => void;
    handleSave: () => void;
}> = ({ setView, editingItemId, activeModule, isVisualizerOpen, setIsVisualizerOpen, currentInputs, currentResults, currentItemName, setCurrentItemName, focusedField, setFocusedField, handleInputChange, handleSave }) => (
      <div className="h-full flex flex-col pb-32 animate-fade-in">
           <div className="flex items-center gap-4 mb-6 mt-2">
               <button onClick={() => setView('project_hub')} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                   <ChevronLeft className="w-6 h-6" />
               </button>
               <div>
                   <h2 className="text-xl font-semibold text-white">{editingItemId ? 'Edit Item' : activeModule.replace(/_/g, ' ')}</h2>
                   <p className="text-xs text-gray-500 font-medium">{editingItemId ? 'Updating existing estimation' : 'Enter dimensions'}</p>
               </div>
               <div className="ml-auto flex gap-2">
                   <button 
                      onClick={() => setIsVisualizerOpen(!isVisualizerOpen)} 
                      className={`p-2 rounded-full ${isVisualizerOpen ? 'bg-[#007aff]/20 text-[#007aff]' : 'bg-white/5 text-gray-400'} transition-colors`}
                    >
                       {isVisualizerOpen ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                   </button>
               </div>
           </div>

           {/* Visualizer Panel */}
           {isVisualizerOpen && (
               <div className="mb-6 rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
                   <Visualizer type={activeModule} inputs={currentInputs} highlightKey={focusedField} />
               </div>
           )}

           {/* Form */}
           <div className="flex-1 overflow-y-auto hide-scrollbar space-y-5">
               <div className="bg-[#1c1c1e] rounded-3xl p-5 border border-white/5 space-y-4">
                   <div>
                       <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">Item Label</label>
                       <input 
                          value={currentItemName}
                          onChange={(e) => setCurrentItemName(e.target.value)}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(undefined)}
                          className="w-full bg-[#2c2c2e] text-white rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#007aff] transition-all"
                       />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       {MODULE_FIELDS[activeModule].map(field => {
                            const isFocused = focusedField === field.highlightKey;
                           return (
                               <div key={field.key} className={field.fullWidth ? 'col-span-2' : ''}>
                                   <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 mb-1.5 block transition-colors ${isFocused ? 'text-[#007aff]' : 'text-gray-500'}`}>
                                       {field.label} {field.unit && <span className="opacity-50">({field.unit})</span>}
                                   </label>
                                   {field.type === 'select' ? (
                                        <select
                                            value={currentInputs[field.key] || field.defaultValue}
                                            onChange={(e) => handleInputChange(field.key, e.target.value, 'select')}
                                            onFocus={() => setFocusedField(field.highlightKey)}
                                            onBlur={() => setFocusedField(undefined)}
                                            className="w-full bg-[#2c2c2e] text-white rounded-xl py-3 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#007aff] appearance-none cursor-pointer"
                                        >
                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                   ) : (
                                       <input 
                                          type="number"
                                          // FIX: Use 'currentInputs[field.key] ?? ''' to ensure controlled input and avoid NaN/null issues
                                          value={currentInputs[field.key] ?? ''}
                                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                                          onFocus={() => setFocusedField(field.highlightKey)}
                                          onBlur={() => setFocusedField(undefined)}
                                          placeholder={String(field.defaultValue)}
                                          className={`w-full bg-[#2c2c2e] text-white rounded-xl py-3 px-4 text-lg font-medium focus:outline-none focus:ring-1 focus:ring-[#007aff] transition-all ${isFocused ? 'bg-[#3a3a3c]' : ''}`}
                                       />
                                   )}
                               </div>
                           )
                       })}
                   </div>
               </div>
               
               {/* Live Result Preview */}
               {currentResults && (
                   <div className="bg-gradient-to-br from-[#1c1c1e] to-[#151516] rounded-3xl p-6 border border-white/5 shadow-lg">
                       <div className="flex justify-between items-center mb-4">
                           <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Estimated Cost</span>
                           <span className="text-2xl font-bold text-emerald-400">৳ {currentResults.totalCost.toLocaleString()}</span>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                           <div className="bg-white/5 rounded-xl p-3 flex flex-col">
                               <span className="text-[10px] text-gray-500 uppercase font-bold">Cement</span>
                               <span className="text-white font-medium">{currentResults.cementBags} Bags</span>
                           </div>
                           <div className="bg-white/5 rounded-xl p-3 flex flex-col">
                               <span className="text-[10px] text-gray-500 uppercase font-bold">Steel</span>
                               <span className="text-white font-medium">{currentResults.steelKg} kg</span>
                           </div>
                       </div>
                   </div>
               )}
           </div>

            {/* Fab */}
           <div className={`absolute bottom-32 right-6 z-30 transition-transform duration-300 ${focusedField ? 'translate-y-40' : 'translate-y-0'}`}>
                <button 
                  onClick={handleSave}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[#007aff] to-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-900/40 border border-white/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Save className="w-7 h-7" />
                </button>
            </div>
      </div>
);

export const App: React.FC = () => {
  // --- Core State ---
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(true);

  // Debounce ref for saving working state
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Auth & Sync ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
        } else {
            try {
                await signInAnonymously(auth);
            } catch (error) {
                console.warn("Auth Error - Falling back to offline mode", error);
                // Fallback to local user
                setUser({ uid: 'local_offline_user', isAnonymous: true } as User);
            }
        }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
      if (!user) return;

      if (user.uid === 'local_offline_user') {
          // Local Storage Sync
          try {
              const localData = localStorage.getItem('rcc_projects');
              if (localData) {
                  const parsed = JSON.parse(localData);
                  // Hydrate dates
                  const hydrated = parsed.map((p: any) => ({
                      ...p,
                      lastModified: new Date(p.lastModified),
                      items: p.items.map((i: any) => ({
                          ...i,
                          timestamp: new Date(i.timestamp)
                      }))
                  }));
                   // Sort by date desc
                  hydrated.sort((a: any,b: any) => b.lastModified.getTime() - a.lastModified.getTime());
                  setProjects(hydrated);
                  // Ensure active project ID is valid
                  if (hydrated.length > 0) {
                      setActiveProjectId(prev => hydrated.find((p:any) => p.id === prev) ? prev : hydrated[0].id);
                  }
              } else {
                   // Create default if none exist
                  const newId = Date.now().toString();
                  const defaultProject: Project = { 
                    id: newId, name: "My First Project", version: "v1.0", lastModified: new Date(), data: {}, items: []
                  };
                  localStorage.setItem('rcc_projects', JSON.stringify([defaultProject]));
                  setProjects([defaultProject]);
                  setActiveProjectId(newId);
              }
          } catch(e) {
              console.error("Local Storage Error", e);
          }
          setIsLoading(false);
          return;
      }

      const q = query(collection(db, "users", user.uid, "projects"));
      const unsubscribeProjects = onSnapshot(q, (snapshot) => {
          const loadedProjects: Project[] = [];
          snapshot.forEach((doc) => {
              const data = doc.data() as any;
              // Reconstruct Dates
              loadedProjects.push({
                  ...data,
                  lastModified: data.lastModified?.toDate ? data.lastModified.toDate() : new Date(),
                  items: data.items.map((i: any) => ({
                      ...i,
                      timestamp: i.timestamp?.toDate ? i.timestamp.toDate() : new Date(i.timestamp)
                  }))
              });
          });
          
          if (loadedProjects.length === 0) {
              // Create default if none exist
              const newId = Date.now().toString();
              const defaultProject: Project = { 
                id: newId, name: "My First Project", version: "v1.0", lastModified: new Date(), data: {}, items: []
              };
              saveProjectToDb(user.uid, defaultProject);
              setProjects([defaultProject]);
              setActiveProjectId(newId);
          } else {
              // Sort by date desc
              loadedProjects.sort((a,b) => b.lastModified.getTime() - a.lastModified.getTime());
              setProjects(loadedProjects);
              // Ensure active project ID is valid
              setActiveProjectId(prev => loadedProjects.find(p => p.id === prev) ? prev : loadedProjects[0].id);
          }
          setIsLoading(false);
      }, (error) => {
          console.error("Sync Error", error);
          setIsLoading(false);
      });

      return () => unsubscribeProjects();
  }, [user]);

  // --- Helpers ---
  const saveProjectToDb = async (uid: string, project: Project) => {
      if (uid === 'local_offline_user') {
           const savedData = localStorage.getItem('rcc_projects');
           let list = savedData ? JSON.parse(savedData) : [];
           const idx = list.findIndex((p: any) => p.id === project.id);
           if (idx > -1) list[idx] = project;
           else list.push(project);
           localStorage.setItem('rcc_projects', JSON.stringify(list));
           return;
      }

      try {
          await setDoc(doc(db, "users", uid, "projects", project.id), project);
      } catch(e) { console.error("Save Error", e); }
  };

  // Debounced save for high frequency updates
  const debouncedSave = (updatedProject: Project) => {
      if (!user) return;
      
      // Update local state immediately for UI responsiveness
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

      // Clear previous timeout
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      // Set new timeout for DB write
      saveTimeoutRef.current = setTimeout(() => {
          saveProjectToDb(user.uid, updatedProject);
      }, 1000); 
  };

  // Immediate save for actions
  const immediateSave = (updatedProject: Project) => {
      if (!user) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      saveProjectToDb(user.uid, updatedProject);
  };


  // Working state
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.COLUMN_RECTANGULAR);
  const [activeTab, setActiveTab] = useState<'home'|'estimate'|'report'|'tools'>('home');
  const [view, setView] = useState<ViewState>('home');
  const [initialDashboardTool, setInitialDashboardTool] = useState<ToolType>('menu');

  // --- UI State ---
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [currentItemName, setCurrentItemName] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | undefined>(undefined);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);

  // Derived
  const FALLBACK_PROJECT: Project = { 
    id: '0', 
    name: 'Loading...', 
    version: 'v0',
    items: [], 
    data: {}, 
    lastModified: new Date() 
  };
  
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || FALLBACK_PROJECT;
  const currentInputs = activeProject.data[activeModule]?.inputs || {};
  const currentResults = activeProject.data[activeModule]?.results || null;
  const projectGrandTotal = calculateGrandTotal(activeProject.items);

  // --- Logic Helpers ---

  const generateNextName = useCallback((module: ModuleType, items: SavedItem[]) => {
    const prefix = MODULE_PREFIXES[module];
    const moduleItems = items.filter(i => i.moduleType === module);
    let maxIndex = 0;
    moduleItems.forEach(item => {
      if (item.name.startsWith(prefix)) {
        const numPart = item.name.replace(prefix, '').replace(/[- ]/g, '');
        const num = parseInt(numPart);
        if (!isNaN(num) && num > maxIndex) maxIndex = num;
      }
    });
    return `${prefix}-${maxIndex + 1}`;
  }, []);

  // Init Module Logic
  useEffect(() => {
    if (view === 'estimator' && !editingItemId && activeProject.id !== '0') {
        const nextName = generateNextName(activeModule, activeProject.items);
        setCurrentItemName(nextName);
    }
    // Initialize default inputs if empty when entering estimator
    if (view === 'estimator' && Object.keys(currentInputs).length === 0 && activeProject.id !== '0') {
        const defaults: Record<string, any> = {};
        MODULE_FIELDS[activeModule].forEach(f => defaults[f.key] = f.defaultValue);
        handleBatchInputChange(defaults);
    }
  }, [activeModule, editingItemId, view]); // eslint-disable-line

  const createNewProject = async () => {
      if (!user) return;
      const newId = Date.now().toString();
      const newProject: Project = {
          id: newId,
          name: `Project ${projects.length + 1}`,
          version: 'v1.0',
          lastModified: new Date(),
          data: {},
          items: []
      };
      
      if (user.uid === 'local_offline_user') {
          const updated = [newProject, ...projects];
          setProjects(updated);
          localStorage.setItem('rcc_projects', JSON.stringify(updated));
          setActiveProjectId(newId);
          setActiveTab('estimate');
          setView('project_hub');
      } else {
          await saveProjectToDb(user.uid, newProject);
          // Subscription will update state, but let's set it optimistically
          setActiveProjectId(newId);
          setActiveTab('estimate');
          setView('project_hub');
      }
  };

  const deleteProject = async (pid: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return;
      if (projects.length <= 1) {
          alert("You must have at least one project.");
          return;
      }
      if (confirm("Are you sure you want to delete this project?")) {
          const rem = projects.filter(p => p.id !== pid);
          if (activeProjectId === pid) setActiveProjectId(rem[0].id);
          
          if (user.uid === 'local_offline_user') {
              setProjects(rem);
              localStorage.setItem('rcc_projects', JSON.stringify(rem));
              return;
          }

          try {
              await deleteDoc(doc(db, "users", user.uid, "projects", pid));
          } catch(e) { console.error("Delete Error", e); }
      }
  };

  const updateProjectName = (newName: string) => {
      const updated = { ...activeProject, name: newName, lastModified: new Date() };
      debouncedSave(updated);
  };

  const handleInputChange = (key: string, value: string, type?: string) => {
    const storedValue = value;
    const newData = { ...activeProject.data };
    const currentModuleData = newData[activeModule] || { inputs: {}, results: null };
    
    const newInputs = { ...currentModuleData.inputs, [key]: storedValue };
    const results = calculateEstimation(activeModule, newInputs);
    
    newData[activeModule] = { inputs: newInputs, results };
    
    const updated = { ...activeProject, data: newData, lastModified: new Date() };
    debouncedSave(updated);
  };

  const handleBatchInputChange = (newValues: Record<string, any>) => {
    const newData = { ...activeProject.data };
    const results = calculateEstimation(activeModule, newValues);
    newData[activeModule] = { inputs: newValues, results };
    
    const updated = { ...activeProject, data: newData, lastModified: new Date() };
    // This is usually init code, so we can save immediately or debounce
    debouncedSave(updated);
  };

  const handleSave = () => {
      if (!currentResults) return;

      let updatedItems;
      if (editingItemId) {
          // Update existing
          updatedItems = activeProject.items.map(it => {
              if (it.id === editingItemId) {
                  return {
                      ...it,
                      name: currentItemName,
                      inputs: { ...currentInputs },
                      result: { ...currentResults },
                      timestamp: new Date()
                  };
              }
              return it;
          });
          setEditingItemId(null);
      } else {
          // Add new
          const name = currentItemName.trim() || generateNextName(activeModule, activeProject.items);
          const newItem: SavedItem = {
              id: Date.now().toString(),
              name,
              moduleType: activeModule,
              inputs: { ...currentInputs },
              result: { ...currentResults },
              timestamp: new Date()
          };
          updatedItems = [newItem, ...activeProject.items];
      }
      
      const updatedProject = { ...activeProject, items: updatedItems, lastModified: new Date() };
      immediateSave(updatedProject);

      // Reset and go back
      const defaults: Record<string, any> = {};
      MODULE_FIELDS[activeModule].forEach(f => defaults[f.key] = f.defaultValue);
      handleBatchInputChange(defaults);
      setCurrentItemName('');
      setView('project_hub');
  };

  const handleEditItem = (item: SavedItem) => {
      setActiveModule(item.moduleType);
      
      const newData = { ...activeProject.data };
      const results = calculateEstimation(item.moduleType, item.inputs);
      newData[item.moduleType] = { inputs: item.inputs, results };
      
      // Update working state immediately (no save to DB needed yet, just local UI state)
      // Actually we need to set inputs to be visible
      const updated = { ...activeProject, data: newData };
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updated : p));

      setCurrentItemName(item.name);
      setEditingItemId(item.id);
      setView('estimator');
      setActiveTab('estimate');
  };

  const handleDeleteItem = (itemId: string) => {
      const updatedItems = activeProject.items.filter(i => i.id !== itemId);
      const updatedProject = { ...activeProject, items: updatedItems, lastModified: new Date() };
      immediateSave(updatedProject);
  };

  const openTool = (tool: ToolType) => {
      setInitialDashboardTool(tool);
      setActiveTab('tools');
      setView('tools');
  };

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#007aff] selection:text-white relative flex items-center justify-center p-0 sm:p-8">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container / Card */}
      <div className="w-full max-w-[420px] bg-[#151516] sm:rounded-[40px] shadow-2xl relative border-x border-b border-white/10 h-[100vh] sm:h-[880px] flex flex-col overflow-hidden ring-1 ring-white/5">
        
        {/* Blue Gradient Blob (Bottom Left) */}
        <div className="absolute bottom-[-50px] left-[-50px] w-[350px] h-[350px] bg-[#007aff] opacity-20 rounded-full blur-[90px] pointer-events-none z-0" />
        
        {/* Top Header Bar */}
        <div className="px-6 pt-8 pb-4 flex justify-between items-center z-20 bg-gradient-to-b from-[#151516] to-transparent">
          <div className="flex items-center gap-4">
            <div onClick={() => setView('home')} className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-blue-500/20 flex-shrink-0 relative z-50">
              <div className="w-full h-full rounded-full bg-[#1c1c1e] overflow-hidden flex items-center justify-center relative">
                 <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">PB</span>
                 <img 
                    src="my_logo.png" 
                    alt="ProBuild" 
                    className="w-full h-full object-cover relative z-10" 
                    onError={(e) => e.currentTarget.style.display='none'} 
                 />
              </div>
            </div>
            <div className="flex flex-col justify-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">ProBuild</span>
                <span className="text-lg font-bold text-white leading-none tracking-tight">Estimator</span>
            </div>
          </div>
          <div className="flex gap-4 items-center">
             {isLoading ? (
                 <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
             ) : (
                <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                    <Cloud className="w-3 h-3" /> Sync
                </div>
             )}
             <button className="text-gray-400 hover:text-white transition-colors">
                <Menu className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-6">
            {activeTab === 'home' && (
                <HomeView 
                    createNewProject={createNewProject}
                    setActiveTab={setActiveTab}
                    setView={setView}
                    projectsCount={projects.length}
                    openTool={openTool}
                    activeProjectName={activeProject.name}
                />
            )}
            {activeTab === 'estimate' && view === 'project_hub' && (
                <ProjectHubView 
                    activeProject={activeProject}
                    setView={setView}
                    isEditingProjectName={isEditingProjectName}
                    setIsEditingProjectName={setIsEditingProjectName}
                    updateProjectName={updateProjectName}
                    projectGrandTotal={projectGrandTotal}
                    handleEditItem={handleEditItem}
                    handleDeleteItem={handleDeleteItem}
                />
            )}
            {activeTab === 'estimate' && view === 'tool_selector' && (
                <ToolSelectorView 
                    setView={setView}
                    setActiveModule={setActiveModule}
                    setEditingItemId={setEditingItemId}
                />
            )}
            {activeTab === 'estimate' && view === 'estimator' && (
                <EstimatorView 
                    setView={setView}
                    editingItemId={editingItemId}
                    activeModule={activeModule}
                    isVisualizerOpen={isVisualizerOpen}
                    setIsVisualizerOpen={setIsVisualizerOpen}
                    currentInputs={currentInputs}
                    currentResults={currentResults}
                    currentItemName={currentItemName}
                    setCurrentItemName={setCurrentItemName}
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                    handleInputChange={handleInputChange}
                    handleSave={handleSave}
                />
            )}
            {activeTab === 'report' && <ReportTemplate project={activeProject} onBack={() => { setActiveTab('estimate'); setView('project_hub'); }} />}
            {activeTab === 'tools' && (
                <div className="pb-32">
                    <Dashboard 
                        initialTool={initialDashboardTool} 
                        onBackToHome={() => { setActiveTab('home'); setView('home'); setInitialDashboardTool('menu'); }} 
                    />
                </div>
            )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className={`absolute bottom-6 left-6 right-6 h-20 bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl flex justify-around items-center px-4 z-20 print:hidden ring-1 ring-white/5 transition-transform duration-300 ${focusedField ? 'translate-y-40' : 'translate-y-0'}`}>
            <NavButton 
                icon={Home} 
                label="Home" 
                active={activeTab === 'home'} 
                onClick={() => { setActiveTab('home'); setView('home'); }} 
            />
            <NavButton 
                icon={Hammer} 
                label="Estimate" 
                active={activeTab === 'estimate'} 
                onClick={() => { setActiveTab('estimate'); setView('project_hub'); }} 
            />
            <NavButton 
                icon={Layout} 
                label="Report" 
                active={activeTab === 'report'} 
                onClick={() => { setActiveTab('report'); setView('report'); }} 
            />
             <NavButton 
                icon={Calculator} 
                label="Tools" 
                active={activeTab === 'tools'} 
                onClick={() => { setInitialDashboardTool('menu'); setActiveTab('tools'); }} 
            />
        </div>
      </div>
    </div>
  );
};

// Bottom Nav Helper
function NavButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all w-20 ${active ? 'text-[#007aff]' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <Icon className={`w-6 h-6 ${active ? 'fill-[#007aff]/20' : ''}`} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </button>
    )
}