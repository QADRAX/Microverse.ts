/** Builds a Lua long literal `[=*[ ... ]=*]` so `source` can contain `]`, newlines, etc. */
export function toLuaLongStringLiteral(source: string): string {
  let eq = 0;
  while (true) {
    const close = `]${'='.repeat(eq)}]`;
    if (!source.includes(close)) {
      break;
    }
    eq += 1;
  }
  const open = `[${'='.repeat(eq)}[`;
  const shut = `]${'='.repeat(eq)}]`;
  return `${open}${source}${shut}`;
}
