import * as React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import KPICards from "@/components/KPICards";
import FeatureGrid from "@/components/FeatureGrid";
import SummaryPanel from "@/components/SummaryPanel";
import SplashScreen from "@/components/SplashScreen";

export default function Home() {
  const initialShown =
    typeof window !== "undefined" && (window as any).__orangeIntroShown;

  const [ready, setReady] = React.useState<boolean>(!!initialShown);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (!initialShown) {
      // أول تحميل/ريفريش: فعّل السبلّاش واضبط الفلاغ
      (window as any).__orangeIntroShown = true;
      // ملاحظة: SplashScreen نفسه عنده تايمر 2ث، هون مش لازم نضيف تايمر
    }
  }, [initialShown]);

  return (
    <>
      {/* يظهر فقط عند أول تحميل (أو ريفريش) ولمدة ثانيتين */}
      <SplashScreen show={!ready} onFinish={() => setReady(true)} />

      {ready && (
        <div className="min-h-screen">
          <Header />
          <Hero />
          <KPICards />
          <FeatureGrid />
          <SummaryPanel />
        </div>
      )}
    </>
  );
}
