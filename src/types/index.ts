// ===========================================
// EDU Platform - Frontend Type Definitions
// ===========================================

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// System Metrics
export interface SystemMetrics {
  brokerStatus: 'connected' | 'degraded' | 'offline';
  brokerLatency?: number;
  messagesPerMinute: number;
  messagesPerHour: number;
  messagesPerDay: number;
  totalTopics: number;
  errorRate: number;
  uptime: number;
}

export interface ConnectorStatus {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: string;
  errorMessage?: string;
}

export interface DashboardMetrics {
  system: SystemMetrics;
  connectors: ConnectorStatus[];
  recentMessages: MQTTMessage[];
  topTopics: TopTopicItem[];
}

export interface TopTopicItem {
  topic: string;
  count: number;
}

// MQTT Message Types
export interface MQTTMessage {
  topic: string;
  payload: unknown;
  qos: 0 | 1 | 2;
  retain: boolean;
  timestamp: string;
}

// Topic Tree Types
export interface TopicNode {
  name: string;
  fullPath: string;
  children: TopicNode[];
  hasValue: boolean;
  lastValue?: unknown;
  lastUpdate?: string;
  messageCount: number;
}

export interface TopicDetail {
  topic: string;
  payload: unknown;
  qos: number;
  retain: boolean;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface TopicHistory {
  payload: unknown;
  qos: number;
  receivedAt: string;
}

export interface TopicStats {
  messageCount: number;
  avgValue?: number;
  minValue?: number;
  maxValue?: number;
  period: string;
}

// Hierarchy Types (ISA-95)
export interface HierarchyData {
  enterprises: Enterprise[];
}

export interface Enterprise {
  id: string;
  name: string;
  sites: Site[];
}

export interface Site {
  id: string;
  name: string;
  areas: Area[];
}

export interface Area {
  id: string;
  name: string;
  lines: Line[];
}

export interface Line {
  id: string;
  name: string;
  equipment: Equipment[];
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  tags: string[];
}

export interface HierarchyMapping {
  id: string;
  topicPattern: string;
  enterprise?: string;
  site?: string;
  area?: string;
  line?: string;
  equipment?: string;
  tagName?: string;
  tagType?: string;
  unit?: string;
  description?: string;
}

// Knowledge Graph editor — arbitrary nodes & relationships
export type GraphPropertyValue = string | number | boolean | null;
export type GraphProperties = Record<string, GraphPropertyValue>;

export interface GraphNode {
  id: string;
  labels: string[];
  properties: GraphProperties;
}

export interface GraphRelationship {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  properties: GraphProperties;
}

export interface RawGraph {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

// Cypher Query Result
export interface CypherResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  counters: Record<string, number>;
  resultAvailableAfter: number | null;
}

// User & Auth Types
export interface User {
  id: string;
  tenantId: string;
  email: string;
  name?: string;
  role: 'admin' | 'engineer' | 'viewer';
  status: 'active' | 'suspended' | 'pending';
  lastLoginAt?: string;
  /** Tenant info, populated by /auth/login and /auth/me responses */
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    plan?: string;
    status?: string;
  } | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// UI State Types
export interface SidebarState {
  isCollapsed: boolean;
  activeSection: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Broker Configuration Types
export interface BrokerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  useTls: boolean;
  topics: string[];
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected?: string;
  messageCount?: number;
  isDefault?: boolean;
}

export interface BrokerFormData {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  useTls: boolean;
  topics: string;
}

// Report Types
export interface ReportConfig {
  chartType: 'line' | 'bar' | 'area' | 'pie';
  title: string;
  description: string;
  query: {
    topics: string[];
    timeRange: { start: string; end: string };
    aggregation: 'raw' | 'minute' | 'hour';
    metric: 'value' | 'count' | 'avg' | 'min' | 'max';
  };
  visualization: {
    xAxis: string;
    yAxis: string;
    series: string[];
    colors?: string[];
  };
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  topic?: string;
  name?: string;
  [key: string]: unknown;
}

export interface ReportResult {
  config: ReportConfig;
  data: ChartDataPoint[];
  generatedAt: string;
}

// OPC-UA Types
// Modbus TCP Types
export interface ModbusConnection {
  id: string;
  tenantId?: string;
  name: string;
  host: string;
  port: number;
  unitId: number;
  timeoutMs: number;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  createdAt: string;
  updatedAt?: string;
}

export interface ModbusRegister {
  id: string;
  connectionId: string;
  name: string;
  registerType: 'coil' | 'discrete_input' | 'holding' | 'input';
  address: number;
  dataType: 'uint16' | 'int16' | 'int32' | 'float32' | 'boolean';
  scaleFactor: number;
  mqttTopic: string;
  samplingIntervalMs: number;
  brokerId?: string;
  enabled: boolean;
  createdAt: string;
}

export interface ModbusLiveValue {
  connectionId: string;
  registerId: string;
  name: string;
  registerType: string;
  address: number;
  value: number | boolean;
  rawValue: number;
  quality: 'good' | 'bad' | 'uncertain';
  timestamp: string;
  updateCount: number;
}

export interface OpcUaConnection {
  id: string;
  tenantId: string;
  name: string;
  endpointUrl: string;
  securityMode: string;
  username?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  createdAt: string;
  updatedAt: string;
  machineId?: string;
  site?: string;
  area?: string;
  euromapEnabled?: boolean;
  southboundArmed?: boolean;
  statusNodeId?: string;
}

// Kafka connector (Columbus slice 5.1) — public-safe view (no secrets).
export type KafkaSecurityProtocol = 'PLAINTEXT' | 'SASL_PLAINTEXT' | 'SASL_SSL' | 'SSL';
export type KafkaSaslMechanism = 'plain' | 'scram-sha-256' | 'scram-sha-512';
export type KafkaConnectorDirection = 'producer' | 'consumer' | 'both';

export interface KafkaConnector {
  id: string;
  name: string;
  bootstrapServers: string;
  securityProtocol: KafkaSecurityProtocol;
  saslMechanism?: KafkaSaslMechanism;
  saslUsername?: string;
  hasSaslPassword: boolean;
  consumerGroupId?: string;
  direction: KafkaConnectorDirection;
  produceTopics: string[];
  consumeTopics: string[];
  enabled: boolean;
  isActive: boolean;
  topicMap?: KafkaTopicMap;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  messageCount: number;
}

export interface KafkaTopicMap {
  northbound?: Record<string, string>;
  southbound?: Record<string, string>;
}

export interface KafkaConnectorInput {
  name: string;
  bootstrapServers: string;
  securityProtocol: KafkaSecurityProtocol;
  saslMechanism?: KafkaSaslMechanism;
  saslUsername?: string;
  saslPassword?: string;
  consumerGroupId?: string;
  direction?: KafkaConnectorDirection;
  produceTopics?: string[];
  consumeTopics?: string[];
  topicMap?: KafkaTopicMap;
}

export interface SouthboundCommand {
  id: string;
  machine_id: string;
  command_kind: string;
  /** Browse name of the invoked method (method-call commands only). */
  method_name?: string | null;
  idempotency_key: string;
  status: string;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpcUaSubscription {
  id: string;
  connectionId: string;
  nodeId: string;
  mqttTopic: string;
  samplingIntervalMs: number;
  enabled: boolean;
  brokerId?: string;
  /** Where the node value is published: MQTT/UNS (default) or a Kafka connector. */
  destinationKind?: 'mqtt' | 'kafka';
  connectorId?: string;
  /** Kafka message headers stamped on every publish (kafka destination only). */
  kafkaHeaders?: Record<string, string>;
  /** When false, the value is acquired (Monitor + internal modeling) but never
   *  published to a destination nor ingested into the UNS. Default true. */
  publishRaw?: boolean;
  createdAt: string;
}

export interface NodeLiveValue {
  connectionId: string;
  nodeId: string;
  displayName: string;
  value: unknown;
  dataType: string;
  quality: string;
  timestamp: string;
  updateCount: number;
}

// EtherNet/IP Types
export interface EthipConnection {
  id: string;
  name: string;
  host: string;
  slot: number;
  plcType: 'logix' | 'slc' | 'micro800';
  status: string;
  plcInfo?: Record<string, unknown>;
  createdAt: string;
}

export interface EthipTag {
  id: string;
  connectionId: string;
  tagName: string;
  // For STRUCT tags: dotted path to the atomic member to publish (e.g. "PV").
  memberPath?: string;
  displayName?: string;
  dataType?: string;
  mqttTopic: string;
  samplingIntervalMs: number;
  brokerId?: string;
  enabled: boolean;
}

export interface EthipDiscoveredTag {
  tag_name: string;
  data_type: string;
  dim: number;
}

export interface EthipLiveValue {
  connectionId: string;
  tagName: string;
  value: unknown;
  dataType?: string;
  quality: string;
  timestamp: string;
  updateCount: number;
}

// Data Model Types
export interface DataModel {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  sourceTopic: string;
  sourceBrokerId?: string;
  /** Where the source data comes from: an MQTT broker (default), a Kafka
   *  connector, or the internal acquisition bus (tag store, no broker trip). */
  sourceKind?: 'mqtt' | 'kafka' | 'internal';
  sourceConnectorId?: string;
  targetTopic: string;
  targetBrokerId?: string;
  /** Where the modeled output is published: MQTT broker (default) or a Kafka connector. */
  targetKind?: 'mqtt' | 'kafka';
  targetConnectorId?: string;
  enterprise?: string;
  site?: string;
  area?: string;
  line?: string;
  equipment?: string;
  tagName?: string;
  unit?: string;
  dataType?: string;
  tagDescription?: string;
  fieldMappings: { source: string; target: string; transform: string; transformConfig?: Record<string, unknown> }[];
  extraFields: Record<string, unknown>;
  messagesProcessed: number;
  lastProcessedAt?: string;
  createdAt: string;
}

// MCP Connection Types
export interface McpToken {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  expiresAt: string;
  lastUsedAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface McpTokenCreated extends McpToken {
  token: string; // Only returned on creation, never shown again
  scope: string;
  role: string;
}

// Alert Rule Types
// ===========================================
// Organizations (multi-tenant)
// ===========================================

export type OrgPlan = 'trial' | 'starter' | 'professional' | 'enterprise';
export type OrgStatus = 'active' | 'suspended' | 'deleted';

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  mqttPrefix: string;
  status: OrgStatus;
  plan: OrgPlan;
  contactEmail?: string;
  logoUrl?: string;
  maxUsers: number;
  maxConnections: number;
  createdAt: string;
  updatedAt?: string;
  userCount?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  sourceTopic: string;
  // Optional broker to pull the source data from; unset = any connected broker
  sourceBrokerId?: string;
  valueField: string;
  // Thresholds support either a static number or a dynamic `{{topic.field}}` reference
  goodMin?: number | string;
  goodMax?: number | string;
  warnMin?: number | string;
  warnMax?: number | string;
  webhookUrl?: string;
  notifyDiscord: boolean;
  notifyTeams: boolean;
  teamsWebhookUrl?: string;
  notifyWhatsapp: boolean;
  whatsappTo?: string;
  notifyOnGood: boolean;
  notifyOnWarn: boolean;
  notifyOnBad: boolean;
  cooldownSeconds: number;
  currentStatus: string;
  lastValue?: number;
  lastNotifiedAt?: string;
  totalNotifications: number;
  createdAt: string;
}

// Process Dashboard Types
export interface DashboardWidget {
  id: string;
  type: 'gauge' | 'trend' | 'value' | 'label' | 'status' | 'tank' | 'bar' | 'image' | 'rectangle' | 'text' | 'pipe' | 'sparkline' | 'alarm' | 'kpi' | 'radial' | 'table';
  x: number; y: number; width: number; height: number; zIndex: number;
  config: Record<string, unknown>;
}

export interface ProcessDashboard {
  id: string; userId: string; name: string; description?: string;
  canvasWidth: number; canvasHeight: number; backgroundColor: string;
  widgets: DashboardWidget[]; isDefault: boolean; shareToken?: string; createdAt: string;
}

// ── Virtual Sensors (derived tags computed from other tags) ──
export interface VirtualSensorInput {
  var: string;       // variable name used in the expression (e.g. "a")
  topic: string;     // source tag topic
  brokerId?: string; // broker scope (empty = active)
  field?: string;    // payload field (default: value)
}

export interface VirtualSensorStatus {
  lastValue: number | null;
  lastError: string | null;
  lastRunAt: string | null;
}

export interface VirtualSensor {
  id: string;
  name: string;
  outputTopic: string;
  expression: string;
  inputs: VirtualSensorInput[];
  unit?: string;
  intervalMs: number;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
  status?: VirtualSensorStatus;
}

export interface VirtualSensorInputForm {
  name: string;
  outputTopic: string;
  expression: string;
  inputs: VirtualSensorInput[];
  unit?: string;
  intervalMs?: number;
  enabled?: boolean;
}

// ── EUROMAP / OPC-UA events, history & alarms (Events monitor) ──
export interface EuromapEvent {
  eventId: string | null;
  eventTypeName?: string;
  eventTypeNodeId: string;
  sourceTimestamp: string | null;
  receiveTimestamp: string | null;
  kind?: string;           // cycle | box-change | status | alarm | undefined
  fields: Record<string, unknown>;
  processValues?: Array<{ name?: string; value?: unknown; unit?: string }>;
  sourceNode?: string;
}

export interface MachineAlarm {
  id: string;
  severity: number;
  message: string;
  classification?: number;
  equipmentIdentifier?: string;
}

// SM Profile Types (CESMII)
export interface SmProfileAttribute {
  name: string;
  displayName: string;
  dataType: string;
  unit?: string;
  description?: string;
}

export interface SmProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  source: string;
  attributes: SmProfileAttribute[];
  attributeCount?: number;
}

// License Types
export interface License {
  id: string;
  customerName: string;
  customerEmail: string;
  plan: 'demo' | 'starter' | 'professional' | 'enterprise';
  edition: string;
  maxDevices: number;
  features: Record<string, unknown>;
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
  createdAt: string;
}

export interface LicenseStatus {
  valid: boolean;
  plan: string;
  customer?: string;
  expiresAt?: string;
  daysRemaining?: number;
  trial: boolean;
  trialDaysRemaining?: number;
  features: Record<string, boolean | number>;
  limits: Record<string, number>;
}

// ===========================================
// Network Discovery Types
// ===========================================

export type DiscoveryProtocolKind = 'modbus' | 'ethernetip' | 'opcua' | 'mqtt' | 's7' | 'http-hmi';

export interface DiscoveredProtocol {
  kind: DiscoveryProtocolKind;
  port: number;
  vendor?: string;
  product?: string;
  firmware?: string;
  details?: Record<string, unknown>;
  connectHint?: { protocol: string; fields: Record<string, unknown> };
}

export interface DiscoveredDevice {
  id: string;
  ip: string;
  hostname?: string;
  protocols: DiscoveredProtocol[];
  discoveredAt: string;
}

export interface DiscoveryScan {
  id: string;
  cidr: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'cancelled' | 'error';
  hostsTotal: number;
  hostsScanned: number;
  devicesFound: number;
  devices: DiscoveredDevice[];
  error?: string;
}

