import { Navigate, Route, Routes } from "react-router-dom";

import { ResultsPage } from "@/pages/ResultsPage";
import { RetouchPage } from "@/pages/RetouchPage";
import { TranslatePage } from "@/pages/translate/TranslatePage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/translate" replace />} />
      <Route path="/translate" element={<TranslatePage />} />
      <Route path="/batch/:batchId" element={<ResultsPage />} />
      <Route path="/retouch/:translateId" element={<RetouchPage />} />
    </Routes>
  );
};

export default App;
