-- Intentionally calls billing without declaring billing:charge in the workflow allowlist (see tests).
---@param evt LuarizerWorkflowEvt_OrderPlaced
function onOrderPlaced(evt)
  billing:charge({ orderId = evt.orderId, amountCents = 1 })
end
