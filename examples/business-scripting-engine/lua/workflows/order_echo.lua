-- Minimal workflow: proves file-based scripts load and run on events (used by unit test).
-- Add `---@param evt …` so LuaLS types `evt` (your implementation shadows `generated/businessSurface.d.lua`).

---@param evt LuarizerWorkflowEvt_OrderPlaced
function onOrderPlaced(evt)
  notifications:send({
    channel = "echo",
    message = "order:" .. evt.orderId .. ":amt:" .. tostring(evt.amountCents),
  })
end
