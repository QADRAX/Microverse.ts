local C = component:extend()

---@param evt MicroverseEvt_OrderPlaced
function C:onOrderPlaced(evt)
  self.bridges.audit:record({ line = "beta:" .. evt.orderId })
end
