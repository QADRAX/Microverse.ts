-- Sync bridge `jobs:create` returns a job id; host completes work asynchronously and emits `JobDone` (see tests).
local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  local r = jobs:create({ label = "order:" .. evt.orderId })
  audit:record({ line = "job-started:" .. r.jobId .. ":order:" .. evt.orderId })
end

---@param evt LuarizerWorkflowEvt_JobDone
function W:onJobDone(evt)
  audit:record({ line = "job-finished:" .. evt.jobId .. ":result:" .. tostring(evt.result) })
end
