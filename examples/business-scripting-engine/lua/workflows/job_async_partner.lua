-- Consumer recipe (not Microverse engine async): sync `jobs:create`, host does TS async work, then emits `JobDone` hook.
local W = workflow:extend()

---@param evt MicroverseWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  local r = jobs:create({ label = "order:" .. evt.orderId })
  audit:record({ line = "job-started:" .. r.jobId .. ":order:" .. evt.orderId })
end

---@param evt MicroverseWorkflowEvt_JobDone
function W:onJobDone(evt)
  audit:record({ line = "job-finished:" .. evt.jobId .. ":result:" .. tostring(evt.result) })
end
