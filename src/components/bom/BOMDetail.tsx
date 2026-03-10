import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Table, Button, Badge, ButtonGroup, Row, Col, ProgressBar } from 'react-bootstrap';
import { FaEdit, FaCopy, FaTrash } from 'react-icons/fa';
import * as bomService from '../../services/bomService';
import { BOM, BOMCostBreakdown } from '../../types/BOM';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';
import Breadcrumbs from '../common/Breadcrumbs';
import { SkeletonDetailPage } from '../common/Skeleton';

export default function BOMDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();

  const [bom, setBom] = useState<BOM | null>(null);
  const [breakdown, setBreakdown] = useState<BOMCostBreakdown | null>(null);
  const [availability, setAvailability] = useState<{ canBuild: boolean; missingItems: string[] }>({ canBuild: false, missingItems: [] });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const loadBOM = async () => {
      if (id) {
        const foundBOM = await bomService.getBOMById(parseInt(id));
        if (foundBOM) {
          setBom(foundBOM);
          const [cost, avail] = await Promise.all([
            bomService.calculateBOMCost(foundBOM.id),
            bomService.checkAvailability(foundBOM.id),
          ]);
          setBreakdown(cost);
          setAvailability(avail);
        } else {
          showError('BOM not found.');
          navigate('/bom');
        }
      }
    };
    loadBOM();
  }, [id, navigate, showError]);

  const handleDelete = async () => {
    if (!bom) return;

    const success = await bomService.deleteBOM(bom.id);
    if (success) {
      showSuccess('BOM deleted successfully.');
      navigate('/bom');
    } else {
      showError('Failed to delete BOM.');
    }
    setShowDeleteModal(false);
  };

  const handleDuplicate = async () => {
    if (!bom) return;

    const newName = `${bom.name} (Copy)`;
    const duplicated = await bomService.duplicateBOM(bom.id, newName);
    if (duplicated) {
      showSuccess(`BOM duplicated as "${newName}".`);
      navigate(`/bom/${duplicated.id}`);
    } else {
      showError('Failed to duplicate BOM.');
    }
  };

  if (!bom || !breakdown) {
    return <SkeletonDetailPage />;
  }

  const breadcrumbItems = [
    { label: 'Bill of Materials', path: '/bom' },
    { label: bom.name },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">{bom.name}</h4>
        <Badge bg={availability.canBuild ? 'success' : 'warning'}>
          {availability.canBuild ? 'Ready to Build' : 'Missing Parts'}
        </Badge>
      </Card.Header>
      <Card.Body>
        {bom.description && (
          <Row className="mb-4">
            <Col>
              <p className="text-muted">{bom.description}</p>
            </Col>
          </Row>
        )}

        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <h2 className="text-primary">${breakdown.totalCost.toFixed(2)}</h2>
                <small className="text-muted">Total Cost</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <h2>{breakdown.itemCosts.length}</h2>
                <small className="text-muted">Components</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <h2>{breakdown.canBuildQuantity}</h2>
                <small className="text-muted">Can Build</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h5>Component List</h5>
        <Table striped bordered responsive>
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-center">Required</th>
              <th className="text-center">Available</th>
              <th className="text-end">Unit Cost</th>
              <th className="text-end">Line Cost</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.itemCosts.map((item) => {
              const bomItem = bom.items.find((bi) => bi.itemId === item.itemId);
              const percentAvailable = Math.min(100, (item.available / item.quantity) * 100);

              return (
                <tr key={item.itemId}>
                  <td>
                    <Link to={`/items/${item.itemId}`}>{item.itemName}</Link>
                    {bomItem?.notes && (
                      <small className="d-block text-muted">{bomItem.notes}</small>
                    )}
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-center">
                    {item.available}
                    <ProgressBar
                      now={percentAvailable}
                      variant={item.canBuild ? 'success' : 'danger'}
                      style={{ height: '4px', marginTop: '4px' }}
                    />
                  </td>
                  <td className="text-end">${item.unitCost.toFixed(2)}</td>
                  <td className="text-end">${item.lineCost.toFixed(2)}</td>
                  <td className="text-center">
                    {item.canBuild ? (
                      <Badge bg="success">OK</Badge>
                    ) : (
                      <Badge bg="danger">
                        Need {item.quantity - item.available}
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={4} className="text-end">Total:</th>
              <th className="text-end">${breakdown.totalCost.toFixed(2)}</th>
              <th></th>
            </tr>
          </tfoot>
        </Table>

        {!availability.canBuild && (
          <div className="alert alert-warning">
            <strong>Missing Parts:</strong>
            <ul className="mb-0 mt-2">
              {availability.missingItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <hr />

        <ButtonGroup>
          <Link to={`/bom/${bom.id}/edit`} className="btn btn-primary">
            <FaEdit className="me-1" aria-hidden="true" /> Edit
          </Link>
          <Button variant="secondary" onClick={handleDuplicate} aria-label="Duplicate BOM">
            <FaCopy className="me-1" aria-hidden="true" /> Duplicate
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)} aria-label="Delete BOM">
            <FaTrash className="me-1" aria-hidden="true" /> Delete
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate('/bom')}>
            Back to List
          </Button>
        </ButtonGroup>
      </Card.Body>

        <ConfirmModal
          show={showDeleteModal}
          title="Delete BOM"
          message={`Are you sure you want to delete "${bom.name}"?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      </Card>
    </>
  );
}
