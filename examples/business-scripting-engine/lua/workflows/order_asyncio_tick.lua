-- Uses async bridge `asyncio:tick` (handler returns Promise); runtime resolves before Lua continues.
local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  local r = asyncio:tick({ delayMs = 5, seed = evt.amountCents })
  audit:record({ line = "asyncio-value:" .. tostring(r.value) .. ":order:" .. evt.orderId })
end
