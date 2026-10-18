import Navbar from "../features/navbar/navBar";
import { Hero } from "../features/hero";
import { MembersSection } from "../features/members";

export default function Home() {

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main>
        <Hero />
        <MembersSection />
      </main>
    </div>
  );
}
