--- Hub loads `lib/math_helpers.lua` via `sharedLuaChunks` before this file.
local C = component:extend()

function C:onOrderPlaced(evt)
  local n = MicroverseMath.sum(evt.amountCents, 1)
  self.bridges.audit:record({ line = "prelude-sum:" .. tostring(n) .. ":order:" .. evt.orderId })
end
