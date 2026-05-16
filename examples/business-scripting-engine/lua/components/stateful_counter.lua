-- Component: Lua-local state survives across host→Lua hook invocations in the same slot.
local C = component:extend()

function C:init()
  self.state = { count = 0 }
end

function C:onOrderPlaced(evt)
  self.state.count = self.state.count + 1
  self.bridges.audit:record({ line = "counter:n=" .. tostring(self.state.count) .. ":id=" .. evt.orderId })
end
