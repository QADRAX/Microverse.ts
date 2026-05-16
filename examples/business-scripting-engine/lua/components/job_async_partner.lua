-- Consumer recipe (not Microverse engine async): sync `jobs:create`, host does TS async work, then emits `JobDone` hook.
local C = component:extend()

---@param evt MicroverseEvt_OrderPlaced
function C:onOrderPlaced(evt)
  local r = self.bridges.jobs:create({ label = "order:" .. evt.orderId })
  self.bridges.audit:record({ line = "job-started:" .. r.jobId .. ":order:" .. evt.orderId })
end

---@param evt MicroverseEvt_JobDone
function C:onJobDone(evt)
  self.bridges.audit:record({ line = "job-finished:" .. evt.jobId .. ":result:" .. tostring(evt.result) })
end
