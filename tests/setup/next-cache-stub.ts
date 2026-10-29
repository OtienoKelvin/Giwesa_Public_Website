export function cacheLife(_profile?: unknown): void {
  // Caching directives are transformed by Next.js at build time. They are
  // intentionally inert in the Vitest process.
  void _profile;
}

export function cacheTag(..._tags: string[]): void {
  void _tags;
}

export function updateTag(_tag: string): void {
  void _tag;
}

export function revalidateTag(_tag: string, _profile?: unknown): void {
  void _tag;
  void _profile;
}

export function revalidatePath(_path: string, _type?: unknown): void {
  void _path;
  void _type;
}
