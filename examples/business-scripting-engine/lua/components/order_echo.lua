-- Minimal component: proves file-based scripts load and run on events (used by unit test).

local C = component:extend()

function C:onOrderPlaced(evt)
  self.bridges.notifications:send({
    channel = "echo",
    message = "order:" .. evt.orderId .. ":amt:" .. tostring(evt.amountCents),
  })
end
