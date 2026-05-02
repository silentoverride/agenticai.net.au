import type { SessionAuthObject } from '@clerk/backend';
import type { PendingSessionOptions } from '@clerk/shared/types';

declare global {
  namespace App {
    interface Locals {
      auth: (options?: PendingSessionOptions) => SessionAuthObject;
      user: { id: string; email?: string; name?: string } | null;
    }
  }
}

export {};
