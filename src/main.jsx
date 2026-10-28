// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App/>
//   </StrictMode>,
// )

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "sonner";


import "./index.css";
import App from "./App";


createRoot(document.getElementById("root")).render(
  <StrictMode>


        <Toaster position="top-right" richColors />
      <App/>


  </StrictMode>
);

