-- Workflow: promotions + inventory alerts (illustrative).
-- Loaded by tests via readWorkflowLua; bridges come from businessSurface (orders, billing, notifications).

function onOrderPlaced(evt)
  local o = orders.get({ orderId = evt.orderId })
  if o and o.totalCents >= 1000 then
    local amt = math.min(evt.amountCents, 1500)
    billing.charge({ orderId = evt.orderId, amountCents = amt })
    notifications.send({ channel = "audit", message = "charged for " .. evt.orderId })
  end
end

function onInventoryLow(evt)
  if evt.unitsLeft <= 2 then
    notifications.send({ channel = "ops", message = "low stock " .. evt.sku })
  end
end
