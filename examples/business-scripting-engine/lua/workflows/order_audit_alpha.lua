local W = workflow:extend()

---@param evt MicroverseWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  audit:record({ line = "alpha:" .. evt.orderId })
end
