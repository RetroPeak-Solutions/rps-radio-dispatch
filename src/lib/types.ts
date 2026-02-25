// types.ts
export type TokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";
export type RuleType = "USER_ID" | "USER_ATTRIBUTE" | "PERMISSION" | "GROUP_MEMBERSHIP" | "PERCENTAGE" | "CUSTOM";
export type BillingCycle = "MONTHLY" | "YEARLY";
export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING"
  | "UNPAID";
export type RadioBandwidth = "NARROW" | "WIDE";
export type RadioPowerLevel = "LOW" | "MEDIUM" | "HIGH" | "TURBO";
export type RadioTxAdmitCriteria = "ALWAYS" | "CHANNEL_FREE" | "CORRECT_TONE";
export type RadioSquelchMode = "CARRIER" | "CTCSS" | "DCS";
export type RadioVendor = "MOTOROLA" | "KENWOOD" | "UNICATION";
export type RadioDeviceType = "MOBILE" | "PORTABLE" | "PAGER";
export type AgencyType = "FIRE" | "EMS" | "LAW_ENFORCEMENT" | "MILITARY" | "DOT" | "PRIVATE_AGENCY";
export type RadioUiProfile = "CLASSIC" | "MODERN" | "TOUCH" | "MINIMAL" | "CUSTOM";

// User Token
export interface UserToken {
  id: string;
  token: string;
  userId: string;
  type: TokenType;
  expiresAt: Date;
  createdAt: Date;
  user: User;
}

// Session
export interface Session {
  id: string;
  userId: string;
  token: string;
  ip?: string;
  createdAt: Date;
  expiresAt: Date;
  user: User;
}

// Password
export interface Password {
  userId: string;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

// SystemAdmin
export interface SystemAdmin {
  id: string;
  userId: string;
  isActive: boolean;
  permissions: string;
  notes: string;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

// User
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId?: string;
  password: Password[];
  addresses: Address[];
  sessions: Session[];
  tokens: UserToken[];
  communities: Community[];
  systemAdmin?: SystemAdmin;
  subscriptions: CommunitySubscription[];
  communityMembers: CommunityMember[];
}

// Address
export interface Address {
  id: string;
  userId: string;
  Address: string;
  Address2: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
  Name: string;
  Phone: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

// Community
export interface Community {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  description?: string;
  fivemWebhookId: string;
  fivemApiKeyId: string;
  createdAt: Date;
  updatedAt: Date;
  isSuspended: boolean;
  paymentMethodId?: string;
  owner: User;
  members: CommunityMember[];
  subscriptions: CommunitySubscription[];
  radioZones: RadioZone[];
  radioChannels: RadioChannel[];
  quickCall2Tones: QuickCall2ToneSet[];
  rolePermissions: CommunityRolePermission[];
  codeplugs: CommunityCodeplug[];
  servers: CommunityServer[];
}

// CommunityMember
export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  radioId: string;
  role: string;
  permissions: string;
  isMuted: boolean;
  joinedAt: Date;
  updatedAt: Date;
  community: Community;
  user: User;
}

// CommunitySubscription
export interface CommunitySubscription {
  id: string;
  communityId: string;
  planId: string;
  stripeSubscriptionId: string;
  upgradePlanId?: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  planUpgradeDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  community: Community;
  plan: SubscriptionPlan;
  user?: User;
  userId?: string;
}

// SubscriptionPlan
export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  stripeProductId?: string;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  maxMembers: number;
  maxChannels: number;
  maxZones: number;
  maxTones: number;
  maxActiveUnits: number;
  maxServers: number;
  highlight: boolean;
  isPopular: boolean;
  features: string;
  createdAt: Date;
  updatedAt: Date;
  subscriptions: CommunitySubscription[];
  featurePlans: FeaturePlan[];
}

// RadioChannel
export interface RadioChannel {
  id: string;
  communityId: string;
  name: string;
  codeplugIndex: number;
  rxFrequencyMHz: string;
  txFrequencyMHz: string;
  bandwidth: RadioBandwidth;
  powerLevel: RadioPowerLevel;
  txAdmitCriteria: RadioTxAdmitCriteria;
  squelchMode: RadioSquelchMode;
  ctcssToneHz?: string;
  dcsCode?: number;
  talkaroundEnabled: boolean;
  busyChannelLockout: boolean;
  transmitTimeoutSecs?: number;
  scanListEnabled: boolean;
  rxOnly: boolean;
  quickCall2DecodeId?: string;
  quickCall2EncodeId?: string;
  createdAt: Date;
  updatedAt: Date;
  community: Community;
  zones: RadioZoneChannel[];
  quickCall2Decode?: QuickCall2ToneSet;
  quickCall2Encode?: QuickCall2ToneSet;
  communityCodeplugs: CommunityCodeplug[];
}

// RadioZone
export interface RadioZone {
  id: string;
  communityId: string;
  name: string;
  codeplugIndex: number;
  description?: string;
  isEnabled: boolean;
  scanEnabled: boolean;
  homeChannelSlot?: number;
  createdAt: Date;
  updatedAt: Date;
  community: Community;
  channels: RadioZoneChannel[];
  toneSets: RadioZoneToneSet[];
}

// RadioZoneChannel
export interface RadioZoneChannel {
  id: string;
  zoneId: string;
  channelId: string;
  zoneChannelPosition: number;
  aliasName?: string;
  isPriorityChannel: boolean;
  nuisanceDeleteLocked: boolean;
  talkbackEnabled: boolean;
  txInhibit: boolean;
  overridePowerLevel?: RadioPowerLevel;
  createdAt: Date;
  updatedAt: Date;
  zone: RadioZone;
  channel: RadioChannel;
}

// QuickCall2ToneSet
export interface QuickCall2ToneSet {
  id: string;
  communityId: string;
  name: string;
  description?: string;
  toneAFrequencyHz: string;
  toneBFrequencyHz: string;
  toneADurationMs: number;
  toneBDurationMs: number;
  autoResetSeconds?: number;
  callAlertOnly: boolean;
  isSequential: boolean;
  createdAt: Date;
  updatedAt: Date;
  community: Community;
  decodeChannels: RadioChannel[];
  encodeChannels: RadioChannel[];
  zoneAssignments: RadioZoneToneSet[];
}

// RadioZoneToneSet
export interface RadioZoneToneSet {
  id: string;
  zoneId: string;
  toneSetId: string;
  zoneTonePosition: number;
  createdAt: Date;
  updatedAt: Date;
  zone: RadioZone;
  toneSet: QuickCall2ToneSet;
}

// CommunityRolePermission
export interface CommunityRolePermission {
  id: string;
  communityId: string;
  role: string;
  permissions: string;
  createdAt: Date;
  updatedAt: Date;
  community: Community;
}

// CommunityCodeplug
export interface CommunityCodeplug {
  id: string;
  communityId: string;
  name: string;
  description?: string;
  vendor: RadioVendor;
  deviceType: RadioDeviceType;
  agencyType: AgencyType;
  modelName: string;
  hostVersion: string;
  codeplugVersion: string;
  radioAlias: string;
  serialNumber: string;
  radioIdPrefix: string;
  inCarMode?: string;
  uiProfile: RadioUiProfile;
  isPagerMode: boolean;
  hasPagerUI: boolean;
  pagerToneIds: string;
  pageChannelId?: string;
  modelSelectionsJson: string;
  systemsJson: string;
  qcListJson: string;
  zonesYamlJson: string;
  scanListsYamlJson: string;
  configJson: string;
  createdByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  community: Community;
  scanLists: CodeplugScanList[];
  pageChannel?: RadioChannel;
}

// CodeplugScanList
export interface CodeplugScanList {
  id: string;
  codeplugId: string;
  name: string;
  description?: string;
  channelIds: string;
  priorityChannelIds: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  codeplug: CommunityCodeplug;
}

// PricingFeature
export interface PricingFeature {
  id: string;
  name: string;
  description?: string;
  showInCompare: boolean;
  createdAt: Date;
  updatedAt: Date;
  featurePlans: FeaturePlan[];
}

// FeaturePlan
export interface FeaturePlan {
  id: string;
  featureId: string;
  planId: string;
  included: boolean;
  createdAt: Date;
  updatedAt: Date;
  feature: PricingFeature;
  plan: SubscriptionPlan;
}

// TeamMember
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  img: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}

// Setting
export interface Setting {
  id: number;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

// SystemHealth
export interface SystemHealth {
  id: string;
  key: string;
  status: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

// FeatureFlag
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules: FlagRule[];
  createdAt: Date;
  updatedAt: Date;
}

// FlagRule
export interface FlagRule {
  id: string;
  flagId: string;
  type: RuleType;
  priority: number;
  conditions: any; // JSON type
  percentage?: number;
  flag: FeatureFlag;
  createdAt: Date;
}