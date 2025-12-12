import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ModuleType, Project, SavedItem, EstimationResult } from './types';
import { MODULE_FIELDS, MODULE_PREFIXES } from './constants';
import { calculateEstimation, calculateGrandTotal } from './services/calculator';
import { Visualizer } from './components/Visualizer';
import { Dashboard } from './components/Dashboard';
import { 
  PlusIcon, 
  TrashIcon, 
  ChevronDownIcon, 
  ArrowLeftIcon, 
  PrinterIcon,
  DocumentPlusIcon,
  Bars3Icon,
  ArrowPathIcon,
  Squares2X2Icon,
  XMarkIcon,
  ChevronUpIcon,
  CubeIcon,
  Square3Stack3DIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  FolderIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

const ReportView: React.FC<{ project: Project; total: EstimationResult; onBack: () => void }> = ({ project, total, onBack }) => {
    const groupedItems = useMemo(() => {
        return project.items.reduce((acc, item) => {
            if (!acc[item.moduleType]) acc[item.moduleType] = [];
            acc[item.moduleType].push(item);
            return acc;
        }, {} as Record<ModuleType, SavedItem[]>);
    }, [project.items]);

    return (
        <div className="max-w-5xl mx-auto bg-white min-h-[80vh] shadow-xl shadow-stone-200/50 rounded-[2rem] overflow-hidden flex flex-col mb-10">
             {/* Header */}
             <div className="bg-stone-900 text-white p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <CubeIcon className="w-64 h-64 text-white transform rotate-12 translate-x-12 -translate-y-12" />
                 </div>
                 
                 <div className="relative z-10">
                     <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors mb-6 text-xs font-bold uppercase tracking-wider">
                         <ArrowLeftIcon className="h-4 w-4" /> Back to Editor
                     </button>
                     <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-white">{project.name}</h1>
                     <div className="flex items-center gap-4 text-sm font-medium text-stone-400">
                         <span className="bg-stone-800 px-2 py-0.5 rounded text-xs text-white border border-stone-700">{project.version}</span>
                         <span className="w-1 h-1 bg-stone-600 rounded-full"></span>
                         <span>{project.lastModified.toLocaleDateString()}</span>
                     </div>
                 </div>

                 <div className="relative z-10 flex gap-3">
                     <button onClick={() => window.print()} className="px-5 py-2.5 bg-white text-stone-900 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-200 transition-colors shadow-lg text-sm">
                         <PrinterIcon className="h-4 w-4" /> Print Report
                     </button>
                 </div>
             </div>

             {/* Summary Stats */}
             <div className="grid grid-cols-2 md:grid-cols-4 border-b border-stone-100 divide-x divide-stone-100 bg-stone-50">
                 {[
                     { label: 'Total Items', value: project.items.length, unit: '' },
                     { label: 'Est. Cost', value: `৳ ${total.totalCost.toLocaleString()}`, unit: '', highlight: true },
                     { label: 'Cement', value: total.cementBags, unit: 'Bags' },
                     { label: 'Steel', value: total.steelKg, unit: 'kg' }
                 ].map((stat, idx) => (
                     <div key={idx} className="p-6 text-center">
                         <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                         <p className={`text-xl md:text-2xl font-black ${stat.highlight ? 'text-lime-600' : 'text-stone-900'}`}>{stat.value} <span className="text-xs font-medium text-stone-400">{stat.unit}</span></p>
                     </div>
                 ))}
             </div>

             {/* Content */}
             <div className="p-8 md:p-12 space-y-10 print:p-0 bg-white">
                 {Object.keys(groupedItems).length === 0 ? (
                     <div className="text-center py-12 border-2 border-dashed border-stone-100 rounded-2xl bg-stone-50">
                         <DocumentPlusIcon className="h-12 w-12 mx-auto mb-3 text-stone-300" />
                         <p className="text-stone-400 font-medium">No items to report</p>
                     </div>
                 ) : (
                     Object.entries(groupedItems).map(([type, items]) => (
                         <div key={type}>
                             <div className="flex items-center gap-4 mb-6">
                                 <div className="h-px flex-1 bg-stone-200"></div>
                                 <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest px-4 py-1.5 bg-stone-100 rounded-full border border-stone-200">
                                    {(type as string).replace(/_/g, ' ')}
                                 </h3>
                                 <div className="h-px flex-1 bg-stone-200"></div>
                             </div>
                             
                             <div className="overflow-hidden rounded-xl border border-stone-200 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-stone-50">
                                        <tr className="border-b border-stone-200">
                                            <th className="py-3 px-4 text-[10px] font-bold text-stone-400 uppercase tracking-wider w-1/4">Item Name</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Specs & Details</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-stone-400 uppercase tracking-wider text-right">Materials</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-stone-400 uppercase tracking-wider text-right">Est. Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 bg-white">
                                        {items.map(item => (
                                            <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                                                <td className="py-4 px-4 align-top">
                                                    <div className="font-bold text-stone-900 text-sm">{item.name}</div>
                                                    <div className="text-[10px] text-stone-400 font-mono mt-0.5 uppercase tracking-wide">{item.id.slice(-6)}</div>
                                                </td>
                                                <td className="py-4 px-4 align-top">
                                                    <div className="flex flex-wrap gap-1">
                                                         {item.result.details.map((d, i) => (
                                                             <span key={i} className="text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">{d}</span>
                                                         ))}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 align-top text-right">
                                                    <div className="space-y-0.5">
                                                        <div className="text-xs font-medium text-stone-600">Cement: <span className="font-bold text-stone-900">{item.result.cementBags}</span></div>
                                                        <div className="text-xs font-medium text-stone-600">Steel: <span className="font-bold text-stone-900">{item.result.steelKg}</span></div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 align-top text-right">
                                                    <div className="font-bold text-stone-900 text-sm">৳ {item.result.totalCost.toLocaleString()}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                         </div>
                     ))
                 )}
             </div>
             
             {/* Footer */}
             <div className="bg-stone-50 p-6 text-center text-stone-400 text-[10px] font-bold uppercase tracking-widest border-t border-stone-200">
                 Generated by ProBuild Estimator • {new Date().toLocaleDateString()}
             </div>
        </div>
    );
};

export const App: React.FC = () => {
  // --- State ---
  const [projects, setProjects] = useState<Project[]>([
    { 
      id: '1', 
      name: "Residential Villa", 
      version: "Rev-2", 
      lastModified: new Date(), 
      data: {},
      items: []
    }
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string>('1');
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.COLUMN_RECTANGULAR);
  const [focusedField, setFocusedField] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentItemName, setCurrentItemName] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // UI State
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false); // Mobile collapsible state
  const [currentView, setCurrentView] = useState<'dashboard' | 'estimator' | 'report'>('dashboard');

  // Derive active project
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const currentInputs = activeProject.data[activeModule]?.inputs || {};
  const currentResults = activeProject.data[activeModule]?.results || null;
  const projectGrandTotal = calculateGrandTotal(activeProject.items);
  
  // --- Auto-Naming Logic ---
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

  // Effect to update name
  useEffect(() => {
    if (!editingItemId) {
        const nextName = generateNextName(activeModule, activeProject.items);
        setCurrentItemName(nextName);
    }
    
    if (Object.keys(currentInputs).length === 0) {
        const defaults: Record<string, any> = {};
        MODULE_FIELDS[activeModule].forEach(f => defaults[f.key] = f.defaultValue);
        handleBatchInputChange(defaults);
    }
  }, [activeModule, activeProject.items.length, activeProjectId, editingItemId]);

  // --- Handlers ---
  const handleInputChange = (key: string, value: string, type?: string) => {
    let storedValue: number | string = value;
    if (type !== 'select') {
         const num = parseFloat(value);
         storedValue = isNaN(num) ? 0 : num;
    }

    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id !== activeProjectId) return p;
      const newData = { ...p.data };
      const currentModuleData = newData[activeModule] || { inputs: {}, results: null };
      const newInputs = { ...currentModuleData.inputs, [key]: storedValue };
      const results = calculateEstimation(activeModule, newInputs);
      newData[activeModule] = { inputs: newInputs, results };
      return { ...p, data: newData, lastModified: new Date() };
    }));
  };

  const handleBatchInputChange = (newValues: Record<string, any>) => {
    setProjects(prevProjects => prevProjects.map(p => {
        if (p.id !== activeProjectId) return p;
        const newData = { ...p.data };
        const results = calculateEstimation(activeModule, newValues);
        newData[activeModule] = { inputs: newValues, results };
        return { ...p, data: newData, lastModified: new Date() };
    }));
  };

  const handleSaveOrUpdate = () => {
      if (!currentResults) return;

      if (editingItemId) {
          // Update existing item
          setProjects(prev => prev.map(p => {
              if (p.id !== activeProjectId) return p;
              const updatedItems = p.items.map(it => {
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
              return { ...p, items: updatedItems, lastModified: new Date() };
          }));
          setEditingItemId(null);
      } else {
          // Add new item
          const name = currentItemName.trim() || generateNextName(activeModule, activeProject.items);
          const newItem: SavedItem = {
              id: Date.now().toString(),
              name,
              moduleType: activeModule,
              inputs: { ...currentInputs },
              result: { ...currentResults },
              timestamp: new Date()
          };

          setProjects(prev => prev.map(p => {
              if (p.id !== activeProjectId) return p;
              return { ...p, items: [newItem, ...p.items], lastModified: new Date() };
          }));
      }
      
      const defaults: Record<string, any> = {};
      MODULE_FIELDS[activeModule].forEach(f => defaults[f.key] = f.defaultValue);
      handleBatchInputChange(defaults);
      const nextName = generateNextName(activeModule, activeProject.items);
      setCurrentItemName(nextName);
      setEditingItemId(null);
  };

  const handleEditItem = (item: SavedItem) => {
      setActiveModule(item.moduleType);
      
      setProjects(prev => prev.map(p => {
          if (p.id !== activeProjectId) return p;
          const newData = { ...p.data };
          const results = calculateEstimation(item.moduleType, item.inputs);
          newData[item.moduleType] = { inputs: item.inputs, results };
          return { ...p, data: newData };
      }));

      setCurrentItemName(item.name);
      setEditingItemId(item.id);
      setIsListOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = (itemId: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id !== activeProjectId) return p;
          const newItems = p.items.filter(i => i.id !== itemId);
          return { ...p, items: newItems, lastModified: new Date() };
      }));
      if (editingItemId === itemId) {
          setEditingItemId(null);
      }
  };

  const handleResetInputs = () => {
      const defaults: Record<string, any> = {};
      MODULE_FIELDS[activeModule].forEach(f => defaults[f.key] = f.defaultValue);
      handleBatchInputChange(defaults);
      setEditingItemId(null);
      const nextName = generateNextName(activeModule, activeProject.items);
      setCurrentItemName(nextName);
  };

  const createProject = () => {
    const newProject: Project = {
        id: Date.now().toString(),
        name: `Project ${projects.length + 1}`,
        version: "v1.0",
        lastModified: new Date(),
        data: {},
        items: []
    };
    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
    setCurrentView('estimator'); 
    setIsSidebarOpen(false);
  };

  // Validation helper
  const getValidationError = (field: any, value: any): string | null => {
      if (field.type === 'select') return null;
      const val = value ?? field.defaultValue; 
      const numVal = Number(val);
      if (field.key === 'opening_deduction') return numVal < 0 ? "Cannot be negative" : null;
      if (numVal < 0) return "Cannot be negative";
      if (numVal === 0) return "Must be > 0";
      if (isNaN(numVal)) return "Invalid";
      return null;
  };
  
  const hasErrors = MODULE_FIELDS[activeModule].some(f => getValidationError(f, currentInputs[f.key]));

  // --- Components ---

  const ModuleSelectorModal = () => (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${isModuleSelectorOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setIsModuleSelectorOpen(false)} />
        <div className={`bg-[#F9F9F7] rounded-[2rem] shadow-2xl w-full max-w-lg relative overflow-hidden transform transition-all duration-300 ${isModuleSelectorOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
            <div className="p-8 border-b border-stone-200/50 flex justify-between items-center bg-white">
                <div>
                    <h3 className="text-xl font-bold text-stone-900 tracking-tight">Select Element</h3>
                    <p className="text-sm text-stone-500 font-medium">What are you estimating today?</p>
                </div>
                <button onClick={() => setIsModuleSelectorOpen(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#F9F9F7]">
                {Object.keys(ModuleType).map((key) => {
                    const isActive = activeModule === key;
                    return (
                        <button
                            key={key}
                            onClick={() => { setActiveModule(key as ModuleType); setIsModuleSelectorOpen(false); setEditingItemId(null); }}
                            className={`group flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all duration-200 text-center gap-3 relative overflow-hidden ${
                                isActive 
                                ? 'bg-white border-lime-400 shadow-xl shadow-lime-200/50' 
                                : 'bg-white border-transparent shadow-sm hover:border-lime-200 hover:shadow-md'
                            }`}
                        >
                           <div className={`p-3 rounded-2xl ${isActive ? 'bg-lime-400 text-stone-900' : 'bg-stone-100 text-stone-400 group-hover:bg-lime-50 group-hover:text-lime-600'} transition-colors`}>
                               {key.includes('COLUMN') && <BuildingOfficeIcon className="h-6 w-6" />}
                               {key.includes('BEAM') && <Squares2X2Icon className="h-6 w-6" />}
                               {key.includes('FOOTING') && <CubeIcon className="h-6 w-6" />}
                               {!key.includes('COLUMN') && !key.includes('BEAM') && !key.includes('FOOTING') && <Square3Stack3DIcon className="h-6 w-6" />}
                           </div>
                           <span className={`text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-stone-900' : 'text-stone-500'}`}>
                               {key.replace(/_/g, ' ')}
                           </span>
                        </button>
                    )
                })}
            </div>
        </div>
    </div>
  );

  const ProjectListModal = () => {
    const isVisible = isListOpen;
    return (
        <div className={`fixed inset-0 z-[70] flex flex-col transition-all duration-300 ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
             <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setIsListOpen(false)} />
             
             <div className={`bg-[#F9F9F7] w-full md:w-[600px] md:mx-auto md:my-auto md:rounded-[2.5rem] h-[85vh] md:h-[80vh] absolute bottom-0 md:relative flex flex-col shadow-2xl transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full md:translate-y-10'}`}>
                  {/* Header */}
                  <div className="px-6 py-5 bg-white border-b border-stone-100 flex justify-between items-center rounded-t-[2.5rem]">
                       <div>
                           <h3 className="text-xl font-bold text-stone-900">Estimation List</h3>
                           <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">{activeProject.items.length} Items Total</p>
                       </div>
                       <button onClick={() => setIsListOpen(false)} className="p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors">
                           <XMarkIcon className="h-6 w-6" />
                       </button>
                  </div>

                  {/* Scrollable List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-3">
                    {activeProject.items.length === 0 ? (
                        <div className="text-center py-16">
                            <DocumentPlusIcon className="h-12 w-12 mx-auto mb-3 text-stone-300" />
                            <p className="text-stone-400 font-medium">No items estimated yet.</p>
                        </div>
                    ) : (
                        activeProject.items.map(item => (
                            <div key={item.id} className={`group bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-3 ${editingItemId === item.id ? 'border-lime-500 ring-1 ring-lime-500' : 'border-stone-100'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="h-10 w-10 min-w-[2.5rem] rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-xs">
                                        {item.name.substring(0, 3)}
                                    </div>
                                    <div className="truncate">
                                        <div className="font-bold text-stone-900 truncate">{item.name}</div>
                                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{item.moduleType.replace(/_/g, ' ')}</div>
                                    </div>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                    <div className="font-black text-stone-900">৳ {item.result.totalCost.toLocaleString()}</div>
                                    <div className="flex justify-end gap-2 mt-1">
                                         <button onClick={() => handleEditItem(item)} className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg"><PencilSquareIcon className="h-4 w-4" /></button>
                                         <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                  </div>

                  {/* Footer Summary */}
                  <div className="p-6 bg-white border-t border-stone-100 rounded-b-[2.5rem] md:rounded-b-[2.5rem]">
                       <div className="flex justify-between items-center mb-4">
                           <span className="text-stone-500 font-bold text-sm">Grand Total</span>
                           <span className="text-2xl font-black text-lime-600">৳ {projectGrandTotal.totalCost.toLocaleString()}</span>
                       </div>
                       <button onClick={() => { setIsListOpen(false); setCurrentView('report'); }} className="w-full py-3.5 bg-stone-900 text-white font-bold rounded-2xl hover:bg-black transition-colors">
                           Generate Full Report
                       </button>
                  </div>
             </div>
        </div>
    );
  };

  const TopBar = () => {
    return (
        <div className="sticky top-0 z-30 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-[#F0F2F5]/90 backdrop-blur-md border-b border-white/50">
            {/* Left: Menu & Module Selector */}
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors shadow-sm">
                    <Bars3Icon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
                
                 {/* Desktop Nav */}
                 <div className="hidden lg:flex bg-white p-1 rounded-xl border border-stone-200 shadow-sm mr-4">
                    <button onClick={() => setCurrentView('dashboard')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${currentView === 'dashboard' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>Dashboard</button>
                    <button onClick={() => setCurrentView('estimator')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${currentView === 'estimator' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>Estimator</button>
                </div>

                {currentView === 'dashboard' ? (
                     <h1 className="lg:hidden text-lg md:text-xl font-bold text-stone-800 tracking-tight">Dashboard</h1>
                ) : (
                    <button 
                        onClick={() => setIsModuleSelectorOpen(true)}
                        className="group flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-white border border-stone-200 shadow-sm hover:shadow-md hover:border-lime-300 transition-all active:scale-95"
                    >
                        <div className={`h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center transition-colors shadow-inner ${editingItemId ? 'bg-amber-100 text-amber-600' : 'bg-lime-400 text-stone-900'}`}>
                            {activeModule.includes('COLUMN') && <BuildingOfficeIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                            {activeModule.includes('BEAM') && <Squares2X2Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                            {activeModule.includes('FOOTING') && <CubeIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                            {!activeModule.includes('COLUMN') && !activeModule.includes('BEAM') && !activeModule.includes('FOOTING') && <Square3Stack3DIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                        </div>

                        <div className="flex flex-col items-start text-left">
                            <span className="text-[8px] md:text-[9px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-0.5">
                                {editingItemId ? 'Editing' : 'Element'}
                            </span>
                            <span className="font-bold text-stone-800 text-xs md:text-sm tracking-tight leading-none max-w-[100px] md:max-w-[140px] truncate">
                                {activeModule.replace(/_/g, ' ')}
                            </span>
                        </div>
                        
                        <ChevronDownIcon className="h-3 w-3 md:h-4 md:w-4 text-stone-400 group-hover:text-stone-600 ml-0.5 transition-transform group-hover:rotate-180" />
                    </button>
                )}
            </div>

            {/* Right: Total Cost */}
            {currentView === 'estimator' && (
                <button 
                    onClick={() => setIsListOpen(true)}
                    className="flex flex-col items-end bg-white/50 hover:bg-white px-3 py-1 rounded-xl transition-all active:scale-95 border border-transparent hover:border-stone-200"
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Cost</span>
                        <div className="bg-lime-100 text-lime-700 px-1.5 rounded text-[10px] font-bold md:hidden">
                            {activeProject.items.length}
                        </div>
                    </div>
                    <div className="font-black text-stone-900 text-sm md:text-base leading-none mt-0.5">
                        ৳ {projectGrandTotal.totalCost.toLocaleString()}
                    </div>
                </button>
            )}
        </div>
    );
  };

  const EstimatorView = () => (
    <div className="max-w-[1600px] mx-auto h-full flex flex-col lg:flex-row-reverse lg:gap-6 relative">
        {/* RIGHT PANEL (Desktop): Visualizer */}
        <div className={`lg:w-1/2 xl:w-7/12 flex flex-col gap-6 lg:p-0 lg:pt-6 transition-all duration-300 ${isVisualizerOpen ? 'p-4' : 'p-0'}`}>
             
             {/* Mobile: Collapsible Trigger */}
             <div className="lg:hidden px-4 pt-4 pb-2">
                 <button 
                    onClick={() => setIsVisualizerOpen(!isVisualizerOpen)}
                    className="w-full flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm text-sm font-bold text-stone-600"
                 >
                     <span className="flex items-center gap-2">
                        {isVisualizerOpen ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        Geometry Preview
                     </span>
                     {isVisualizerOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                 </button>
             </div>

             {/* Visualizer Card (Hidden on mobile unless open, Always visible and large on Desktop) */}
             <div className={`${isVisualizerOpen ? 'block' : 'hidden'} lg:block bg-white lg:bg-transparent rounded-[2rem] border border-stone-200 lg:border-none shadow-sm lg:shadow-none overflow-hidden h-fit lg:h-full relative group mx-4 lg:mx-0`}>
                 <Visualizer type={activeModule} inputs={currentInputs} highlightKey={focusedField} />
             </div>
        </div>

        {/* LEFT PANEL (Desktop): Inputs */}
        <div className="lg:w-1/2 xl:w-5/12 flex flex-col h-full z-10 relative lg:static p-2 md:p-4 lg:p-0 pb-32 lg:pb-6 lg:pt-6">
             <div className={`bg-white rounded-[2.5rem] border shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] shadow-stone-200/40 flex flex-col overflow-hidden relative transition-all duration-300 ${editingItemId ? 'border-amber-400 ring-4 ring-amber-50' : 'border-stone-200'} min-h-[85vh] lg:h-full lg:min-h-0`}>
                 {/* Input Header */}
                 <div className="px-5 py-4 md:px-8 md:py-6 border-b border-stone-100 bg-white/80 backdrop-blur-sm z-10 flex justify-between items-center sticky top-0">
                    <div>
                        <div className="flex items-center gap-2">
                             <h2 className="text-xl font-bold text-stone-900 tracking-tight">{currentItemName}</h2>
                             {editingItemId && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase">Edit Mode</span>}
                        </div>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">Parameters for {activeModule.replace(/_/g, ' ').toLowerCase()}</p>
                    </div>
                    <button onClick={handleResetInputs} className="text-stone-400 hover:text-stone-900 p-2 rounded-full hover:bg-stone-100 transition-colors" title="Reset Inputs">
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                 </div>

                 {/* Scrollable Form Area */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                     <div className="grid grid-cols-2 gap-3 md:gap-4">
                         {MODULE_FIELDS[activeModule].map((field) => {
                             const error = getValidationError(field, currentInputs[field.key]);
                             return (
                                 <div key={field.key} className={`${field.fullWidth ? 'col-span-2' : 'col-span-1'} group`}>
                                     <div className="flex justify-between mb-2 px-1">
                                         <label className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${focusedField === field.highlightKey ? 'text-lime-600' : 'text-stone-400'}`}>
                                             {field.label}
                                         </label>
                                         {field.unit && <span className="text-[9px] font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">{field.unit}</span>}
                                     </div>
                                     
                                     {field.type === 'select' ? (
                                         <div className="relative">
                                             <select
                                                 value={currentInputs[field.key] || field.defaultValue}
                                                 onChange={(e) => handleInputChange(field.key, e.target.value, 'select')}
                                                 onFocus={() => setFocusedField(field.highlightKey)}
                                                 onBlur={() => setFocusedField(undefined)}
                                                 className="block w-full text-sm bg-stone-50 border border-stone-200 text-stone-900 rounded-2xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500 focus:bg-white p-3 md:p-4 appearance-none font-bold transition-all outline-none cursor-pointer hover:border-stone-300"
                                             >
                                                 {field.options?.map(opt => (
                                                     <option key={opt} value={opt}>{opt}</option>
                                                 ))}
                                             </select>
                                             <ChevronDownIcon className="absolute right-4 top-4.5 h-4 w-4 text-stone-400 pointer-events-none" />
                                         </div>
                                     ) : (
                                         <div className="relative">
                                             <input
                                                 type="number"
                                                 value={currentInputs[field.key] ?? ''}
                                                 onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                 onFocus={() => setFocusedField(field.highlightKey)}
                                                 onBlur={() => setFocusedField(undefined)}
                                                 placeholder={field.defaultValue.toString()}
                                                 className={`block w-full text-base bg-stone-50 border ${error ? 'border-red-300 ring-2 ring-red-50 focus:border-red-500' : 'border-stone-200 focus:border-lime-500 focus:ring-4 focus:ring-lime-50 focus:bg-white'} text-stone-900 rounded-2xl p-3 md:p-4 font-bold placeholder-stone-300 transition-all outline-none hover:border-stone-300`}
                                             />
                                         </div>
                                     )}
                                     {error && <p className="mt-1.5 text-[10px] text-red-500 font-bold flex items-center gap-1 ml-1">{error}</p>}
                                 </div>
                             );
                         })}
                     </div>
                 </div>

                 {/* Footer Action - One button visible */}
                 <div className="p-6 border-t border-stone-100 bg-white z-10">
                     <button 
                         onClick={handleSaveOrUpdate}
                         disabled={hasErrors || !currentResults}
                         className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg shadow-stone-200 transition-all active:scale-95 flex justify-center items-center gap-3 ${
                             editingItemId 
                             ? 'bg-stone-900 text-white hover:bg-black' 
                             : 'bg-lime-400 text-stone-900 hover:bg-lime-500'
                         } disabled:opacity-50 disabled:cursor-not-allowed`}
                     >
                         {editingItemId ? (
                             <>
                                 <CheckCircleIcon className="h-6 w-6" />
                                 Update Item
                             </>
                         ) : (
                             <>
                                 <PlusIcon className="h-6 w-6" />
                                 Add Estimation
                             </>
                         )}
                     </button>
                 </div>
             </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-stone-900 selection:bg-lime-200">
      {currentView === 'report' ? (
         <ReportView project={activeProject} total={projectGrandTotal} onBack={() => setCurrentView('estimator')} />
      ) : (
         <>
             <TopBar />
             <main className="h-[calc(100vh-60px)] md:h-[calc(100vh-70px)] overflow-hidden">
                 {currentView === 'dashboard' ? (
                     <div className="h-full overflow-y-auto custom-scrollbar">
                         <Dashboard />
                     </div>
                 ) : (
                     <EstimatorView />
                 )}
             </main>
             
             {/* Modals */}
             <ModuleSelectorModal />
             <ProjectListModal />
             
             {/* Mobile Sidebar */}
             <div className={`fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
             <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                  <div className="p-6">
                      <h2 className="text-xl font-black text-stone-900 mb-6">ProBuild</h2>
                      <div className="space-y-2">
                          <button onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }} className={`w-full text-left p-3 rounded-xl font-bold ${currentView === 'dashboard' ? 'bg-lime-400 text-stone-900' : 'text-stone-500 hover:bg-stone-50'}`}>Dashboard</button>
                          <button onClick={() => { setCurrentView('estimator'); setIsSidebarOpen(false); }} className={`w-full text-left p-3 rounded-xl font-bold ${currentView === 'estimator' ? 'bg-lime-400 text-stone-900' : 'text-stone-500 hover:bg-stone-50'}`}>Estimator</button>
                          <button onClick={() => { setCurrentView('report'); setIsSidebarOpen(false); }} className={`w-full text-left p-3 rounded-xl font-bold ${currentView === 'report' ? 'bg-lime-400 text-stone-900' : 'text-stone-500 hover:bg-stone-50'}`}>Report</button>
                      </div>
                  </div>
             </div>
         </>
      )}
    </div>
  );
};