-- Workflow: promotions + inventory alerts (illustrative).
-- Loaded by tests via readWorkflowLua; bridges come from businessSurface (orders, billing, notifications).
--
-- LuaLS: each hook is implemented in this file, so `function …(evt)` shadows the stub in
-- `generated/businessSurface.d.lua`. Add `---@param evt LuarizerWorkflowEvt_*` on every hook or `evt` stays `any`.
-- Lua table literals use `=`; LuaCATS record types use `field: type` separated by `;` in the generated aliases.
-- Prefer bridge calls like `orders:get({ orderId = evt.orderId })` (colon = method on table).

---@param evt LuarizerWorkflowEvt_OrderPlaced
function onOrderPlaced(evt)
  local o = orders:get({ orderId = evt.orderId })
  if o and o.totalCents >= 1000 then
    local amt = math.min(evt.amountCents, 1500)
    billing:charge({ orderId = evt.orderId, amountCents = amt })
    notifications:send({ channel = "audit", message = "charged for " .. evt.orderId })
  end
end

---@param evt LuarizerWorkflowEvt_InventoryLow
function onInventoryLow(evt)
  if evt.unitsLeft <= 2 then
    notifications:send({ channel = "ops", message = "low stock " .. evt.sku })
  end
end
