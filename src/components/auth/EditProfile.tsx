import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Row, Col, ButtonGroup } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';

export default function EditProfile() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();

  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password && password !== passwordConfirmation) {
      showError('Password confirmation does not match.');
      return;
    }

    try {
      const updatedUser = await updateProfile({
        email: email !== user?.email ? email : undefined,
        password: password || undefined,
        currentPassword,
      });

      if (updatedUser) {
        showSuccess('Your account has been updated successfully.');
        navigate('/items');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Update failed.');
    }
  };

  const handleDeleteAccount = async () => {
    const result = await deleteAccount();
    if (result) {
      showSuccess('Your account has been cancelled.');
      navigate('/');
    } else {
      showError('Failed to delete account.');
    }
    setShowDeleteModal(false);
  };

  return (
    <Row className="justify-content-center">
      <Col md={6} lg={5}>
        <Card className="border-primary">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">Edit User</h4>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Leave blank if you don't want to change it
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="passwordConfirmation">
                <Form.Label>Password Confirmation</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="currentPassword">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  Enter your current password to confirm changes
                </Form.Text>
              </Form.Group>

              <ButtonGroup className="w-100">
                <Button variant="primary" type="submit">
                  Update
                </Button>
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Cancel my account
                </Button>
                <Button
                  variant="warning"
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <ConfirmModal
        show={showDeleteModal}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmLabel="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </Row>
  );
}
