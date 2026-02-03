import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVerificationError, setShowVerificationError] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setShowVerificationError(false);

    const result = await login({ email, password });
    if (result.user) {
      showSuccess('Signed in successfully.');
      navigate('/items');
    } else if (result.error === 'email_not_verified') {
      setShowVerificationError(true);
    } else {
      showError('Invalid email or password.');
    }
  };

  return (
    <Row className="justify-content-center">
      <Col md={6} lg={4}>
        <Card className="border-primary">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">Sign In</h4>
          </Card.Header>
          <Card.Body>
            {showVerificationError && (
              <Alert variant="warning">
                <Alert.Heading>Email Not Verified</Alert.Heading>
                <p>
                  Your email address has not been verified yet. Please enter the verification code sent to your email.
                </p>
                <hr />
                <div className="d-grid gap-2">
                  <Link to={`/verify-email?email=${encodeURIComponent(email)}`} className="btn btn-warning">
                    Enter Verification Code
                  </Link>
                  <Link to={`/resend-verification?email=${encodeURIComponent(email)}`} className="btn btn-outline-secondary btn-sm">
                    Resend code
                  </Link>
                </div>
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="off"
                />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button variant="primary" type="submit">
                  Sign In
                </Button>
              </div>
            </Form>
            <div className="mt-3 text-center">
              <Link to="/register" className="btn btn-link">
                Don't have an account? Register
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
