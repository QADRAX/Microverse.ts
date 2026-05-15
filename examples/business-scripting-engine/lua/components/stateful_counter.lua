-- Component-style: Lua-local state survives across host→Lua hook invocations in the same slot.
local state = { count = 0 }

local W = workflow:extend()

---@param evt MicroverseWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  state.count = state.count + 1
  audit:record({ line = "counter:n=" .. tostring(state.count) .. ":id=" .. evt.orderId })
end
