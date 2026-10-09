import type { AuthenticatedUser } from '$lib/types/auth';

declare global {
  namespace App {
    interface Error {
      message: string;
    }

    interface Locals {
      user?: AuthenticatedUser;
      roles: string[];
      permissions: string[];
      mfa?: {
        enabled?: boolean;
        required?: boolean;
        verified?: boolean;
        [key: string]: unknown;
      };
    }

    interface PageData {
      user?: AuthenticatedUser;
      permissions?: string[];
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface PageState {}

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Platform {}
  }
}

export {};
