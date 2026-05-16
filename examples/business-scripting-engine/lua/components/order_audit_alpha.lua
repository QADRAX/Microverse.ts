local C = component:extend()

---@param evt MicroverseEvt_OrderPlaced
function C:onOrderPlaced(evt)
  self.bridges.audit:record({ line = "alpha:" .. evt.orderId })
end
