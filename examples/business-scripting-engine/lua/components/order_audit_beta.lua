local C = component:extend()

function C:onOrderPlaced(evt)
  self.bridges.audit:record({ line = "beta:" .. evt.orderId })
end
