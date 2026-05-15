-- Minimal workflow: proves file-based scripts load and run on events (used by unit test).

local W = workflow:extend()

---@param evt MicroverseWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  notifications:send({
    channel = "echo",
    message = "order:" .. evt.orderId .. ":amt:" .. tostring(evt.amountCents),
  })
end
