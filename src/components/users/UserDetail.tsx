import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button } from 'react-bootstrap';
import * as userService from '../../services/userService';
import { UserWithoutPassword } from '../../types/User';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();
  const { showError } = useAlert();
  const [user, setUser] = useState<UserWithoutPassword | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (id) {
        const userId = parseInt(id);

        // Non-admins can only view their own profile
        if (!isAdmin && currentUser?.id !== userId) {
          showError('Access denied.');
          navigate('/');
          return;
        }

        const foundUser = await userService.getUserById(userId);
        if (foundUser) {
          setUser(foundUser);
        } else {
          showError('User not found.');
          navigate('/users');
        }
      }
    };
    loadUser();
  }, [id, navigate, showError, currentUser, isAdmin]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <Card.Header>
        <h4 className="mb-0">User Details</h4>
      </Card.Header>
      <Card.Body>
        <Row className="mb-2">
          <Col md={3} className="text-muted">Email</Col>
          <Col md={9}>{user.email}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Role</Col>
          <Col md={9} className="text-capitalize">{user.role}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Sign In Count</Col>
          <Col md={9}>{user.signInCount}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Last IP</Col>
          <Col md={9}>{user.lastSignInIp || 'N/A'}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">Last Sign In</Col>
          <Col md={9}>{formatDate(user.lastSignInAt)}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">User Created</Col>
          <Col md={9}>{formatDate(user.createdAt)}</Col>
        </Row>

        <Row className="mb-2">
          <Col md={3} className="text-muted">User Updated</Col>
          <Col md={9}>{formatDate(user.updatedAt)}</Col>
        </Row>

        <hr />

        <Button variant="danger" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Card.Body>
    </Card>
  );
}
