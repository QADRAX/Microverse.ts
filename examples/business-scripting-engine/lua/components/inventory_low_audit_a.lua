local C = component:extend()

function C:onInventoryLow(evt)
  local u = self.bridges.inventory:getUnits({ sku = evt.sku })
  self.bridges.audit:record({ line = "inv-a:" .. evt.sku .. ":units=" .. tostring(u.units) })
end
