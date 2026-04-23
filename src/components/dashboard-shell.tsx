"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// --- Tipagens e Formatadores ---
type ApiState = { status: "loading" } | { status: "error"; message: string } | { status: "success"; data: any };
const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const cf = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const cp = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

function MetricCard({ label, value, hint }: any) {
  return (
    <article className="rounded-[1.5rem] border p-5 shadow-sm bg-white dark:bg-[#12241a] border-slate-200 dark:border-emerald-800/30">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#7c4a03] dark:text-[#f8b93c]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#052e16] dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs font-bold text-slate-500 dark:text-emerald-300/40">{hint}</p>}
    </article>
  );
}

export function DashboardShell() {
  const [state, setState] = useState<ApiState>({ status: "loading" });
  const [isDark, setIsDark] = useState(false);
  const [hoverData, setHoverData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setIsDark(saved);
    if (saved) document.documentElement.classList.add("dark");
    
    async function loadData() {
      try {
        const [s, w] = await Promise.all([fetch("/api/solar"), fetch("/api/weather")]);
        const sData = await s.json();
        const wData = await w.json();
        setState({ status: "success", data: { solar: sData, weather: wData } });
      } catch (e) { 
        setState({ status: "error", message: "Erro ao carregar dados da API." }); 
      }
    }
    loadData();
  }, []);

  if (state.status === "loading") return <div className="flex min-h-screen items-center justify-center dark:bg-[#060d09] dark:text-white font-black animate-pulse uppercase">Sincronizando Usina Solar...</div>;
  if (state.status === "error") return <div className="flex min-h-screen items-center justify-center text-red-500 font-black">{state.message}</div>;

  const { solar, weather } = state.data;
  const summary = solar?.summary || {};
  const hourlyData = solar?.hourlyChart || [];
  const inverters = solar?.inverters || [];
  const dailyHistory = solar?.dailyHistory || solar?.history || [];

  // --- Gráfico: Soma de todos os inversores por hora ---
  const width = 1000;
  const height = 300;
  const points = hourlyData.map((p: any) => ({ 
    label: p.timeLabel, 
    value: p.powerKw // A API já deve retornar o total, ou aqui somaríamos caso houvesse arrays múltiplos
  }));
  const maxValue = Math.max(...points.map((p: any) => p.value), 1);
  const stepX = width / (points.length > 1 ? points.length - 1 : 1);
  const svgPoints = points.map((p: any, i: number) => ({
    x: i * stepX,
    y: height - (p.value / maxValue) * (height - 80) - 40,
    ...p
  }));
  const lineD = svgPoints.length > 0 ? svgPoints.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : "";

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 transition-colors duration-300 dark:bg-[#060d09] sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col items-center justify-between gap-6 rounded-[2.5rem] bg-[#0d2a1d] p-8 shadow-2xl md:flex-row border border-emerald-900/50">
          <div className="flex items-center gap-5">
            <div className="rounded-2xl bg-white p-3 shadow-lg"><Image src="/solee-logo.png" alt="Logo" width={60} height={60} priority /></div>
            <div>
              <h1 className="text-2xl font-black text-white sm:text-3xl">Geração de Energia Solar</h1>
              <p className="text-xs text-emerald-100/40 font-medium">Usina Maravilha-AL | Soma Total de {inverters.length} Inversores</p>
            </div>
          </div>
          <button onClick={() => {
            const next = !isDark;
            setIsDark(next);
            document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", next ? "dark" : "light");
          }} className="rounded-2xl border border-white/10 bg-white/5 px-8 py-3 text-[10px] font-black text-white uppercase tracking-widest">
            {isDark ? "MODO CLARO ☀️" : "MODO ESCURO 🌙"}
          </button>
        </header>

        {/* 8 CARDS DE MÉTRICAS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Geração Hoje" value={nf.format(summary.todayGenerationKwh || 0) + " kWh"} hint={`Meta: ${nf.format(summary.targetDailyKwh || 0)} kWh`} />
          <MetricCard label="Geração Mensal" value={nf.format(summary.monthlyGenerationKwh || 0) + " kWh"} hint="Meta: 50.000 kWh" />
          <MetricCard label="Venda Hoje" value={cf.format((summary.todayGenerationKwh || 0) * 0.7)} hint="Venda estimada hoje" />
          <MetricCard label="Performance" value={(summary.performancePct || 0) + "%"} hint="Eficiência Combinada" />
          <MetricCard label="Potência Atual" value={nf.format(summary.currentPowerKw || 0) + " kW"} hint="Soma de todos inversores" />
          <MetricCard label="Status da Usina" value={summary.statusLabel || "Online"} hint={summary.location} />
          <MetricCard label="Venda Total" value={cf.format(summary.totalRevenueBrl || 0)} hint="Acumulado Histórico" />
          <MetricCard label="Última Leitura" value={new Date().toLocaleTimeString()} hint="Dados via Backend" />
        </section>

        {/* GRÁFICO SOMA TOTAL POR HORA */}
        <section className="rounded-[2.5rem] bg-white dark:bg-[#0f1d15] p-8 shadow-sm border border-slate-200 dark:border-emerald-900/30 relative">
          <div className="mb-8">
            <h2 className="text-xl font-black text-[#052e16] dark:text-white">Geração total por hora (Usina)</h2>
            <p className="text-xs text-slate-500 dark:text-emerald-400/50 font-bold">Valores consolidados de todos os equipamentos.</p>
          </div>
          <div className="relative h-[300px] w-full">
            {svgPoints.length > 0 && (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <path d={`${lineD} L ${width} ${height} L 0 ${height} Z`} fill="url(#sun-grad)" className="opacity-40" />
                <path d={lineD} fill="none" stroke="#f8b93c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="sun-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f8b93c" /><stop offset="100%" stopColor="#f8b93c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {svgPoints.map((p: any, i: number) => (
                  <rect key={i} x={p.x - 15} y="0" width="30" height={height} fill="transparent" className="cursor-pointer" 
                    onMouseEnter={() => setHoverData(p)} onMouseLeave={() => setHoverData(null)} />
                ))}
              </svg>
            )}
            {hoverData && (
              <div className="absolute z-20 p-4 rounded-2xl bg-[#0d1a12] border-2 border-amber-500 text-white shadow-2xl pointer-events-none"
                   style={{ left: `${(hoverData.x / width) * 100}%`, top: `${(hoverData.y / height) * 100 - 40}%`, transform: 'translateX(-50%)' }}>
                <p className="text-[10px] font-black text-amber-400 uppercase">{hoverData.label}</p>
                <p className="text-2xl font-black">{nf.format(hoverData.value)} kW</p>
                <p className="text-[9px] opacity-60 font-bold">Produção Total Combinada</p>
              </div>
            )}
          </div>
        </section>

        {/* TABELA DE COMPARAÇÃO */}
        <section className="rounded-[2.5rem] bg-white dark:bg-[#0f1d15] p-8 border border-slate-200 dark:border-emerald-900/30 overflow-hidden">
          <h2 className="text-xl font-black mb-6 dark:text-white">Comparação diária (Últimos 7 dias)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-emerald-900/30 text-[10px] font-black uppercase text-slate-400">
                  <th className="pb-4">Data</th>
                  <th className="pb-4">Produção Total</th>
                  <th className="pb-4">Venda Estimada</th>
                  <th className="pb-4">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-emerald-900/10">
                {dailyHistory.map((day: any, i: number) => {
                  const val = day.kwh || day.generationKwh || 0;
                  const prevVal = dailyHistory[i+1]?.kwh || dailyHistory[i+1]?.generationKwh || val;
                  const variation = prevVal !== 0 ? ((val - prevVal) / prevVal) * 100 : 0;
                  return (
                    <tr key={i} className="dark:text-white hover:bg-slate-50/50 dark:hover:bg-emerald-900/5 transition-colors">
                      <td className="py-4 text-sm font-bold">{day.date || day.label}</td>
                      <td className="py-4 text-sm font-black">{nf.format(val)} kWh</td>
                      <td className="py-4 text-sm font-black text-emerald-600 dark:text-emerald-400">{cf.format(val * 0.7)}</td>
                      <td className={`py-4 text-xs font-black ${variation >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {variation > 0 ? '▲' : '▼'} {Math.abs(variation).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* VALOR ESTIMADO */}
          <section className="rounded-[2.5rem] bg-white dark:bg-[#0f1d15] p-8 border border-slate-200 dark:border-emerald-900/30 text-center">
            <h2 className="text-xl font-black mb-6 dark:text-white">Valor estimado da Usina</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100/50">
                <p className="text-[9px] font-black uppercase text-amber-700">Hoje</p>
                <p className="text-lg font-black">{cf.format((summary.todayGenerationKwh || 0) * 0.7)}</p>
              </div>
              <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100/50">
                <p className="text-[9px] font-black uppercase text-emerald-700">No Mês</p>
                <p className="text-lg font-black">{cf.format((summary.monthlyGenerationKwh || 0) * 0.7)}</p>
              </div>
              <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100/50">
                <p className="text-[9px] font-black uppercase text-blue-700">Total</p>
                <p className="text-lg font-black">{cf.format(summary.totalRevenueBrl || 0)}</p>
              </div>
            </div>
          </section>

          {/* PREVISÃO DO TEMPO - HOJE, AMANHÃ, DEPOIS */}
          <section className="rounded-[2.5rem] bg-[#09120d] p-8 text-white border border-emerald-900/50 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">Clima em Maravilha, AL</p>
              <p className="text-[10px] font-bold text-white/40">Atualizado {new Date().toLocaleDateString()}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* HOJE */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-amber-400 uppercase mb-2">Hoje</p>
                <p className="text-3xl font-black">{weather?.current?.temp || "24"}°</p>
                <p className="text-[10px] font-bold mt-1 opacity-80">{weather?.current?.condition || "Limpo"}</p>
                <p className="text-[8px] mt-2 opacity-50">Vento: {weather?.current?.windSpeed}</p>
              </div>
              {/* AMANHÃ */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-emerald-400 uppercase mb-2">Amanhã</p>
                <p className="text-3xl font-black">{weather?.forecast?.[0]?.max || "26"}°</p>
                <p className="text-[10px] font-bold mt-1 opacity-80">{weather?.forecast?.[0]?.condition || "Parcial"}</p>
                <p className="text-[8px] mt-2 opacity-50">Min: {weather?.forecast?.[0]?.min}°</p>
              </div>
              {/* DEPOIS DE AMANHÃ */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-emerald-400 uppercase mb-2">Próximo</p>
                <p className="text-3xl font-black">{weather?.forecast?.[1]?.max || "27"}°</p>
                <p className="text-[10px] font-bold mt-1 opacity-80">{weather?.forecast?.[1]?.condition || "Sol"}</p>
                <p className="text-[8px] mt-2 opacity-50">Min: {weather?.forecast?.[1]?.min}°</p>
              </div>
            </div>
          </section>
        </div>

        {/* STATUS DOS INVERSORES INDIVIDUAIS */}
        <section className="rounded-[2.5rem] bg-white dark:bg-[#0f1d15] p-8 border border-slate-200 dark:border-emerald-900/30">
          <h2 className="text-xl font-black mb-8 dark:text-white">Status dos inversores individuais</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {inverters.map((inv: any) => (
              <div key={inv.id} className="rounded-[2rem] bg-slate-50 dark:bg-[#0d1a12] p-6 border border-slate-100 dark:border-emerald-900/20">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-lg font-black dark:text-white uppercase tracking-tight">{inv.name}</p>
                    <p className="text-[9px] font-mono opacity-40">{inv.serial || "SN-USINA-001"}</p>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${inv.status === 'Online' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{inv.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-black">
                  <div className="bg-white dark:bg-[#09120d] p-3 rounded-2xl border border-slate-100 dark:border-white/5"><p className="uppercase text-slate-400">Potência</p><p className="text-sm dark:text-white">{inv.powerKw} kW</p></div>
                  <div className="bg-white dark:bg-[#09120d] p-3 rounded-2xl border border-slate-100 dark:border-white/5"><p className="uppercase text-slate-400">Hoje</p><p className="text-sm dark:text-white">{nf.format(inv.dayGenerationKwh)}</p></div>
                  <div className="bg-white dark:bg-[#09120d] p-3 rounded-2xl border border-slate-100 dark:border-white/5"><p className="uppercase text-slate-400">Total</p><p className="text-sm dark:text-white">{cp.format(inv.totalGenerationKwh)}</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
