import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Badge } from 'react-bootstrap';
import * as itemService from '../../services/itemService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { Item } from '../../types/Item';
import { InventoryType } from '../../types/InventoryType';
import { formatCurrency } from '../../utils/formatters';

interface ChildItemsListProps {
  parentId: number;
  parentTypeName?: string;
}

export default function ChildItemsList({ parentId, parentTypeName }: ChildItemsListProps) {
  const [children, setChildren] = useState<Item[]>([]);
  const [typeMap, setTypeMap] = useState<Map<number, InventoryType>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChildren() {
      try {
        const [items, types] = await Promise.all([
          itemService.getItemChildren(parentId),
          inventoryTypeService.getAllTypes(),
        ]);
        setChildren(items);
        setTypeMap(new Map(types.map((t) => [t.id, t])));
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    loadChildren();
  }, [parentId]);

  if (loading || children.length === 0) return null;

  return (
    <Card className="mt-3">
      <Card.Header>
        <h6 className="mb-0">
          Attached Items <Badge bg="secondary">{children.length}</Badge>
        </h6>
      </Card.Header>
      <Card.Body className="p-0">
        <Table hover responsive className="mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-center">Type</th>
              <th className="text-center">Category</th>
              <th className="text-center">Value</th>
            </tr>
          </thead>
          <tbody>
            {children.map((child) => {
              const childType = typeMap.get(child.inventoryTypeId);
              return (
                <tr key={child.id}>
                  <td>
                    <Link to={`/items/${child.id}`}>{child.name}</Link>
                  </td>
                  <td className="text-center">
                    {parentTypeName && <Badge bg="primary" className="me-1">{parentTypeName}</Badge>}
                    {childType && <Badge bg="secondary">{childType.name}</Badge>}
                  </td>
                  <td className="text-center">{child.category}</td>
                  <td className="text-center">{formatCurrency(child.unitValue)}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
