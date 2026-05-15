local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_OrderPlaced
function W:onOrderPlaced(evt)
  local n = luarizer_example_sum(evt.amountCents, 1)
  audit:record({ line = "prelude-sum:" .. tostring(n) .. ":order:" .. evt.orderId })
end
