/**
 * Connector Entity
 * @module entities/connector
 */

export {
  ConnectionPointId,
  ArrowType,
  LineType,
  CardinalityType,
  ConnectorSchema,
  CreateConnectorSchema,
  UpdateConnectorSchema,
} from './model/types';

export type {
  ConnectionPointId as ConnectionPointIdType,
  ArrowType as ArrowTypeValue,
  LineType as LineTypeValue,
  CardinalityType as CardinalityTypeValue,
  Connector,
  CreateConnectorDTO,
  UpdateConnectorDTO,
} from './model/types';
