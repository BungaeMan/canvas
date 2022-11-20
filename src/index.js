import React from "react";
import ReactDOM from "react-dom/client";
import DrawCanvas from "./DrawCanvas";
import logo from "./mustang.jpg";
import "./DrawCanvas.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <div>
    <DrawCanvas />
  </div>
);
