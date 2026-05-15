--- Hub loads `lib/math_helpers.lua` via `sharedLuaChunks` before this file.
local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  local n = LuarizerMath.sum(evt.amountCents, 1)
  audit:record({ line = "prelude-sum:" .. tostring(n) .. ":order:" .. evt.orderId })
end
