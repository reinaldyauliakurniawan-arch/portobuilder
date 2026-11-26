/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Diisi route /edit/render: konten draft dari editor visual. */
    preview?: import('./lib/content').Preview;
  }
}
