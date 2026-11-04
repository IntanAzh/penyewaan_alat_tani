import { CalendarDays, ClipboardCheck, Headset } from "lucide-react";

const points = [
  { icon: CalendarDays, title: "Jadwal musim transparan", text: "Tanggal tersedia dan perawatan alat dapat dilihat." },
  { icon: ClipboardCheck, title: "Pemeriksaan alat bersama", text: "Kondisi alat pertanian dicatat saat serah terima." },
  { icon: Headset, title: "Tim yang siap membantu", text: "Senin–Sabtu, 09.00–17.00 WIB." },
];

export default function ServiceHighlights() {
  return (
    <section className="bg-[#205b40] text-[#f7f7ef]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-7 px-6 py-7 sm:px-10 md:grid-cols-3 lg:px-0">
        {points.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <Icon size={19} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#dce8d9]" />
            <div><h3 className="font-display text-[16px]">{title}</h3><p className="mt-1 text-[10px] leading-4 text-white/75">{text}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
