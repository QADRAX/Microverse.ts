-- Intentionally calls billing without declaring billing:charge in the instance allowlist (see tests).

local C = component:extend()

---@param evt MicroverseEvt_OrderPlaced
function C:onOrderPlaced(evt)
  self.bridges.billing:charge({ orderId = evt.orderId, amountCents = 1 })
end
