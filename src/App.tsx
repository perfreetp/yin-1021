import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import Templates from "@/pages/Templates";
import Conversations from "@/pages/Conversations";
import Schedule from "@/pages/Schedule";
import Cleaning from "@/pages/Cleaning";
import Analytics from "@/pages/Analytics";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/cleaning" element={<Cleaning />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
