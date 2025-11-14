import { z } from 'zod';
import { PointSchema } from './Shape';

// Connection point identifier (references a connection point defined by a shape)
export const ConnectionPointId = z.string();
export type ConnectionPointId = z.infer<typeof ConnectionPointId>;

// Arrow head types for connector endpoints
export const ArrowType = z.enum(['none', 'arrow', 'circle', 'diamond', 'triangle', 'filled-diamond', 'filled-triangle', 'filled-arrow', 'cross']);
export type ArrowType = z.infer<typeof ArrowType>;

// Line style types for connectors
export const LineType = z.enum(['solid', 'dotted', 'dashed']);
export type LineType = z.infer<typeof LineType>;

// Connector entity - represents connections between shapes
export const ConnectorSchema = z.object({
  id: z.string(),
  type: z.string(), // 'line', 'arrow', 'association', etc.
  sourceShapeId: z.string(),
  targetShapeId: z.string(),
  // Connection points are now optional - if not specified, they're calculated dynamically
  // to always connect to the closest pair of connection points
  sourceConnectionPoint: ConnectionPointId.optional(), // Which connection point on source shape
  targetConnectionPoint: ConnectionPointId.optional(), // Which connection point on target shape
  style: z.enum(['straight', 'orthogonal', 'curved']).default('orthogonal'),
  arrowType: ArrowType.default('arrow'), // Arrow head style (DEPRECATED: use markerEnd)
  markerStart: ArrowType.default('none'), // Marker at the start of the connector (source end)
  markerEnd: ArrowType.default('arrow'), // Marker at the end of the connector (target end)
  lineType: LineType.default('solid'), // Line style
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
