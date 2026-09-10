import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";



export default function MainLayout() {
  return (
    <div id="top" className="min-h-screen flex flex-col bg-ivory">
      <Navbar />
      {/* pb-16 reserves space for the fixed BottomNav on mobile only */}
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      
      <Footer />
      
    </div>
  );
}