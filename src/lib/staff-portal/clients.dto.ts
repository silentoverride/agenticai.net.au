/**
 * Client CRM DTOs and Zod schemas
 *
 * Module: Epic 11 — Clients CRM (post-MVP track).
 * Triggered by Sprint Change Proposal 2026-06-05-clients-crm-page.
 *
 * All types in this module are client-safe (serializable) and do not import
 * server-only modules. Validation schemas live next to the types so the
 * server and UI can share the same source of truth.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const CLIENT_STATUSES = ['active', 'inactive', 'prospect', 'archived'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_INDUSTRIES = [
  'consulting',
  'trades',
  'professional-services',
  'retail',
  'hospitality',
  'health',
  'construction',
  'manufacturing',
  'technology',
  'education',
  'non-profit',
  'other'
] as const;
export type ClientIndustry = (typeof CLIENT_INDUSTRIES)[number];

export const CLIENT_COMPANY_SIZES = ['1-5', '6-20', '21-50', '51-200', '200+'] as const;
export type ClientCompanySize = (typeof CLIENT_COMPANY_SIZES)[number];

export const CLIENT_LEAD_SOURCES = [
  'referral',
  'website',
  'social-media',
  'event',
  'cold-outreach',
  'partnership',
  'other'
] as const;
export type ClientLeadSource = (typeof CLIENT_LEAD_SOURCES)[number];

export const CLIENT_FILE_CATEGORIES = [
  'recording',
  'report',
  'contract',
  'invoice',
  'signed-document',
  'note',
  'other'
] as const;
export type ClientFileCategory = (typeof CLIENT_FILE_CATEGORIES)[number];

export const CLIENT_INTERACTION_TYPES = [
  'phone',
  'email',
  'meeting',
  'work',
  'note',
  'status_update'
] as const;
export type ClientInteractionType = (typeof CLIENT_INTERACTION_TYPES)[number];

export const CLIENT_TASK_TYPES = ['task', 'appointment'] as const;
export type ClientTaskType = (typeof CLIENT_TASK_TYPES)[number];

export const CLIENT_TASK_STATUSES = ['open', 'in_progress', 'completed', 'cancelled'] as const;
export type ClientTaskStatus = (typeof CLIENT_TASK_STATUSES)[number];

export const CLIENT_TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type ClientTaskPriority = (typeof CLIENT_TASK_PRIORITIES)[number];

// ---------------------------------------------------------------------------
// Zod schemas (shared by server validation and any client-side forms)
// ---------------------------------------------------------------------------

export const clientCompanySchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(200),
  tradingName: z.string().trim().max(200).optional().nullable(),
  primaryContactName: z.string().trim().max(200).optional().nullable(),
  jobTitle: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().email('Must be a valid email').max(320).optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(40).optional().nullable().or(z.literal('')),
  secondaryPhone: z.string().trim().max(40).optional().nullable().or(z.literal('')),
  website: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  billingAddress: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  shippingAddress: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  taxId: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  industry: z.enum(CLIENT_INDUSTRIES).optional().nullable(),
  companySize: z.enum(CLIENT_COMPANY_SIZES).optional().nullable(),
  leadSource: z.enum(CLIENT_LEAD_SOURCES).optional().nullable(),
  assignedStaffId: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  status: z.enum(CLIENT_STATUSES).default('active'),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  customFields: z.record(z.string(), z.unknown()).default({})
});

export const clientFileMetaSchema = z.object({
  category: z.enum(CLIENT_FILE_CATEGORIES).default('other'),
  description: z.string().trim().max(2000).optional().nullable().or(z.literal(''))
});

export const clientInteractionSchema = z.object({
  type: z.enum(CLIENT_INTERACTION_TYPES),
  summary: z.string().trim().min(1, 'Summary is required').max(4000),
  occurredAt: z.string().trim().min(1), // ISO timestamp
  staffId: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  linkedFileIds: z.array(z.string()).default([]),
  linkedTaskIds: z.array(z.string()).default([])
});

export const clientTaskSchema = z.object({
  type: z.enum(CLIENT_TASK_TYPES),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(4000).optional().nullable().or(z.literal('')),
  dueAt: z.string().trim().min(1), // ISO timestamp
  assignedStaffId: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  status: z.enum(CLIENT_TASK_STATUSES).default('open'),
  priority: z.enum(CLIENT_TASK_PRIORITIES).default('normal')
});

// Partial schemas for updates (everything optional)
export const clientUpdateSchema = clientCompanySchema.partial().extend({
  status: z.enum(CLIENT_STATUSES).optional()
});
export const clientInteractionUpdateSchema = clientInteractionSchema.partial();
export const clientTaskUpdateSchema = clientTaskSchema.partial();

// ---------------------------------------------------------------------------
// DTOs (returned by API to client)
// ---------------------------------------------------------------------------

export interface ClientDto {
  id: string;
  clerkUserId: string | null;
  companyName: string;
  tradingName: string | null;
  primaryContactName: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  website: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  taxId: string | null;
  industry: string | null;
  companySize: string | null;
  leadSource: string | null;
  assignedStaffId: string | null;
  status: ClientStatus;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListItemDto {
  id: string;
  companyName: string;
  primaryContactName: string | null;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  tags: string[];
  assignedStaffId: string | null;
  lastInteractionAt: string | null;
  openTaskCount: number;
  createdAt: string;
}

export interface ClientListResultDto {
  items: ClientListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientFileDto {
  id: string;
  clientId: string;
  fileName: string;
  fileType: string;
  category: ClientFileCategory;
  sizeBytes: number;
  description: string | null;
  uploadedBy: string;
  uploadedAt: string;
  /** Internal — used by services to construct R2 keys. Strip when serializing to client. */
  r2Key?: string;
}

export interface ClientInteractionDto {
  id: string;
  clientId: string;
  type: ClientInteractionType;
  staffId: string;
  summary: string;
  occurredAt: string;
  linkedFileIds: string[];
  linkedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientTaskDto {
  id: string;
  clientId: string;
  type: ClientTaskType;
  title: string;
  description: string | null;
  dueAt: string;
  assignedStaffId: string | null;
  status: ClientTaskStatus;
  priority: ClientTaskPriority;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Filters / search
// ---------------------------------------------------------------------------

export interface ClientListFilters {
  search?: string;
  status?: ClientStatus;
  assignedStaffId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'companyName' | 'status' | 'createdAt' | 'lastInteraction';
  sortDir?: 'asc' | 'desc';
}

export interface ClientInteractionFilters {
  type?: ClientInteractionType;
  staffId?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
}
