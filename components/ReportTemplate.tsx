import React from 'react';
import { Project, EstimationResult } from '../types';
import { calculateGrandTotal, getModuleCategory } from '../services/calculator';
import { DEFAULT_CONFIG } from '../constants';
import { Printer } from 'lucide-react';

interface ReportTemplateProps {
  project: Project;
  onBack: () => void;
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({ project, onBack }) => {
  const grandTotal = calculateGrandTotal(project.items);
  
  // Group items by category
  const groupedItems = project.items.reduce((acc, item) => {
      const cat = getModuleCategory(item.moduleType);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
  }, {} as Record<string, typeof project.items>);

  const handlePrint = () => {
      window.print();
  };

  const categories = ['Foundation Work', 'Structural Concrete', 'Finishing Works', 'Other'];

  return (
    <div id="report-container" className="bg-white min-h-screen text-black font-serif pb-20">
        {/* Navigation Bar (Hidden in Print) */}
        <div className="print:hidden bg-stone-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
            <button onClick={onBack} className="text-sm font-sans text-gray-300 hover:text-white">
                &larr; Back to Dashboard
            </button>
            <h2 className="text-lg font-bold font-sans">Print Preview</h2>
            <button 
                onClick={handlePrint}
                className="bg-[#007aff] hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-sans text-sm font-medium transition-colors"
            >
                <Printer className="w-4 h-4" /> Print PDF
            </button>
        </div>

        {/* Report Content */}
        <div className="max-w-[210mm] mx-auto p-8 md:p-12 print:p-0 print:max-w-none">
            
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">Estimation Report</h1>
                    <div className="text-sm text-gray-600">
                        <p><strong>Project:</strong> {project.name}</p>
                        <p><strong>Version:</strong> {project.version}</p>
                        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-xl font-bold">ProBuild Estimator</h3>
                    <p className="text-xs text-gray-500 mt-1">Professional Engineering Suite</p>
                </div>
            </div>

            {/* Grand Summary */}
            <div className="mb-10 p-6 bg-gray-50 border border-gray-200 rounded-xl print:border-black print:bg-transparent print:p-0 print:rounded-none">
                <h3 className="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-2">Material Summary</h3>
                <div className="grid grid-cols-4 gap-6 text-center print:grid-cols-4 print:text-left">
                    <div>
                        <span className="block text-xs text-gray-500 uppercase font-bold">Cement</span>
                        <span className="text-xl font-bold block">{Math.ceil(grandTotal.cementBags)} <small className="text-sm font-normal">Bags</small></span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500 uppercase font-bold">Sand</span>
                        <span className="text-xl font-bold block">{Math.ceil(grandTotal.sandCft)} <small className="text-sm font-normal">cft</small></span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500 uppercase font-bold">Aggregate</span>
                        <span className="text-xl font-bold block">{Math.ceil(grandTotal.aggregateCft)} <small className="text-sm font-normal">cft</small></span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500 uppercase font-bold">Steel</span>
                        <span className="text-xl font-bold block">{Math.ceil(grandTotal.steelKg)} <small className="text-sm font-normal">kg</small></span>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-300 flex justify-between items-center">
                    <span className="font-bold text-gray-600 uppercase">Estimated Project Cost</span>
                    <span className="text-3xl font-black">৳ {grandTotal.totalCost.toLocaleString()}</span>
                </div>
            </div>

            {/* Detailed Tables */}
            {categories.map(cat => {
                const items = groupedItems[cat];
                if (!items || items.length === 0) return null;

                return (
                    <div key={cat} className="mb-8 break-inside-avoid">
                        <h3 className="text-md font-bold bg-black text-white px-3 py-1 uppercase tracking-wider mb-2 print:text-black print:bg-transparent print:border-b-2 print:border-black print:pl-0">{cat}</h3>
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-400">
                                    <th className="py-2 font-bold w-[30%]">Item Name</th>
                                    <th className="py-2 font-bold w-[35%]">Details / Dimensions</th>
                                    <th className="py-2 font-bold text-right">Materials</th>
                                    <th className="py-2 font-bold text-right">Cost (৳)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-gray-200 print:border-gray-300">
                                        <td className="py-3 pr-2 align-top">
                                            <div className="font-bold">{item.name}</div>
                                            <div className="text-xs text-gray-500">{item.moduleType.replace(/_/g, ' ')}</div>
                                        </td>
                                        <td className="py-3 pr-2 align-top text-xs text-gray-700">
                                            {item.result.details.map((d, i) => <div key={i}>{d}</div>)}
                                        </td>
                                        <td className="py-3 text-right align-top text-xs text-gray-700 whitespace-nowrap">
                                            {item.result.cementBags > 0 && <div>{item.result.cementBags} Bags C.</div>}
                                            {item.result.steelKg > 0 && <div>{item.result.steelKg} kg Steel</div>}
                                            {item.result.aggregateCft > 0 && <div>{item.result.aggregateCft} cft Agg.</div>}
                                        </td>
                                        <td className="py-3 text-right font-bold align-top">
                                            {item.result.totalCost.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            })}

            {/* Rates Footnote */}
            <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-gray-500">
                <p><strong>Basis of Rates:</strong> Cement: ৳{DEFAULT_CONFIG.rates.cement}/bag, Sand: ৳{DEFAULT_CONFIG.rates.sand}/cft, Aggregate: ৳{DEFAULT_CONFIG.rates.aggregate}/cft, Steel: ৳{DEFAULT_CONFIG.rates.steel}/kg.</p>
                <p className="mt-1">Note: This is a computer-generated estimate. Actual costs may vary based on site conditions and market fluctuations.</p>
            </div>

        </div>

        <style>{`
            @media print {
                body { background: white; -webkit-print-color-adjust: exact; }
                .print\\:hidden { display: none !important; }
                .print\\:p-0 { padding: 0 !important; }
                .print\\:bg-transparent { background: transparent !important; }
                .print\\:text-black { color: black !important; }
                .print\\:border-black { border-color: black !important; }
                .print\\:rounded-none { border-radius: 0 !important; }
                .break-inside-avoid { page-break-inside: avoid; }
            }
        `}</style>
    </div>
  );
};