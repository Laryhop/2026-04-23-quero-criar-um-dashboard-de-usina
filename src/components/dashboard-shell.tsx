"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function MetricCard({ label, value, hint, accent = "from-[#fff6d8] to-white" }: any) {
  return (
    <article className={`rounded-[1.8rem] border border-[#f0d9a2] bg-gradient-to-br ${accent} p-5 shadow-sm transition-all dark:border-[#2f4938] dark:from-[#14271b] dark:to-[#0d1a12]`}>
      {/* Corrigido: Texto marrom escuro/laranja para ter contraste */}
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#854d0e] dark:text-[#f8b93c]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-[#0d5b3f] dark:text-[#eff8e8]">{value}</p>
      {hint && <p className="mt-1 text-xs font-semibold text-[#4b7c65] dark:text-[#a8c1af]">{hint}</p>}
    </article>
  );
}

export function DashboardShell() {
  const [isDark, setIsDark] = useState(false);

  // Garante que o tema seja aplicado ao carregar
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

  return (
    <main className="min-h-screen bg-[#f4f7f4] p-4 transition-colors duration-300 dark:bg-[#09120d] sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header estilo Dark igual à imagem */}
        <header className="flex flex-col items-center justify-between gap-6 rounded-[2.25rem] bg-[#0d2a1d] p-6 shadow-xl md:flex-row">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-2">
              <Image src="/solee-logo.png" alt="Logo" width={50} height={50} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#f8b93c]">Dashboard</p>
              <h1 className="text-xl font-bold text-white">Geração de Energia Solar</h1>
            </div>
          </div>

          <button 
            onClick={toggleTheme}
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
          >
            {isDark ? "MODO CLARO ☀️" : "MODO ESCURO 🌙"}
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Geração Hoje" value="1.581,9 kWh" hint="Meta: 2.000 kWh" />
          <MetricCard label="Geração Mensal" value="39.527,5 kWh" hint="Total: 86,1 mil kWh" accent="from-[#fef1c3] to-white" />
          <MetricCard label="Venda Hoje" value="R$ 1.107,33" hint="No mês: R$ 27.669,25" accent="from-[#ffe7c0] to-white" />
          <MetricCard label="Performance" value="79,4%" hint="Tarifa: R$ 0,70/kWh" accent="from-[#e8f6ea] to-white" />
        </section>
      </div>
    </main>
  );
}
