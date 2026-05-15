-- Demo: explicit async bridge `asyncio:tick`. Prefer onComplete (LuaLS-friendly); `:await()` also works at runtime.
local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  asyncio:tick({ delayMs = 5, seed = evt.amountCents }, function(r)
    audit:record({ line = "asyncio-value:" .. tostring(r.value) .. ":order:" .. evt.orderId })
  end)
end
