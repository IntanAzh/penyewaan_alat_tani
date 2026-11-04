const reviews = [
  { quote: "Traktornya terawat dan siap pakai. Jadwal jelas, jadi saya bisa menyiapkan lahan tepat waktu.", name: "Nadia Putri", role: "Petani padi", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80" },
  { quote: "Tidak perlu membeli pompa untuk kebutuhan musiman. Kelengkapan dicek bersama, pengembalian juga mudah.", name: "Arif Ramadhan", role: "Petani hortikultura", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80" },
  { quote: "Mesin perontoknya membantu pekerjaan panen kami lebih ringan. Timnya teliti dan komunikatif.", name: "Dina Maharani", role: "Pengelola kelompok tani", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=96&q=80" },
];

export default function Testimonials() {
  return (
    <section className="bg-[#fbfaf6] px-6 py-14 sm:px-10 lg:px-0">
      <div className="mx-auto max-w-[1280px]">
        <p className="eyebrow text-[#426451]">Pengalaman pengguna</p>
        <h2 className="font-display mt-3 text-[30px] text-[#243b30]">Penilaian penyewaan.</h2>
        <div className="testimonials-window mt-7">
        <div className="testimonials-track gap-4">
          {[...reviews, ...reviews].map((review, index) => (
            <figure key={`${review.name}-${index}`} className="review-card">
              <blockquote className="font-display text-[16px] leading-[1.35] text-[#34473b]">“{review.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <img src={review.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                <span><strong className="block text-[13px] font-semibold text-[#354a3d]">{review.name}</strong><small className="mt-0.5 block text-[12px] text-[#737d74]">{review.role}</small></span>
              </figcaption>
            </figure>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
