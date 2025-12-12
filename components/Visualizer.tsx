import React, { useMemo, useState } from 'react';
import { ModuleType } from '../types';
import { CubeIcon, Square2StackIcon } from '@heroicons/react/24/outline';

interface VisualizerProps {
  type: ModuleType;
  inputs: Record<string, number | string>;
  highlightKey?: string;
}

// --- Math Helpers ---
const ANGLE = Math.PI / 6; // 30 degrees
const COS30 = Math.cos(ANGLE);
const SIN30 = Math.sin(ANGLE);

interface Point { x: number; y: number; }

// Convert 3D (x,y,z) to 2D Iso Projection
const iso = (x: number, y: number, z: number): Point => ({
  x: (x - y) * COS30,
  y: (x + y) * SIN30 - z
});

// --- Drawing Component: Dimension Line ---
const DimensionLine = ({ 
  start, end, label, offset = 20, active = false 
}: { 
  start: Point, end: Point, label: string, offset?: number, active?: boolean 
}) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 5) return null;

  let nx = -dy / len;
  let ny = dx / len;
  
  // Extension Points
  const sX = start.x + nx * offset;
  const sY = start.y + ny * offset;
  const eX = end.x + nx * offset;
  const eY = end.y + ny * offset;
  
  const mx = (sX + eX) / 2;
  const my = (sY + eY) / 2;

  const lineColor = active ? "#65a30d" : "#a8a29e"; // Lime-600 vs Stone-400
  const textColor = active ? "#365314" : "#57534e"; 
  const textBg = active ? "#d9f99d" : "#f5f5f4";

  return (
    <g className="transition-all duration-500 ease-in-out" style={{ opacity: active ? 1 : 0.6 }}>
       <line x1={start.x} y1={start.y} x2={sX} y2={sY} stroke={lineColor} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5} />
       <line x1={end.x} y1={end.y} x2={eX} y2={eY} stroke={lineColor} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5} />
       <line x1={sX} y1={sY} x2={eX} y2={eY} stroke={lineColor} strokeWidth={active ? 2 : 1} />
       <circle cx={sX} cy={sY} r={active ? 2.5 : 1.5} fill={lineColor} />
       <circle cx={eX} cy={eY} r={active ? 2.5 : 1.5} fill={lineColor} />
       <rect x={mx - 18} y={my - 9} width="36" height="18" rx="9" fill={textBg} stroke={lineColor} strokeWidth={active ? 1.5 : 0.5} />
       <text x={mx} y={my} dy="1" textAnchor="middle" dominantBaseline="middle" fontSize={active ? "11" : "9"} fontWeight="bold" fill={textColor} style={{ pointerEvents: 'none' }}>
         {label}
       </text>
    </g>
  );
};

export const Visualizer: React.FC<VisualizerProps> = ({ type, inputs, highlightKey }) => {
  // Removed tab state, we will show both side by side

  // --- 1. Normalize Inputs ---
  const vals = useMemo(() => {
    const raw = (k: string, def: number) => {
        const v = inputs[k];
        if (typeof v === 'number' && v > 0) return v;
        if (typeof v === 'string') {
            const parsed = parseFloat(v);
            return isNaN(parsed) ? def : parsed;
        }
        return def;
    };
    
    // Default Dimensions (Inches unless specified)
    let l=0, w=0, h=0, d=0, labelL="L", labelW="B", labelH="H";
    let cover = raw('clear_cover', 1.5);
    let mainNos = Math.max(4, raw('main_rod_nos', 4));
    let spacing = raw('tie_spacing', 6) || raw('stirrup_spacing', 6) || raw('spiral_pitch', 6);
    let isVertical = false;

    switch (type) {
        case ModuleType.COLUMN_RECTANGULAR:
        case ModuleType.COLUMN_SHORT:
             l = raw('length', 12); 
             w = raw('width', 12);  
             h = raw('height', 10) * 12;
             labelL = `L: ${l}"`; labelW = `B: ${w}"`; labelH = `H: ${h/12}'`;
             isVertical = true;
             break;
        case ModuleType.COLUMN_CIRCULAR:
        case ModuleType.PILE:
             d = raw('diameter', 18);
             h = (raw('height', 0) || raw('length', 0)) * 12;
             labelL = `D: ${d}"`; labelH = `H: ${h/12}'`;
             isVertical = true;
             break;
        case ModuleType.BEAM:
             l = raw('length', 10) * 12;
             w = raw('width', 10);
             h = raw('depth', 12); 
             labelL = `L: ${l/12}'`; labelW = `B: ${w}"`; labelH = `D: ${h}"`;
             isVertical = false;
             break;
        case ModuleType.FOOTING_BOX:
             l = raw('length', 5) * 12;
             w = raw('breadth', 5) * 12;
             h = raw('thickness', 12);
             labelL = `L: ${l/12}'`; labelW = `B: ${w/12}'`; labelH = `T: ${h}"`;
             cover = 3;
             isVertical = false;
             break;
        case ModuleType.SLAB:
             l = 60; w = 60; h = raw('thickness', 6);
             labelL = "5'"; labelW = "5'"; labelH = `T: ${h}"`;
             isVertical = false;
             break;
        default:
             l = 30; w = 30; h = 30;
    }
    return { l, w, h, d, labelL, labelW, labelH, cover, mainNos, spacing, isVertical };
  }, [inputs, type]);

  // --- 2. Robust Auto-Scaling Engine ---
  const getViewTransform = (points: Point[], viewW: number, viewH: number, padding: number) => {
      if (points.length === 0) return { scale: 1, tx: viewW/2, ty: viewH/2, centerX: 0, centerY: 0 };

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      points.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
      });

      const w = maxX - minX;
      const h = maxY - minY;
      
      if (w === 0 || h === 0) return { scale: 1, tx: viewW/2, ty: viewH/2, centerX: 0, centerY: 0 };

      const scaleX = (viewW - padding * 2) / w;
      const scaleY = (viewH - padding * 2) / h;
      const scale = Math.min(scaleX, scaleY);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const tx = (viewW / 2) - (centerX * scale);
      const ty = (viewH / 2) - (centerY * scale);

      return { scale, tx, ty, centerX, centerY };
  };

  // --- 3. Focus Zoom Logic ---
  const getFocusTransform = (baseScale: number, baseTx: number, baseTy: number, viewW: number, viewH: number) => {
      let focusX = 0, focusY = 0, zoomLevel = 1, hasFocus = false;
      const { l, w, h, d } = vals;

      if (highlightKey) {
          if (highlightKey.includes('length') || highlightKey.includes('dia')) {
              if(d > 0) { const pt = iso(0,0, h); focusX = pt.x; focusY = pt.y; } 
              else { const pt = iso(l/2, 0, 0); focusX = pt.x; focusY = pt.y; } 
              zoomLevel = 1.5; hasFocus = true;
          } else if (highlightKey.includes('width') || highlightKey.includes('breadth')) {
               const pt = iso(0, w/2, 0); focusX = pt.x; focusY = pt.y;
               zoomLevel = 1.5; hasFocus = true;
          } else if (highlightKey.includes('height') || highlightKey.includes('depth') || highlightKey.includes('thick')) {
               const pt = iso(0, 0, h/2); focusX = pt.x; focusY = pt.y;
               zoomLevel = 1.4; hasFocus = true;
          }
      }

      if (!hasFocus) return { x: 0, y: 0, scale: 1 };
      
      const currentScreenX = focusX * baseScale + baseTx;
      const currentScreenY = focusY * baseScale + baseTy;
      const moveX = (viewW / 2) - currentScreenX;
      const moveY = (viewH / 2) - currentScreenY;

      return { x: moveX, y: moveY, scale: zoomLevel };
  };


  // --- 3D Calculation ---
  const transform3D = useMemo(() => {
      const { l, w, h, d } = vals;
      let points: Point[] = [];
      if (d > 0) {
          const r = d/2;
          for (let i = 0; i < 8; i++) {
              const theta = (i / 8) * Math.PI * 2;
              points.push(iso(r * Math.cos(theta) + r, r * Math.sin(theta) + r, 0)); 
              points.push(iso(r * Math.cos(theta) + r, r * Math.sin(theta) + r, h));
          }
      } else {
          points = [iso(0,0,0), iso(l,0,0), iso(0,w,0), iso(l,w,0), iso(0,0,h), iso(l,0,h), iso(0,w,h), iso(l,w,h)];
      }
      return getViewTransform(points, 300, 320, 40);
  }, [vals]);

  // --- 2D Calculation ---
  const transform2D = useMemo(() => {
      const { l, w, d } = vals;
      let points: Point[] = [];
      if (d > 0) { const r = d/2; points = [{x: -r, y: -r}, {x: r, y: r}]; } 
      else { points = [{x: 0, y: 0}, {x: l, y: w}]; }
      return getViewTransform(points, 300, 320, 60);
  }, [vals]);

  const focus3D = getFocusTransform(transform3D.scale, transform3D.tx, transform3D.ty, 300, 320);
  const getFocus2D = () => highlightKey ? { x: 0, y: 0, scale: 1.3 } : { x: 0, y: 0, scale: 1 };
  const focus2D = getFocus2D();

  // --- 3D Renderers ---

  const RenderRebar = () => {
      const { l, w, h, d, cover, spacing, mainNos, isVertical } = vals;
      const { scale: s, tx, ty } = transform3D;
      const toScreen = (p: Point) => ({ x: p.x * s + tx, y: p.y * s + ty });

      const barColor = "#dc2626"; // Red
      const tieColor = "#4b5563"; // Gray
      
      const elements: React.ReactElement[] = [];

      if (d > 0) {
          // --- Cylinder Rebar ---
          const r = d/2;
          const coreR = r - cover;
          
          // Main Bars
          for(let i=0; i<mainNos; i++) {
              const angle = (2 * Math.PI / mainNos) * i;
              const bx = coreR * Math.cos(angle);
              const by = coreR * Math.sin(angle);
              const p1 = toScreen(iso(bx + r, by + r, cover));
              const p2 = toScreen(iso(bx + r, by + r, h - cover));
              elements.push(<line key={`bar-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={barColor} strokeWidth={1.5} strokeLinecap="round" />);
          }

          // Spirals
          const numTies = Math.max(2, Math.floor((h - 2*cover) / spacing));
          for(let i=0; i<=numTies; i++) {
              const z = cover + i * spacing;
              const center = toScreen(iso(r, r, z));
              const rx = coreR * s;
              const ry = coreR * SIN30 * s;
              elements.push(<ellipse key={`tie-${i}`} cx={center.x} cy={center.y} rx={rx} ry={ry} fill="none" stroke={tieColor} strokeWidth={1} />);
          }
      } else {
          // --- Box Rebar ---
          const cl = l - 2*cover; // Core Length
          const cw = w - 2*cover; // Core Width
          const ch = h - 2*cover; // Core Height
          const ox = cover, oy = cover, oz = cover;

          if (isVertical) {
              // COLUMN: Main bars along Z
              const cornerCoords = [
                  {x: ox, y: oy}, {x: ox+cl, y: oy}, 
                  {x: ox+cl, y: oy+cw}, {x: ox, y: oy+cw}
              ];
              
              // Draw Corner Bars
              cornerCoords.forEach((c, idx) => {
                  const p1 = toScreen(iso(c.x, c.y, oz));
                  const p2 = toScreen(iso(c.x, c.y, oz+ch));
                  elements.push(<line key={`cbar-${idx}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={barColor} strokeWidth={2} />);
              });
              
              // Extra bars distribution
              if (mainNos > 4) {
                 const extra = mainNos - 4;
                 // Add to long sides
                 const midX = ox + cl/2;
                 const p1 = toScreen(iso(midX, oy, oz)); const p2 = toScreen(iso(midX, oy, oz+ch));
                 const p3 = toScreen(iso(midX, oy+cw, oz)); const p4 = toScreen(iso(midX, oy+cw, oz+ch));
                 elements.push(<line key="xbar-1" x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={barColor} strokeWidth={1.5} />);
                 elements.push(<line key="xbar-2" x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke={barColor} strokeWidth={1.5} />);
              }

              // Ties (XY Plane)
              const numTies = Math.max(2, Math.floor(ch / spacing));
              for(let i=0; i<=numTies; i++) {
                  const z = oz + i * spacing;
                  const pts = [
                      toScreen(iso(ox, oy, z)),
                      toScreen(iso(ox+cl, oy, z)),
                      toScreen(iso(ox+cl, oy+cw, z)),
                      toScreen(iso(ox, oy+cw, z))
                  ];
                  const d = `M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y} L${pts[2].x} ${pts[2].y} L${pts[3].x} ${pts[3].y} Z`;
                  elements.push(<path key={`tie-${i}`} d={d} fill="none" stroke={tieColor} strokeWidth={1} />);
              }

          } else {
              // BEAM / FOOTING: Main bars along X (Length)
              // Bars at corners of YZ plane
              const cornerCoords = [
                  {y: oy, z: oz}, {y: oy+cw, z: oz}, 
                  {y: oy+cw, z: oz+ch}, {y: oy, z: oz+ch}
              ];

              cornerCoords.forEach((c, idx) => {
                  const p1 = toScreen(iso(ox, c.y, c.z));
                  const p2 = toScreen(iso(ox+cl, c.y, c.z));
                  elements.push(<line key={`cbar-${idx}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={barColor} strokeWidth={2} />);
              });

              // Stirrups (YZ Plane)
              const numTies = Math.max(2, Math.floor(cl / spacing));
              for(let i=0; i<=numTies; i++) {
                  const x = ox + i * spacing;
                  const pts = [
                      toScreen(iso(x, oy, oz)),
                      toScreen(iso(x, oy+cw, oz)),
                      toScreen(iso(x, oy+cw, oz+ch)),
                      toScreen(iso(x, oy, oz+ch))
                  ];
                  const d = `M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y} L${pts[2].x} ${pts[2].y} L${pts[3].x} ${pts[3].y} Z`;
                  elements.push(<path key={`tie-${i}`} d={d} fill="none" stroke={tieColor} strokeWidth={1} />);
              }
          }
      }
      return <g>{elements}</g>;
  };

  const Render3DContent = () => {
      const { l, w, h, d, labelL, labelW, labelH } = vals;
      const { scale: s, tx, ty } = transform3D;
      const toScreen = (p: Point) => ({ x: p.x * s + tx, y: p.y * s + ty });

      // Highlight Logic
      const isH = highlightKey?.includes('height') || highlightKey?.includes('depth') || highlightKey?.includes('thick');
      const isL = highlightKey?.includes('len') || highlightKey?.includes('dia');
      const isW = highlightKey?.includes('width') || highlightKey?.includes('breadth');

      if (d > 0) { // Cylinder
          const r = d/2;
          const rx = r * s; const ry = r * SIN30 * s;
          const tc = iso(r, r, h); const bc = iso(r, r, 0);
          const S_tc = toScreen(tc); const S_bc = toScreen(bc);
          const S_tl = { x: S_tc.x - rx, y: S_tc.y }; const S_tr = { x: S_tc.x + rx, y: S_tc.y };
          const S_bl = { x: S_bc.x - rx, y: S_bc.y }; const S_br = { x: S_bc.x + rx, y: S_bc.y };

          return (
             <g>
                {/* Back / Inside */}
                <ellipse cx={S_bc.x} cy={S_bc.y} rx={rx} ry={ry} fill="#f5f5f4" stroke="#d6d3d1" />
                <RenderRebar />
                
                {/* Body (Glass Effect) */}
                <path d={`M${S_tl.x} ${S_tl.y} L${S_bl.x} ${S_bl.y} A ${rx} ${ry} 0 0 0 ${S_br.x} ${S_br.y} L${S_tr.x} ${S_tr.y}`} fill="url(#concrete-grad)" stroke="#a8a29e" strokeWidth="1" className="opacity-30" />
                <ellipse cx={S_tc.x} cy={S_tc.y} rx={rx} ry={ry} fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1" className="opacity-40" />

                <DimensionLine start={{x: S_br.x, y: S_br.y}} end={{x: S_tr.x, y: S_tr.y}} label={labelH} offset={30} active={isH} />
                <line x1={S_tl.x} y1={S_tc.y} x2={S_tr.x} y2={S_tc.y} stroke={isL ? "#65a30d" : "#a8a29e"} strokeDasharray="2,2" strokeWidth={isL?2:1} />
                <text x={S_tc.x} y={S_tc.y - 12} textAnchor="middle" fontSize={isL?14:10} fontWeight="bold" fill={isL ? "#365314" : "#57534e"}>{labelL}</text>
             </g>
          )
      } else { // Box
          const p0 = iso(0,0,0); const px = iso(l,0,0); const py = iso(0,w,0); const pxy = iso(l,w,0);
          const p0t = iso(0,0,h); const pxt = iso(l,0,h); const pyt = iso(0,w,h); const pxyt = iso(l,w,h);

          const S0 = toScreen(p0); const SX = toScreen(px); const SY = toScreen(py); const SXY = toScreen(pxy);
          const S0t = toScreen(p0t); const SXt = toScreen(pxt); const SYt = toScreen(pyt); const SXYt = toScreen(pxyt);

          return (
              <g>
                  {/* Back Faces */}
                  <path d={`M${SY.x} ${SY.y} L${SXY.x} ${SXY.y} L${SXYt.x} ${SXYt.y} L${SYt.x} ${SYt.y} Z`} fill="#f5f5f4" stroke="#e5e7eb" strokeDasharray="2,2" />
                  <path d={`M${SXY.x} ${SXY.y} L${SX.x} ${SX.y} L${SXt.x} ${SXt.y} L${SXYt.x} ${SXYt.y} Z`} fill="#f5f5f4" stroke="#e5e7eb" strokeDasharray="2,2" />

                  <RenderRebar />

                  {/* Front Faces (Glass Effect) */}
                  <path d={`M${S0.x} ${S0.y} L${SY.x} ${SY.y} L${SYt.x} ${SYt.y} L${S0t.x} ${S0t.y} Z`} fill="url(#concrete-grad)" stroke="#a8a29e" className="opacity-30" />
                  <path d={`M${S0.x} ${S0.y} L${SX.x} ${SX.y} L${SXt.x} ${SXt.y} L${S0t.x} ${S0t.y} Z`} fill="url(#concrete-grad)" stroke="#a8a29e" className="opacity-30" />
                  <path d={`M${S0t.x} ${S0t.y} L${SXt.x} ${SXt.y} L${SXYt.x} ${SXYt.y} L${SYt.x} ${SYt.y} Z`} fill="#e7e5e4" stroke="#a8a29e" className="opacity-40" />

                  <DimensionLine start={S0} end={S0t} label={labelH} offset={-30} active={isH} />
                  <DimensionLine start={S0} end={SX} label={labelL} offset={30} active={isL} />
                  <DimensionLine start={S0} end={SY} label={labelW} offset={-30} active={isW} />
              </g>
          )
      }
  };

  const Render2DContent = () => {
      const { l, w, d, mainNos, cover } = vals;
      const { scale: s, tx, ty } = transform2D;
      const barColor = "#1f2937"; // Dark Gray for 2D Section
      
      if (d > 0) {
          const r = (d/2) * s;
          const rCore = (d/2 - cover) * s;
          return (
              <g>
                  <circle cx={tx} cy={ty} r={r} fill="#e5e7eb" stroke="#374151" strokeWidth="2" />
                  <circle cx={tx} cy={ty} r={r * 0.75} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3" />
                  {/* Generate 2D Bars */}
                  {Array.from({length: mainNos}).map((_, i) => {
                      const ang = (i * 2 * Math.PI) / mainNos;
                      return <circle key={i} cx={tx + rCore*Math.cos(ang)} cy={ty + rCore*Math.sin(ang)} r={3} fill={barColor} />
                  })}
                  <text x={tx} y={ty + r + 20} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">CROSS SECTION</text>
              </g>
          )
      } else {
          const W = l * s;
          const H = w * s;
          const cx = tx + W/2;
          const cy = ty + H/2;
          const coreW = W - 2*cover*s;
          const coreH = H - 2*cover*s;
          
          return (
              <g>
                  <rect x={tx} y={ty} width={W} height={H} fill="#e5e7eb" stroke="#374151" strokeWidth="2" />
                  <rect x={tx+cover*s} y={ty+cover*s} width={coreW} height={coreH} fill="none" stroke="#ef4444" strokeWidth="1.5" rx="2" />
                  
                  {/* Corner Bars */}
                  <circle cx={tx+cover*s} cy={ty+cover*s} r={3} fill={barColor} />
                  <circle cx={tx+W-cover*s} cy={ty+cover*s} r={3} fill={barColor} />
                  <circle cx={tx+W-cover*s} cy={ty+H-cover*s} r={3} fill={barColor} />
                  <circle cx={tx+cover*s} cy={ty+H-cover*s} r={3} fill={barColor} />

                  {/* Extra Bars */}
                  {mainNos > 4 && (
                      <>
                        <circle cx={tx+W/2} cy={ty+cover*s} r={3} fill={barColor} />
                        <circle cx={tx+W/2} cy={ty+H-cover*s} r={3} fill={barColor} />
                      </>
                  )}

                  <text x={tx + W/2} y={ty + H + 20} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">CROSS SECTION</text>
              </g>
          )
      }
  };

  return (
    <div className="w-full bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[200px] sm:h-[280px] md:h-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
             <div className="flex items-center gap-2">
                 <CubeIcon className="w-5 h-5 text-stone-400" />
                 <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Geometry Preview</span>
             </div>
        </div>

        {/* Content: Both 3D and 2D side-by-side */}
        <div className="flex-1 flex flex-row">
            {/* Left Side: 3D */}
            <div className="flex-1 relative border-r border-stone-100">
                 <div className="absolute top-4 left-4 z-10 p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <CubeIcon className="w-4 h-4" />
                 </div>
                 <svg width="100%" height="100%" viewBox="0 0 300 320" className="w-full h-full overflow-visible">
                     <defs>
                        <pattern id="grid-3d" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                        </pattern>
                        <linearGradient id="concrete-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f5f5f4" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#d6d3d1" stopOpacity="0.8" />
                        </linearGradient>
                     </defs>
                     <rect width="100%" height="100%" fill="url(#grid-3d)" />
                     
                     <g className="transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)" style={{ transform: `translate(${focus3D.x}px, ${focus3D.y}px) scale(${focus3D.scale})`, transformOrigin: 'center' }}>
                         <Render3DContent />
                     </g>
                 </svg>
            </div>

            {/* Right Side: 2D */}
            <div className="flex-1 relative">
                 <div className="absolute top-4 left-4 z-10 p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Square2StackIcon className="w-4 h-4" />
                 </div>
                 <svg width="100%" height="100%" viewBox="0 0 300 320" className="w-full h-full overflow-visible">
                     <defs>
                        <pattern id="grid-2d" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                        </pattern>
                     </defs>
                     <rect width="100%" height="100%" fill="url(#grid-2d)" />
                     
                     <g className="transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)" style={{ transform: `translate(${focus2D.x}px, ${focus2D.y}px) scale(${focus2D.scale})`, transformOrigin: 'center' }}>
                        <Render2DContent />
                     </g>
                 </svg>
            </div>
        </div>
    </div>
  );
};