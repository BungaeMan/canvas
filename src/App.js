import { BrowserRouter, Routes, Route } from "react-router-dom";
import DrawCanvas from "./DrawCanvas";
import Polygon from "./Polygon";
import Main from "./Main";

function App() {
  return (
    <div>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="data/4-1" element={<DrawCanvas />} />
          <Route path="data/4-2" element={<Polygon />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
