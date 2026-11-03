import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="landing-hero relative flex items-center overflow-hidden text-white"
      aria-label="Sewa alat pertanian"
    >
      <div className="landing-hero__image absolute inset-0" />
      <div className="landing-hero__shade absolute inset-0" />
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 py-24 sm:px-10 lg:px-0">
        <div className="max-w-[650px]">
          <p className="eyebrow mb-6 text-white/85">Sewa mudah, hasil tani melimpah.</p>
          <h1 className="font-display max-w-[650px] text-[42px] leading-[1.03] tracking-[-0.035em] sm:text-5xl lg:text-[58px]">
            Alat yang tepat.<br />Panen yang lebih baik.
          </h1>
          <p className="mt-6 max-w-[480px] text-sm leading-6 text-white/85 sm:text-[15px]">
            Dari pengolahan tanah hingga panen. Temukan alat pertanian berkualitas, sewa sesuai kebutuhan, tanpa harus membeli.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#katalog" className="button-primary inline-flex items-center justify-center gap-3">
              Jelajahi alat pertanian <ArrowUpRight size={15} />
            </a>
            <a href="#cara-sewa" className="button-light inline-flex items-center justify-center gap-3">
              Pelajari cara sewa alat <ArrowDownRight size={15} />
            </a>
          </div>
          <p className="mt-7 text-[11px] tracking-wide text-white/75">Untuk petani di Barlingmascakep · Pengambilan langsung di depot pertanian</p>
        </div>
      </div>
    </section>
  );
}
