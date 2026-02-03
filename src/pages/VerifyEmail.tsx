import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Alert, Form, Button } from 'react-bootstrap';
import { verifyEmail } from '../services/authService';

type VerificationStatus = 'input' | 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('input');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const formatCodeInput = (value: string): string => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Limit to 8 characters
    return cleaned.slice(0, 8);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(formatCodeInput(e.target.value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (code.length !== 8) {
      setErrorMessage('Please enter the complete 8-character code');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await verifyEmail(code);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const displayCode = code.length > 4
    ? `${code.slice(0, 4)}-${code.slice(4)}`
    : code;

  return (
    <Row className="justify-content-center">
      <Col md={6} lg={4}>
        {(status === 'input' || status === 'loading') && (
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Verify Your Email</h4>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Enter the 8-character verification code sent to {email ? <strong>{email}</strong> : 'your email'}.
              </p>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="code">
                  <Form.Label>Verification Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={displayCode}
                    onChange={handleCodeChange}
                    placeholder="XXXX-XXXX"
                    className="text-center font-monospace fs-4"
                    style={{ letterSpacing: '2px' }}
                    maxLength={9}
                    disabled={status === 'loading'}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                  <Form.Text className="text-muted">
                    Check your email for the code
                  </Form.Text>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={status === 'loading' || code.length !== 8}
                  >
                    {status === 'loading' ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </Form>
              <hr />
              <p className="text-muted small mb-0">
                Didn't receive the code?{' '}
                <Link to={`/resend-verification${email ? `?email=${encodeURIComponent(email)}` : ''}`}>
                  Resend code
                </Link>
              </p>
            </Card.Body>
          </Card>
        )}

        {status === 'success' && (
          <Card className="border-success">
            <Card.Header className="bg-success text-white">
              <h4 className="mb-0">Email Verified</h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="success">
                <Alert.Heading>Success!</Alert.Heading>
                <p className="mb-0">
                  Your email address has been verified. You can now sign in to your account.
                </p>
              </Alert>
              <div className="d-grid gap-2 mt-3">
                <Button variant="success" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {status === 'error' && (
          <Card className="border-danger">
            <Card.Header className="bg-danger text-white">
              <h4 className="mb-0">Verification Failed</h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="danger">
                <Alert.Heading>Unable to Verify</Alert.Heading>
                <p className="mb-0">{errorMessage}</p>
              </Alert>
              <div className="d-grid gap-2 mt-3">
                <Button variant="primary" onClick={() => { setStatus('input'); setCode(''); }}>
                  Try Again
                </Button>
                <Link to={`/resend-verification${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="btn btn-outline-secondary">
                  Request New Code
                </Link>
              </div>
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  );
}
