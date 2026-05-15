-- Intentionally calls billing without declaring billing:charge in the workflow allowlist (see tests).

local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  billing:charge({ orderId = evt.orderId, amountCents = 1 })
end
