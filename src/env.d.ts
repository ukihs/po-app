/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: {
      uid: string;
      email: string;
      displayName: string;
      role: 'employee' | 'supervisor' | 'procurement' | 'admin';
      emailVerified: boolean;
    } | null;
  }
}