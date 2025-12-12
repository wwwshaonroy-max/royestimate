import React from 'react';
import { EstimationResult } from '../types';
import { CubeIcon, Square2StackIcon, CircleStackIcon, BoltIcon } from '@heroicons/react/24/outline';

interface ResultsCardProps {
  result: EstimationResult | null;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({ result }) => {
  if (!result) return (
    <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center h-48">
        <div className="bg-gray-50 p-3 rounded-full mb-3">
            <CalculatorIcon className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">Enter parameters to generate estimate</p>
    </div>
  );

  const materials = [
      { label: 'Cement', qty: result.cementBags, unit: 'Bags', icon: CubeIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Sand', qty: result.sandCft, unit: 'cft', icon: Square2StackIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Aggregate', qty: result.aggregateCft, unit: 'cft', icon: CircleStackIcon, color: 'text-slate-600', bg: 'bg-slate-50' },
      { label: 'Steel', qty: result.steelKg, unit: 'kg', icon: BoltIcon, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-white px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                Estimate Result
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">Includes standard wastage factors</p>
          </div>
          <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Approx. Cost</p>
              <div className="text-xl font-black text-emerald-600 tracking-tight leading-none">
                  ৳ {result.totalCost.toLocaleString()}
              </div>
          </div>
      </div>
      
      {/* Material Grid */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {materials.map((item, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 bg-white shadow-sm transition-transform hover:scale-[1.02]">
                  <div className={`p-2 rounded-lg ${item.bg} ${item.color} mb-2`}>
                      <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{item.label}</span>
                  <span className="font-bold text-gray-900 text-lg leading-tight">
                      {item.qty} <span className="text-[10px] font-medium text-gray-400">{item.unit}</span>
                  </span>
              </div>
          ))}
      </div>
    </div>
  );
};

function CalculatorIcon({className}: {className?: string}) {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5a2.25 2.25 0 0 1 2.25 2.25v12a2.25 2.25 0 0 1-2.25 2.25H8.25a2.25 2.25 0 0 1-2.25-2.25V8.25A2.25 2.25 0 0 1 8.25 6Z" />
    </svg>
}
