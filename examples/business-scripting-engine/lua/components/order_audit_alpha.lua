local C = component:extend()

function C:onOrderPlaced(evt)
  self.bridges.audit:record({ line = "alpha:" .. evt.orderId })
end
