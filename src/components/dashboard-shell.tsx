"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// --- Tipagens e Formatadores ---
type ApiState = 
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: any };

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

function SectionCard({ title, subtitle, children }: any) {
  return (
    <section className="rounded-[2rem] border border-[#d9e5d8] bg-white/90 p-6 shadow-sm dark:border-[#2f4938] dark:bg-[#102418]/90">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0d5b3f] dark:text-[#eff8e8]">{title}</h2>
        {subtitle && <p className="text-sm text-[#557c69] dark:text-[#a8c1af]">{subtitle}</p>}
      </div>
      {children}
    </section>
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
        setState({ status: "error", message: "Falha ao conectar com a usina." });
      }
    }
    loadData();
  }, []);

  if (state.status === "loading") return <div className="p-20 text-center dark:text-white">Carregando...</div>;
  if (state.status === "error") return <div className="p-20 text-rose-500 text-center">{state.message}</div>;

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

        {/* MÉTRICAS */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Geração Hoje" value={formatKwh(solar.summary.todayGenerationKwh)} hint={`Meta: ${formatKwh(solar.summary.targetDailyKwh)}`} />
          <MetricCard label="Geração Mensal" value={formatKwh(solar.summary.monthlyGenerationKwh)} hint={`Total: ${compactNumberFormatter.format(solar.summary.totalGenerationKwh)}`} accent="from-[#fef1c3] to-white" />
          <MetricCard label="Venda Hoje" value={formatCurrency(solar.summary.economyTodayBrl)} hint={`Mês: ${formatCurrency(solar.summary.economyMonthBrl)}`} accent="from-[#ffe7c0] to-white" />
          <MetricCard label="Performance" value={`${solar.summary.performancePct}%`} hint={`Tarifa: ${formatCurrency(solar.summary.tariffKwhBrl)}`} accent="from-[#e8f6ea] to-white" />
        </section>

        {/* GRÁFICO DE GERAÇÃO (O QUE VOCÊ PEDIU) */}
        <SectionCard title="Geração de Energia" subtitle="Histórico de produção em kWh (últimos 30 dias)">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={solar.dailyHistory}>
                <defs>
                  <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#2f4938" : "#d9e5d8"} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: isDark ? '#a8c1af' : '#557c69', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#a8c1af' : '#557c69', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#102418' : '#fff', border: 'none', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                />
                <Area type="monotone" dataKey="generationKwh" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGen)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* INVERSORES E CLIMA */}
        <div className="grid gap-8 lg:grid-cols-2">
          <SectionCard title="Status dos inversores">
            <div className="space-y-3">
              {solar.inverters.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-[#e4ead7] p-4 dark:border-[#31483a] dark:bg-[#16271c]">
                  <p className="font-bold text-[#0d5b3f] dark:text-emerald-400">{inv.name}</p>
                  <p className="font-bold">{formatKw(inv.powerKw)}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Previsão do tempo" subtitle={weather.location}>
            <div className="rounded-2xl bg-gradient-to-r from-[#0d2a1d] to-[#1a4d36] p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-4xl font-bold">{weather.current.temperatureC}°C</p>
                <p className="text-emerald-200">{weather.current.weatherLabel}</p>
              </div>
              <div className="text-right text-sm">
                <p>Chuva: {weather.current.precipitationProbabilityPct}%</p>
                <p>Vento: {weather.current.windKph} km/h</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
