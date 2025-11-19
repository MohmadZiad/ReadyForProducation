import Header from "@/components/Header";
import Hero from "@/components/Hero";
import KPICards from "@/components/KPICards";
import FeatureGrid from "@/components/FeatureGrid";
import SummaryPanel from "@/components/SummaryPanel";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <KPICards />
      <FeatureGrid />
      <SummaryPanel />
    </div>
  );
}
