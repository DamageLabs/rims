import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { showSuccess } = useAlert();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showSuccess('Signed out successfully.');
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          RIMS
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                <NavDropdown title="Inventory" id="inventory-dropdown">
                  <NavDropdown.Item as={Link} to="/items">
                    All Items
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/items/new">
                    New Item
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/items/import">
                    Import Data
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/items/scanner">
                    Barcode Scanner
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/items/labels">
                    Print Labels
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/items/reorder">
                    Reorder Alerts
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/items/templates">
                    Item Templates
                  </NavDropdown.Item>
                </NavDropdown>
                <NavDropdown title="Reports" id="reports-dropdown">
                  <NavDropdown.Item as={Link} to="/reports">
                    Dashboard
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/reports/valuation">
                    Inventory Valuation
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/reports/movement">
                    Stock Movement
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/reports/custom">
                    Custom Report
                  </NavDropdown.Item>
                </NavDropdown>
                <NavDropdown title="BOM" id="bom-dropdown">
                  <NavDropdown.Item as={Link} to="/bom">
                    All BOMs
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/bom/new">
                    New BOM
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            )}
            {isAdmin && (
              <NavDropdown title="Admin" id="admin-dropdown">
                <NavDropdown.Item as={Link} to="/users">
                  Users
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/settings/categories">
                  Categories
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/settings/inventory-types">
                  Inventory Types
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
          <Nav className="align-items-center">
            <Button
              variant="link"
              className="nav-link px-2"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <FaSun className="text-warning" /> : <FaMoon className="text-light" />}
            </Button>
            {isAuthenticated ? (
              <NavDropdown title={user?.email} id="account-dropdown" align="end">
                <NavDropdown.Item as={Link} to="/profile">
                  Edit Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/register">
                  Sign up
                </Nav.Link>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
