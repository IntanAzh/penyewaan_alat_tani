import Hero from "@/components/Hero";
import StatsStrip from "@/components/StatsStrip";
import CategorySection from "@/components/CategorySection";
import CatalogSection from "@/components/CatalogSection";
import ValueProposition from "@/components/ValueProposition";
import HowToRent from "@/components/HowToRent";
import ServiceHighlights from "@/components/ServiceHighlights";
import Testimonials from "@/components/Testimonials";
import RulesAccordion from "@/components/RulesAccordion";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbfaf6]">
      <Hero />
      <StatsStrip />
      <CategorySection />
      <CatalogSection />
      <ValueProposition />
      <HowToRent />
      <ServiceHighlights />
      <Testimonials />
      <RulesAccordion />
      <Footer />
    </main>
  );
}
