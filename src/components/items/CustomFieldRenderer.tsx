import { Form, Row, Col } from 'react-bootstrap';
import { FieldDefinition } from '../../types/InventoryType';

interface CustomFieldRendererProps {
  schema: FieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function CustomFieldRenderer({
  schema,
  values,
  onChange,
  readOnly = false,
}: CustomFieldRendererProps) {
  if (schema.length === 0) return null;

  return (
    <fieldset className="mb-4">
      <legend className="h6 text-muted border-bottom pb-2 mb-3">Type-Specific Fields</legend>
      {schema.map((field) => (
        <Row className="mb-3" key={field.key}>
          <Form.Label column sm={3}>
            {field.label}
            {field.required && <span className="text-danger"> *</span>}
          </Form.Label>
          <Col sm={5}>
            {renderField(field, values[field.key], onChange, readOnly)}
          </Col>
        </Row>
      ))}
    </fieldset>
  );
}

function renderField(
  field: FieldDefinition,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
  readOnly: boolean
) {
  switch (field.type) {
    case 'select':
      return (
        <Form.Select
          value={String(value || '')}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={readOnly}
          required={field.required}
        >
          <option value="">-- Select --</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Form.Select>
      );
    case 'boolean':
      return (
        <Form.Check
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(field.key, e.target.checked)}
          disabled={readOnly}
          label={field.label}
        />
      );
    case 'number':
      return (
        <Form.Control
          type="number"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => onChange(field.key, e.target.value ? parseFloat(e.target.value) : '')}
          placeholder={field.placeholder}
          disabled={readOnly}
          required={field.required}
        />
      );
    case 'date':
      return (
        <Form.Control
          type="date"
          value={String(value || '')}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={readOnly}
          required={field.required}
        />
      );
    case 'text':
    default:
      return (
        <Form.Control
          type="text"
          value={String(value || '')}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          disabled={readOnly}
          required={field.required}
        />
      );
  }
}
