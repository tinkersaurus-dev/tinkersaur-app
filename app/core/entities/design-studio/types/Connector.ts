import { z } from 'zod';
import { PointSchema } from './Shape';

// Connector entity - represents connections between shapes
export const ConnectorSchema = z.object({
  id: z.string(),
  type: z.string(), // 'line', 'arrow', 'association', etc.
  sourceShapeId: z.string(),
  targetShapeId: z.string(),
  style: z.enum(['straight', 'orthogonal', 'curved']).default('straight'),
  points: z.array(PointSchema).optional(), // For custom routing
  label: z.string().optional(), // Optional text label for the connector
  zIndex: z.number().default(0),
});

export type Connector = z.infer<typeof ConnectorSchema>;

// DTOs for connector creation/updates
export const CreateConnectorSchema = ConnectorSchema.omit({ id: true });
export type CreateConnectorDTO = z.infer<typeof CreateConnectorSchema>;

export const UpdateConnectorSchema = ConnectorSchema.partial().required({ id: true });
export type UpdateConnectorDTO = z.infer<typeof UpdateConnectorSchema>;
