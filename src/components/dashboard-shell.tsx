"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// --- Tipagens ---
type ApiState = { status: "loading" } | { status: "error"; message: string } | { status: "success"; data: any };

// --- Formatadores ---
const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const cf = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const cp = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

// --- Componente de Card de Métrica ---
function MetricCard({ label, value, hint }: any) {
  return (
    <article className="rounded-[1.5rem] border p-5 shadow-sm bg-white dark:bg-[#12241a] border-slate-200 dark:border-emerald-800/30 transition-all">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#7c4a03] dark:text-[#f8b93c]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#052e16] dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs font-bold text-slate-500 dark:text-emerald-300/40">{hint}</p>}
    </article>
  );
}

export function DashboardShell() {
  const [state, setState] = useState<ApiState>({ status: "loading" });
  const [isDark, setIsDark] = useState(false);
  const [hoverData, setHoverData] = useState<{label: string, value: number, x: number, y: number} | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setIsDark(saved);
    if (saved) document.documentElement.classList.add("dark");
    
    async function loadData() {
      try {
        const [s, w] = await Promise.all([fetch("/api/solar"), fetch("/api/weather")]);
        setState({ status: "success", data: { solar: await s.json(), weather: await w.json() } });
      } catch (e) { setState({ status: "error", message: "Erro na API" }); }
    }
    loadData();
  }, []);

  if (state.status !== "success") return <div className="p-20 text-center dark:bg-[#09120d] dark:text-white font-bold">Carregando dados interativos...</div>;

  const { solar, weather } = state.data;

  // --- Lógica do Gráfico SVG Interativo ---
  const points = solar.hourlyChart.map((p: any) => ({ label: p.timeLabel, value: p.powerKw }));
  const width = 800;
  const height = 250;
  const maxValue = Math.max(...points.map((p: any) => p.value), 1);
  const stepX = width / (points.length - 1);
  const svgPoints = points.map((p: any, i: number) => ({
    x: i * stepX,
    y: height - (p.value / maxValue) * (height - 60) - 30,
    ...p
  }));
  const d = svgPoints.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 transition-colors duration-300 dark:bg-[#09120d] sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col items-center justify-between gap-6 rounded-[2rem] bg-[#0d2a1d] p-6 shadow-xl md:flex-row border border-emerald-900">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-2"><Image src="/solee-logo.png" alt="Logo" width={50} height={50} /></div>
            <div>
              <h1 className="text-xl font-black text-white sm:text-2xl">Geração de Energia Solar</h1>
              <p className="text-xs text-emerald-400/60 font-bold uppercase tracking-widest">Dashboard em tempo real</p>
            </div>
          </div>
          <button onClick={() => {
            const next = !isDark;
            setIsDark(next);
            document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", next ? "dark" : "light");
          }} className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-xs font-black text-white">
            {isDark ? "MODO CLARO ☀️" : "MODO ESCURO 🌙"}
          </button>
        </header>

        {/* MÉTRICAS PRINCIPAIS */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Geração Hoje" value={nf.format(solar.summary.todayGenerationKwh) + " kWh"} hint={`Meta: ${nf.format(solar.summary.targetDailyKwh)} kWh`} />
          <MetricCard label="Geração Mensal" value={nf.format(solar.summary.monthlyGenerationKwh) + " kWh"} hint={`Mês: ${nf.format(solar.summary.monthlyGenerationKwh)}`} />
          <MetricCard label="Venda Hoje" value={cf.format(solar.summary.economyTodayBrl)} hint="Venda estimada hoje" />
          <MetricCard label="Performance" value={solar.summary.performancePct + "%"} hint={`Tarifa: ${cf.format(solar.summary.tariffKwhBrl)}/kWh`} />
        </section>

        {/* GRÁFICO INTERATIVO */}
        <section className="rounded-[2rem] bg-white dark:bg-[#102418] p-8 shadow-sm border border-slate-200 dark:border-emerald-900/30 relative">
          <h2 className="mb-6 text-xl font-black text-[#052e16] dark:text-white">Geração por hora</h2>
          <div className="relative h-[300px] w-full group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill="url(#grad)" className="opacity-30" />
              <path d={d} fill="none" stroke="#ff9d1c" strokeWidth="4" strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff9d1c" />
                  <stop offset="100%" stopColor="#ff9d1c" stopOpacity="0" />
                </linearGradient>
              </defs>
              {svgPoints.map((p: any, i: number) => (
                <circle key={i} cx={p.x} cy={p.y} r="15" fill="transparent" className="cursor-pointer" 
                  onMouseEnter={() => setHoverData(p)} onMouseLeave={() => setHoverData(null)} />
              ))}
            </svg>
            {/* Tooltip flutuante igual à imagem 2 */}
            {hoverData && (
              <div className="absolute z-10 p-3 rounded-xl bg-[#1a3022] border border-emerald-500 text-white shadow-2xl pointer-events-none"
                   style={{ left: `${(hoverData.x / width) * 100}%`, top: `${(hoverData.y / height) * 100 - 20}%`, transform: 'translateX(-50%)' }}>
                <p className="text-[10px] font-bold text-emerald-400">{hoverData.label}</p>
                <p className="text-lg font-black">{nf.format(hoverData.value)} kW</p>
                <p className="text-[9px] opacity-60">Geração nesta hora</p>
              </div>
            )}
          </div>
        </section>

        {/* VALOR ESTIMADO E STATUS INVERSORES */}
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white dark:bg-[#102418] p-8 border border-slate-200 dark:border-emerald-900/30">
              <h2 className="text-xl font-black mb-4">Valor estimado da energia gerada</h2>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-[#09120d] border border-emerald-100 dark:border-emerald-900/50 mb-6">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Tarifa: {cf.format(solar.summary.tariffKwhBrl)}/kWh</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10">
                   <p className="text-[9px] font-bold uppercase text-amber-700">Hoje</p>
                   <p className="text-sm font-black">{cf.format(solar.summary.economyTodayBrl)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10">
                   <p className="text-[9px] font-bold uppercase text-emerald-700">No Mês</p>
                   <p className="text-sm font-black">{cf.format(solar.summary.economyMonthBrl)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10">
                   <p className="text-[9px] font-bold uppercase text-blue-700">Total</p>
                   <p className="text-sm font-black">{cf.format(solar.summary.totalRevenueBrl)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white dark:bg-[#102418] p-8 border border-slate-200 dark:border-emerald-900/30">
            <h2 className="text-xl font-black mb-6">Status dos inversores</h2>
            <div className="space-y-4">
              {solar.inverters.map((inv: any) => (
                <div key={inv.id} className="p-5 rounded-3xl border border-slate-100 dark:border-[#1e3326] bg-slate-50 dark:bg-[#0d1a12]">
                  <div className="flex justify-between items-start mb-4">
                    <p className="font-black text-emerald-900 dark:text-white">{inv.name}</p>
                    <span className="px-3 py-1 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 uppercase">{inv.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-amber-100/30"><p className="text-[8px] uppercase text-amber-600">Potência</p><p className="font-bold text-xs">{inv.powerKw} kW</p></div>
                    <div className="p-2 rounded-xl bg-emerald-100/30"><p className="text-[8px] uppercase text-emerald-600">Hoje</p><p className="font-bold text-xs">{nf.format(inv.dayGenerationKwh)} kWh</p></div>
                    <div className="p-2 rounded-xl bg-blue-100/30"><p className="text-[8px] uppercase text-blue-600">Acumulado</p><p className="font-bold text-xs">{cp.format(inv.totalGenerationKwh)} kWh</p></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
