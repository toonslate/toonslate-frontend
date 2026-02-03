import { Navigate, Route, Routes } from "react-router-dom";

import { TranslatePage } from "@/pages/TranslatePage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/translate" replace />} />
      <Route path="/translate" element={<TranslatePage />} />
    </Routes>
  );
};

export default App;
