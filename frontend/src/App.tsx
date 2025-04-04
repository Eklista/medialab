import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { RequestFormPage } from './pages/request-form/RequestFormPage'
import ComponentsTest from './pages/documentation/ComponentsTest'
import './styles/global.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/request" element={<RequestFormPage />} />
      <Route path="/documentation/components-test" element={<ComponentsTest />} />
    </Routes>
  )
}

export default App