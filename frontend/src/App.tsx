import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import Contact from "./pages/Contact";
import MobileBottomNav from "./features/navbar/MobileBottomNav";
import { FloatingContactButton } from "./shared/floating";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <MobileBottomNav />
      <FloatingContactButton />
    </BrowserRouter>
  );
};

export default App;
