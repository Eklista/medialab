// src/App.tsx
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { RequestFormPage } from './pages/request-form/RequestFormPage'
import './styles/global.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/request" element={<RequestFormPage />} />
    </Routes>
  )
}

export default App