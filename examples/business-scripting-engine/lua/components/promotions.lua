-- Component: promotions + inventory alerts (illustrative).
-- Loaded by tests via readComponentLua; bridges via self.bridges (orders, billing, notifications).

local C = component:extend()

---@param evt MicroverseEvt_OrderPlaced
function C:onOrderPlaced(evt)
  local o = self.bridges.orders:get({ orderId = evt.orderId })
  if o and o.totalCents >= 1000 then
    local amt = math.min(evt.amountCents, 1500)
    self.bridges.billing:charge({ orderId = evt.orderId, amountCents = amt })
    self.bridges.notifications:send({ channel = "audit", message = "charged for " .. evt.orderId })
  end
end

---@param evt MicroverseEvt_InventoryLow
function C:onInventoryLow(evt)
  if evt.unitsLeft <= 2 then
    self.bridges.notifications:send({ channel = "ops", message = "low stock " .. evt.sku })
  end
end
