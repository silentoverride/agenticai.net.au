import type { SessionAuthObject } from '@clerk/backend';
import type { PendingSessionOptions } from '@clerk/shared/types';

// Cloudflare platform bindings
interface EnvBindings {
  assessment_db: D1Database;
  assessment_blobs: R2Bucket;
  assessment_queue: Queue;
}

declare global {
  namespace App {
    interface Locals {
      auth: (options?: PendingSessionOptions) => SessionAuthObject;
      user: { id: string; email?: string; name?: string } | null;
    }
    interface Platform {
      env: EnvBindings;
      cf: CfProperties;
      ctx: ExecutionContext;
    }
  }
}

export {};
