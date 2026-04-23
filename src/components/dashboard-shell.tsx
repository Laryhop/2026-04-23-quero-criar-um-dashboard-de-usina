"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "theme";
const REFRESH_INTERVAL = 60000;

export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [solarRes, weatherRes] = await Promise.all([
          fetch("/api/solar"),
          fetch("/api/weather"),
        ]);

        const solar = await solarRes.json();
        const weather = await weatherRes.json();

        setData({ solar, weather });
        setError(null);
      } catch (e: any) {
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f7f9] dark:bg-[#0b1410] text-[#111827] dark:text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Dashboard Solar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitoramento em tempo real
            </p>
          </div>

          <button
            onClick={() => setDark((v) => !v)}
            className="px-4 py-2 rounded-xl border bg-white dark:bg-[#1f2f25] dark:border-[#355341]"
          >
            {dark ? "☀️ Claro" : "🌙 Escuro"}
          </button>
        </header>

        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {data && (
          <>
            {/* MÉTRICAS */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card label="Geração Hoje" value={`${data.solar.summary.todayGenerationKwh} kWh`} />
              <Card label="Geração Mensal" value={`${data.solar.summary.monthlyGenerationKwh} kWh`} />
              <Card label="Venda Hoje" value={`R$ ${data.solar.summary.economyTodayBrl}`} />
              <Card label="Performance" value={`${data.solar.summary.performancePct}%`} />
              <Card label="Potência Atual" value={`${data.solar.summary.currentPowerKw} kW`} />
              <Card label="Status" value={data.solar.summary.statusLabel} />
              <Card label="Venda Total" value={`R$ ${data.solar.summary.totalRevenueBrl}`} />
              <Card label="Última Leitura" value={new Date(data.solar.summary.updatedAt).toLocaleString()} />
            </section>

            {/* GRÁFICO */}
            <Box title="Geração por hora">
              <div className="h-60 flex items-center justify-center text-gray-400">
                {data.solar.hourlyChart.length} pontos carregados
              </div>
            </Box>

            {/* INVERSORES */}
            <Box title="Inversores">
              <div className="space-y-3">
                {data.solar.inverters.map((inv: any) => (
                  <div key={inv.id} className="p-3 rounded-xl bg-gray-50 dark:bg-[#16271c] flex justify-between">
                    <span>{inv.name}</span>
                    <span>{inv.powerKw} kW</span>
                  </div>
                ))}
              </div>
            </Box>

            {/* WEATHER */}
            <Box title="Clima">
              <p>{data.weather.current.temperatureC}°C - {data.weather.current.weatherLabel}</p>
            </Box>

            {/* TABELA */}
            <Box title="Últimos dias">
              <table className="w-full text-sm">
                <tbody>
                  {data.solar.dailyHistory.slice(0, 7).map((d: any) => (
                    <tr key={d.date} className="border-t dark:border-[#2a3a2f]">
                      <td className="py-2">{d.label}</td>
                      <td>{d.generationKwh} kWh</td>
                      <td>R$ {d.economyBrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </>
        )}

      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2b22] border border-gray-200 dark:border-[#2a3a2f] shadow-sm">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold mt-2">{value}</p>
    </div>
  );
}

function Box({ title, children }: any) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#1a2b22] border border-gray-200 dark:border-[#2a3a2f] shadow-sm">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
