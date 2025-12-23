import CustomLayout from "@/components/CustomLayout";
import FeaturesSection from "@/components/FeaturesAuction";
import HeroSection from "@/components/HeroSection";
import { ThemeProvider } from "@lobehub/ui";

export default function Home() {
  return (
    <>  
        <HeroSection />
        <FeaturesSection />
    </>
  );
}
