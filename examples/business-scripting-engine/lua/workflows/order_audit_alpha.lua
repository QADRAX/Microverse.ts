local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  audit:record({ line = "alpha:" .. evt.orderId })
end
