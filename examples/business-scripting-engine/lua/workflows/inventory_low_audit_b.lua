local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_InventoryLow
function W:onInventoryLow(evt)
  local u = inventory:getUnits({ sku = evt.sku })
  audit:record({ line = "inv-b:" .. evt.sku .. ":units=" .. tostring(u.units) })
end
