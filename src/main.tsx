import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeUTMTracking } from "@/utils/utm-tracking";

// Initialize UTM tracking on app load
initializeUTMTracking();

createRoot(document.getElementById("root")!).render(<App />);
