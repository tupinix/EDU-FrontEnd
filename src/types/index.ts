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

// User & Auth Types
export interface User {
  id: string;
  tenantId: string;
  email: string;
  name?: string;
  role: 'admin' | 'engineer' | 'viewer';
  status: 'active' | 'suspended' | 'pending';
  lastLoginAt?: string;
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

// Alarm Management Types (ISA-18.2)
export type AlarmState = 'normal' | 'active_unack' | 'active_ack' | 'rtn_unack';
export type AlarmPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlarmConditionType = 'threshold' | 'bad_quality';

export interface ThresholdConfig {
  operator: '>' | '<' | '>=' | '<=';
  value: number;
  deadband?: number;
}

export interface BadQualityConfig {
  timeoutSeconds: number;
}

export interface AlarmDefinition {
  id: string;
  name: string;
  topic: string;
  conditionType: AlarmConditionType;
  conditionConfig: ThresholdConfig | BadQualityConfig;
  priority: AlarmPriority;
  enabled: boolean;
  currentState?: AlarmState;
  lastTriggeredAt?: string;
  lastValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlarmEvent {
  id: string;
  alarmId: string;
  alarmName: string;
  topic: string;
  priority: AlarmPriority;
  state: AlarmState;
  triggeredValue?: number;
  triggeredAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  notes?: string;
}

export interface AlarmSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}

// OEE Calculator Types
export interface OEEDefinition {
  id: string;
  tenantId?: string;
  name: string;
  statusTopic: string;
  statusRunningValue: string;
  statusFormat: 'numeric' | 'string';
  countTopic?: string;
  idealCycleSeconds: number;
  rejectTopic?: string;
  plannedHoursPerDay: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OEEMetrics {
  equipmentId: string;
  name: string;
  currentStatus: 'running' | 'stopped' | 'fault' | 'unknown';
  availability: number;
  performance: number | null;
  quality: number;
  oee: number;
  runMinutes: number;
  plannedMinutes: number;
  totalCount: number;
  goodCount: number;
  since: string;
}

export interface OEESnapshot {
  time: string;
  equipmentId: string;
  availability: number;
  performance: number | null;
  quality: number;
  oee: number;
  runMinutes: number;
  totalCount: number;
  goodCount: number;
}

// OPC-UA Types
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
}

export interface OpcUaSubscription {
  id: string;
  connectionId: string;
  nodeId: string;
  mqttTopic: string;
  samplingIntervalMs: number;
  enabled: boolean;
  brokerId?: string;
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

// ==========================================================
// Rule Engine Types
// ==========================================================

export type RuleOperator = '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'between';
export type RuleLogic = 'AND' | 'OR';
export type RuleActionType = 'alarm' | 'webhook' | 'mqtt_publish' | 'log';

export interface RuleCondition {
  topic: string;
  operator: RuleOperator;
  value: number | string | boolean;
  value2?: number;
}

export interface RuleAction {
  type: RuleActionType;
  config: Record<string, unknown>;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  conditions: RuleCondition[];
  logic: RuleLogic;
  actions: RuleAction[];
  throttleSeconds: number;
  enabled: boolean;
  lastTriggeredAt?: string;
  triggerCount: number;
  createdAt: string;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  triggeredAt: string;
  conditionValues: Record<string, unknown>;
  actionsExecuted: { type: string; success: boolean; error?: string }[];
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  conditions: RuleCondition[];
  logic: RuleLogic;
  actions: RuleAction[];
  throttleSeconds?: number;
  enabled?: boolean;
}

// ==========================================================
// Anomaly Detection Types
// ==========================================================

export type AnomalyType = 'zscore' | 'rate_of_change' | 'flatline';

export interface AnomalyDetection {
  id: string;
  topic: string;
  detectedAt: string;
  type: AnomalyType;
  value?: number;
  zScore?: number;
  mean?: number;
  stdDev?: number;
  message: string;
  acknowledged: boolean;
}

