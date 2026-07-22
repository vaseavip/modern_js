import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
function resolveUserPhoto(photo: string): string {
  if (!photo) {
    return '';
  }

  if (photo.startsWith('http://') || photo.startsWith('https://')) {
    return photo;
  }

  return `http://localhost:3000${photo}`;
}

function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="app-header shadow-sm">
      <nav className="navbar navbar-dark bg-primary py-3">
        <div className="container">
          <NavLink className="navbar-brand fw-bold" to="/">
            Fashion Catalog
          </NavLink>

          <ul className="navbar-nav flex-row gap-3 ms-auto">
            <li className="nav-item">
              <NavLink end className="nav-link" to="/">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/products">
                Produse
              </NavLink>
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav-item text-white d-flex align-items-center small px-2 gap-2">
                  {user?.photo ? (
                    <img
                      src={resolveUserPhoto(user.photo)}
                      alt="Avatar"
                      width={28}
                      height={28}
                      className="rounded-circle border border-light"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : null}
                  <span>Salut, {user?.name}</span>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/register">
                    Register
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    Login
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Header;
