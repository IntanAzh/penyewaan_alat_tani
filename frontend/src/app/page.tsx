import Hero from "@/components/Hero";
import CatalogSection from "@/components/CatalogSection";
import HowToRent from "@/components/HowToRent";
import RulesAccordion from "@/components/RulesAccordion";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF5E9]">
      <Hero />
      <CatalogSection />
      <HowToRent />
      <RulesAccordion />
    </main>
  );
}
