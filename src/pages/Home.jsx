import Hero from "../components/Hero";
import WhyGoSolar from "../components/WhyGoSolar";
import SchemeSubsidy from "../components/SchemeSubsidy";
import ProcessSteps from "../components/ProcessSteps";
import ProductHighlight from "../components/ProductHighlight";
import WhyChooseUs from "../components/WhyChooseUs";
import SavingsInvestment from "../components/SavingsInvestment";
import WhyActNow from "../components/WhyActNow";
import Testimonials from "../components/Testimonials";
import CTASection from "../components/CTASection";
import SubsidyWestbengal from "../components/SubsidyWestbengal";

// Navbar, Footer, and ChatBox are NOT imported here — your Layout.jsx
// renders them once for every route via <Outlet />.
export default function Home() {
  return (
    <>
      <Hero />
      <WhyGoSolar />
      <SchemeSubsidy />
      <SubsidyWestbengal/>
      <ProcessSteps />
      <ProductHighlight />
      <WhyChooseUs />
      <SavingsInvestment />
      <WhyActNow />
      <Testimonials />
      <CTASection />
    </>
  );
}