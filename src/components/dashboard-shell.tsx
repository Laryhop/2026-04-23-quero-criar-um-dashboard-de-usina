"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// --- Tipagens ---
type ApiState = 
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: any };

// --- Formatadores ---
const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const compactNumberFormatter = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

function formatKwh(value: number) { return `${numberFormatter.format(value)} kWh`; }
function formatKw(value: number) { return `${numberFormatter.format(value)} kW`; }
function formatCurrency(value: number) { return currencyFormatter.format(value); }

// --- Sub-componentes ---
function MetricCard({ label, value, hint, accent = "from-[#fff6d8] to-white" }: any) {
  return (
    <article className={`rounded-[1.8rem] border border-[#f0d9a2] bg-gradient-to-br ${accent} p-5 shadow-sm transition-all dark:border-[#2f4938] dark:from-[#14271b] dark:to-[#0d1a12]`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#854d0e] dark:text-[#f8b93c]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-[#0d5b3f] dark:text-[#eff8e8]">{value}</p>
      {hint && <p className="mt-1 text-xs font-semibold text-[#4b7c65] dark:text-[#a8c1af]">{hint}</p>}
    </article>
  );
}

// O GRÁFICO ORIGINAL (SVG PURO)
function OriginalLineChart({ points, isDark }: { points: any[], isDark: boolean }) {
  if (!points || points.length === 0) return null;
  
  const width = 800;
  const height = 200;
  const maxValue = Math.max(...points.map(p => p.value), 1);
  const stepX = width / (points.length - 1);
  
  const pts = points.map((p, i) => ({
    x: i * stepX,
    y: height - (p.value / maxValue) * (height - 40) - 20
  }));

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-[#fffdf5] p-4 dark:bg-[#16271c] border border-[#e6eddc] dark:border-[#31483a]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff9d1c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff9d1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill="url(#grad)" />
        <path d={d} fill="none" stroke="#ff9d1c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={isDark ? "#eff8e8" : "#0d5b3f"} />
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-[10px] text-[#557c69] dark:text-[#a8c1af]">
        {points.filter((_, i) => i % 4 === 0).map((p, i) => <span key={i}>{p.label}</span>)}
      </div>
    </div>
  );
}

export function DashboardShell() {
  const [state, setState] = useState<ApiState>({ status: "loading" });
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setIsDark(saved);
    if (saved) document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [solarRes, weatherRes] = await Promise.all([
          fetch("/api/solar"),
          fetch("/api/weather")
        ]);
        const solar = await solarRes.json();
        const weather = await weatherRes.json();
        setState({ status: "success", data: { solar, weather } });
      } catch (e) {
        setState({ status: "error", message: "Erro ao carregar dados." });
      }
    }
    loadData();
  }, []);

  if (state.status !== "success") return <div className="p-20 text-center dark:text-white">Carregando...</div>;

  const { solar, weather } = state.data;

  return (
    <main className="min-h-screen bg-[#f4f7f4] p-4 transition-colors duration-300 dark:bg-[#09120d] sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col items-center justify-between gap-6 rounded-[2.25rem] bg-[#0d2a1d] p-6 shadow-xl md:flex-row">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-2">
              <Image src="/solee-logo.png" alt="Logo" width={50} height={50} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#f8b93c]">Dashboard</p>
              <h1 className="text-xl font-bold text-white">Dashboard de geração de energia solar</h1>
            </div>
          </div>
          <button onClick={toggleTheme} className="rounded-xl border border-white/20 bg-white/10 px-6 py-2 text-xs font-bold text-white hover:bg-white/20">
            {isDark ? "MODO CLARO ☀️" : "MODO ESCURO 🌙"}
          </button>
        </header>

        {/* MÉTRICAS PRINCIPAIS */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Geração Hoje" value={formatKwh(solar.summary.todayGenerationKwh)} hint={`Meta: ${formatKwh(solar.summary.targetDailyKwh)}`} />
          <MetricCard label="Geração Mensal" value={formatKwh(solar.summary.monthlyGenerationKwh)} hint={`Mês: ${compactNumberFormatter.format(solar.summary.monthlyGenerationKwh)}`} accent="from-[#fef1c3] to-white" />
          <MetricCard label="Venda Hoje" value={formatCurrency(solar.summary.economyTodayBrl)} hint={`Mês: ${formatCurrency(solar.summary.economyMonthBrl)}`} accent="from-[#ffe7c0] to-white" />
          <MetricCard label="Performance" value={`${solar.summary.performancePct}%`} hint={`Tarifa: ${formatCurrency(solar.summary.tariffKwhBrl)}`} accent="from-[#e8f6ea] to-white" />
        </section>

        {/* GRÁFICO ORIGINAL RESTAURADO */}
        <section className="rounded-[2rem] border border-[#d9e5d8] bg-white/90 p-6 shadow-sm dark:border-[#2f4938] dark:bg-[#102418]/90">
          <h2 className="mb-4 text-xl font-bold text-[#0d5b3f] dark:text-[#eff8e8]">Geração por hora</h2>
          <OriginalLineChart 
            isDark={isDark}
            points={solar.hourlyChart.map((p: any) => ({ label: p.timeLabel, value: p.powerKw }))} 
          />
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* INVERSORES */}
          <section className="rounded-[2rem] border border-[#d9e5d8] bg-white/90 p-6 dark:border-[#2f4938] dark:bg-[#102418]/90">
            <h2 className="mb-4 text-xl font-bold text-[#0d5b3f] dark:text-[#eff8e8]">Status dos inversores</h2>
            <div className="space-y-3">
              {solar.inverters.map((inv: any) => (
                <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl border border-[#e4ead7] dark:border-[#31483a] dark:bg-[#16271c]">
                  <span className="font-bold dark:text-emerald-400">{inv.name}</span>
                  <span className="font-mono text-emerald-600">{formatKw(inv.powerKw)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CLIMA */}
          <section className="rounded-[2rem] border border-[#d9e5d8] bg-white/90 p-6 dark:border-[#2f4938] dark:bg-[#102418]/90">
            <h2 className="mb-4 text-xl font-bold text-[#0d5b3f] dark:text-[#eff8e8]">Previsão do tempo</h2>
            <div className="rounded-2xl bg-gradient-to-br from-[#0d2a1d] to-[#1a4d36] p-6 text-white">
              <p className="text-sm opacity-70">{weather.location}</p>
              <div className="flex justify-between items-end mt-2">
                <span className="text-4xl font-bold">{weather.current.temperatureC}°C</span>
                <span className="text-sm">{weather.current.weatherLabel}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
