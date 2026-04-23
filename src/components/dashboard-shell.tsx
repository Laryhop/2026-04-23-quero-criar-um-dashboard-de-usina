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
function MetricCard({ label, value, hint }: any) {
  return (
    <article className="rounded-[1.8rem] border p-5 shadow-sm bg-white dark:bg-[#12241a] border-slate-200 dark:border-emerald-800/50 transition-all hover:scale-[1.01]">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#7c4a03] dark:text-[#f8b93c]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#052e16] dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs font-bold text-slate-500 dark:text-emerald-300/40">{hint}</p>}
    </article>
  );
}

function OriginalLineChart({ points }: { points: any[] }) {
  if (!points || points.length === 0) return null;
  const width = 800;
  const height = 180;
  const maxValue = Math.max(...points.map(p => p.value), 0.1);
  const stepX = width / (points.length - 1);
  const pts = points.map((p, i) => ({
    x: i * stepX,
    y: height - (p.value / maxValue) * (height - 40) - 20
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-[#fffdf5] p-4 dark:bg-[#0d1a12] border border-[#e6eddc] dark:border-[#1e3326]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff9d1c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff9d1c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill="url(#grad)" />
        <path d={d} fill="none" stroke="#ff9d1c" strokeWidth="3" strokeLinecap="round" />
      </svg>
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
    
    async function loadData() {
      try {
        const [s, w] = await Promise.all([fetch("/api/solar"), fetch("/api/weather")]);
        setState({ status: "success", data: { solar: await s.json(), weather: await w.json() } });
      } catch (e) {
        setState({ status: "error", message: "Erro ao conectar com a API da usina." });
      }
    }
    loadData();
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

  if (state.status === "loading") return <div className="p-20 text-center dark:bg-[#09120d] dark:text-white font-bold">Iniciando Dashboard...</div>;
  if (state.status === "error") return <div className="p-20 text-rose-500 text-center font-bold">{state.message}</div>;

  const { solar, weather } = state.data;

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 transition-colors duration-300 dark:bg-[#09120d] sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col items-center justify-between gap-6 rounded-[2.25rem] bg-[#0d2a1d] p-7 shadow-2xl md:flex-row border border-emerald-900">
          <div className="flex items-center gap-5">
            <div className="rounded-2xl bg-white p-2">
              <Image src="/solee-logo.png" alt="Logo" width={55} height={55} priority />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-[#f8b93c] tracking-widest">Dashboard</p>
              <h1 className="text-xl font-black text-white sm:text-3xl">Geração de Energia Solar</h1>
              <p className="text-xs text-emerald-400/60">Dashboard de geração de energia solar.</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="rounded-full border border-white/20 bg-white/10 px-8 py-3 text-xs font-black text-white hover:bg-white/20 transition-all uppercase">
            {isDark ? "Modo Claro" : "Modo Escuro"}
          </button>
        </header>

        {/* MÉTRICAS (8 CARDS COMPLETOS) */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Geração Hoje" value={formatKwh(solar.summary.todayGenerationKwh)} hint={`Meta: ${formatKwh(solar.summary.targetDailyKwh)}`} />
          <MetricCard label="Geração Mensal" value={formatKwh(solar.summary.monthlyGenerationKwh)} hint={`Mês: ${compactNumberFormatter.format(solar.summary.monthlyGenerationKwh)}`} />
          <MetricCard label="Venda Hoje" value={formatCurrency(solar.summary.economyTodayBrl)} hint="Venda estimada hoje" />
          <MetricCard label="Performance" value={`${solar.summary.performancePct}%`} hint={`Tarifa: ${formatCurrency(solar.summary.tariffKwhBrl)}`} />
          <MetricCard label="Potência Atual" value={formatKw(solar.summary.currentPowerKw)} hint="Capacidade L & M" />
          <MetricCard label="Status da Usina" value={solar.summary.statusLabel} hint={solar.summary.location} />
          <MetricCard label="Venda Total" value={formatCurrency(solar.summary.totalRevenueBrl)} hint="Acumulado histórico" />
          <MetricCard label="Última Leitura" value={new Date(solar.summary.updatedAt).toLocaleTimeString()} hint="Horário de consulta" />
        </section>

        {/* GRÁFICO */}
        <section className="rounded-[2rem] bg-white p-8 shadow-sm dark:bg-[#102418] border border-slate-200 dark:border-emerald-900/30">
          <h2 className="mb-6 text-xl font-black text-[#052e16] dark:text-white">Geração por hora</h2>
          <OriginalLineChart points={solar.hourlyChart.map((p: any) => ({ label: p.timeLabel, value: p.powerKw }))} />
        </section>

        {/* TABELA E INVERSORES */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* TABELA DE HISTÓRICO */}
          <section className="rounded-[2rem] bg-white p-8 shadow-sm dark:bg-[#102418] border border-slate-200 dark:border-emerald-900/30">
            <h2 className="mb-4 text-xl font-black text-[#052e16] dark:text-white">Comparação Diária (7 dias)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b dark:border-emerald-900 text-[#7c4a03] dark:text-[#f8b93c] font-black uppercase text-[10px]">
                    <th className="py-3">Dia</th>
                    <th>Geração</th>
                    <th>Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-emerald-900/30">
                  {solar.dailyHistory.slice(0, 7).map((day: any) => (
                    <tr key={day.date} className="dark:text-white/80">
                      <td className="py-4 font-bold">{day.label}</td>
                      <td>{formatKwh(day.generationKwh)}</td>
                      <td className="font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(day.economyBrl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* INVERSORES E CLIMA */}
          <div className="space-y-8">
            <section className="rounded-[2rem] bg-white p-6 shadow-sm dark:bg-[#102418] border border-slate-200 dark:border-emerald-900/30">
              <h2 className="mb-4 text-xl font-black text-[#052e16] dark:text-white">Inversores</h2>
              <div className="space-y-3">
                {solar.inverters.map((inv: any) => (
                  <div key={inv.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-[#16271c] border border-slate-100 dark:border-emerald-900/50">
                    <span className="font-bold dark:text-emerald-400">{inv.name}</span>
                    <span className="font-black text-emerald-900 dark:text-white">{formatKw(inv.powerKw)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-gradient-to-br from-[#0d2a1d] to-[#143a28] p-8 text-white shadow-xl">
              <p className="text-[11px] font-black uppercase text-[#f8b93c]">Clima em {weather.location}</p>
              <div className="flex justify-between items-end mt-4">
                <div>
                  <p className="text-6xl font-black">{weather.current.temperatureC}°C</p>
                  <p className="text-emerald-300 font-bold mt-2">{weather.current.weatherLabel}</p>
                </div>
                <div className="text-right text-xs opacity-70 font-bold">
                  <p>Umidade: {weather.current.precipitationProbabilityPct}%</p>
                  <p>Vento: {weather.current.windKph} km/h</p>
                </div>
              </div>
            </section>
          </div>
        </div>

      </div>
    </main>
  );
}
