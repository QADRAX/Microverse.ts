/**
 * Minimal job id factory for demos (sync bridge). Async completion is modeled by the host calling
 * {@link BusinessScriptingEngine.emitWorkflowHook} with `JobDone` after I/O finishes.
 */
export function createJobsService() {
  let seq = 0;
  return {
    createJob(_label: string): string {
      seq += 1;
      return `job-${seq}`;
    },
  };
}
