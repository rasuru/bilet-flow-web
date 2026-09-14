import { BrowserRouter, Routes, Route } from "react-router-dom"

import AuthPage from "@/pages/auth/AuthPage"
import CreateEventPage from "@/pages/organizer/CreateEventPage"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/organizer/events/new" element={<CreateEventPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
