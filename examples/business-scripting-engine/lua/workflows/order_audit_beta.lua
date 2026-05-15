local W = workflow:extend()

---@param evt MicroverseWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  audit:record({ line = "beta:" .. evt.orderId })
end
