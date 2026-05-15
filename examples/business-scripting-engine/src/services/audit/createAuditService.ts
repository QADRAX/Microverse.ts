/**
 * Append-only audit trail used by workflows (e.g. to prove every script ran on the same host event).
 */
export function createAuditService() {
  const lines: string[] = [];
  return {
    record: (line: string): void => {
      lines.push(line);
    },
    getLines: (): readonly string[] => lines,
  };
}
