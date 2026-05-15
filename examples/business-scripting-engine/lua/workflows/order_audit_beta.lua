local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  audit:record({ line = "beta:" .. evt.orderId })
end
