import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Home from "./pages/Home";
import Store from "./pages/Store";
import Quote from "./pages/Quote";
import Services from "./pages/Services";
import About from "./pages/About";
import Partners from "./pages/Partners";
import Models from "./pages/Models";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ROUTES, no authentication anywhere; the whole site is public (B2B).
const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store" element={<Store />} />
            <Route path="/services" element={<Services />} />
            <Route path="/quote" element={<Quote />} />
            <Route path="/about" element={<About />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/models" element={<Models />} />
            {/* Legacy routes → redirect to the new B2B flow */}
            <Route path="/notifications" element={<Navigate to="/" replace />} />
            <Route path="/studio" element={<Navigate to="/quote" replace />} />
            <Route path="/simulation" element={<Navigate to="/quote" replace />} />
            <Route path="/checkout" element={<Navigate to="/quote" replace />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
