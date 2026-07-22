import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Header from './components/Header';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProductFormPage from './pages/ProductFormPage';
import ProductsListPage from './pages/ProductsListPage';
import UsersPage from './pages/UsersPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />

        <main className="container py-4 app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/products" element={<ProductsListPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route
              path="/products/new"
              element={<ProductFormPage mode="create" />}
            />
            <Route
              path="/products/:id"
              element={<ProductFormPage mode="view" />}
            />
            <Route
              path="/products/:id/edit"
              element={<ProductFormPage mode="edit" />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
