-- Demo: explicit async bridge `asyncio:tick`. Prefer onComplete (LuaLS-friendly); `:await()` also works at runtime.
local C = component:extend()

---@param evt MicroverseEvt_OrderPlaced
function C:onOrderPlaced(evt)
  self.bridges.asyncio:tick({ delayMs = 5, seed = evt.amountCents }, function(r)
    self.bridges.audit:record({ line = "asyncio-value:" .. tostring(r.value) .. ":order:" .. evt.orderId })
  end)
end
