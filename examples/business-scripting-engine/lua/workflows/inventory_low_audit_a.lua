local W = workflow:extend()

---@param evt LuarizerWorkflowEvt_InventoryLow
function W:onInventoryLow(evt)
  local u = inventory:getUnits({ sku = evt.sku })
  audit:record({ line = "inv-a:" .. evt.sku .. ":units=" .. tostring(u.units) })
end
