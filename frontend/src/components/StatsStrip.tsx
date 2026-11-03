const stats = [
  { value: "120+", label: "Alat pertanian mendukung musimmu" },
  { value: "2.400+", label: "Penyewaan terselesaikan" },
  { value: "Jelas", label: "Jadwal dan ketersediaan" },
  { value: "100%", label: "Alat pertanian dicek sebelum disewa" },
];

export default function StatsStrip() {
  return (
    <section className="bg-[#e9eee5]" aria-label="Ringkasan layanan">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 px-6 py-5 sm:px-10 lg:grid-cols-4 lg:px-0">
        {stats.map((stat, index) => (
          <div key={stat.value} className={`stat-item ${index > 0 ? "lg:border-l" : ""}`}>
            <p className="font-display text-[22px] leading-none text-[#233f32]">{stat.value}</p>
            <p className="mt-2 text-[10px] leading-4 text-[#647066] sm:text-[11px]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
