local C = component:extend()

function C:init()
  self.state = { hits = 0 }
end

function C:onPropsChanged(key, newValue)
  self.state.lastKey = key
  self.state.lastValue = newValue
end

function C:onOrderPlaced(evt)
  self.state.hits = (self.state.hits or 0) + 1
  local label = self.properties.label or "?"
  self.bridges.audit:record({
    line = "props:" .. label .. ":hits=" .. tostring(self.state.hits) .. ":order=" .. evt.orderId,
  })
end
