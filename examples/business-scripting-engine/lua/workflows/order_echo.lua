-- Minimal workflow: proves file-based scripts load and run on events (used by unit test).

function onOrderPlaced(evt)
  notifications:send({
    channel = "echo",
    message = "order:" .. evt.orderId .. ":amt:" .. tostring(evt.amountCents),
  })
end
