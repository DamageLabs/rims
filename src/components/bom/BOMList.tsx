import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Badge } from 'react-bootstrap';
import { FaPlus, FaEye, FaEdit, FaTrash, FaClipboardList } from 'react-icons/fa';
import * as bomService from '../../services/bomService';
import { BOM } from '../../types/BOM';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';
import EmptyState from '../common/EmptyState';

export default function BOMList() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [bomCosts, setBomCosts] = useState<Map<number, string>>(new Map());
  const [bomAvailability, setBomAvailability] = useState<Map<number, boolean>>(new Map());
  const [deleteTarget, setDeleteTarget] = useState<BOM | null>(null);
  const { showSuccess, showError } = useAlert();

  useEffect(() => {
    loadBOMs();
  }, []);

  const loadBOMs = async () => {
    const allBOMs = await bomService.getAllBOMs();
    setBoms(allBOMs);

    const costs = new Map<number, string>();
    const availability = new Map<number, boolean>();
    for (const bom of allBOMs) {
      const breakdown = await bomService.calculateBOMCost(bom.id);
      costs.set(bom.id, breakdown ? `$${breakdown.totalCost.toFixed(2)}` : 'N/A');
      const avail = await bomService.checkAvailability(bom.id);
      availability.set(bom.id, avail.canBuild);
    }
    setBomCosts(costs);
    setBomAvailability(availability);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const success = await bomService.deleteBOM(deleteTarget.id);
    if (success) {
      showSuccess(`BOM "${deleteTarget.name}" deleted.`);
      await loadBOMs();
    } else {
      showError('Failed to delete BOM.');
    }
    setDeleteTarget(null);
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Bill of Materials</h4>
        <Link to="/bom/new" className="btn btn-primary">
          <FaPlus className="me-1" /> New BOM
        </Link>
      </Card.Header>
      <Card.Body>
        {boms.length === 0 ? (
          <EmptyState
            icon={FaClipboardList}
            title="No BOMs created yet"
            description="Create your first Bill of Materials to group items into projects."
            actionLabel="Create First BOM"
            actionPath="/bom/new"
          />
        ) : (
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Items</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {boms.map((bom) => (
                <tr key={bom.id}>
                  <td>
                    <Link to={`/bom/${bom.id}`}>{bom.name}</Link>
                  </td>
                  <td>{bom.items.length}</td>
                  <td>{bomCosts.get(bom.id) ?? 'N/A'}</td>
                  <td>
                    {bomAvailability.get(bom.id) ? (
                      <Badge bg="success">Can Build</Badge>
                    ) : (
                      <Badge bg="warning">Missing Parts</Badge>
                    )}
                  </td>
                  <td>{new Date(bom.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Link
                        to={`/bom/${bom.id}`}
                        className="btn btn-sm btn-outline-primary"
                        aria-label={`View ${bom.name}`}
                      >
                        <FaEye aria-hidden="true" />
                      </Link>
                      <Link
                        to={`/bom/${bom.id}/edit`}
                        className="btn btn-sm btn-outline-secondary"
                        aria-label={`Edit ${bom.name}`}
                      >
                        <FaEdit aria-hidden="true" />
                      </Link>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setDeleteTarget(bom)}
                        aria-label={`Delete ${bom.name}`}
                      >
                        <FaTrash aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete BOM"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
