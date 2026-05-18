---@meta
---@type quick_sortScriptComponent
local C = SortingAlgorithm:extend()

local function popRange(stack)
  if #stack < 2 then
    return nil, nil, stack
  end
  local high = table.remove(stack)
  local low = table.remove(stack)
  return low, high, stack
end

local function pushRange(stack, low, high)
  if low < high then
    stack[#stack + 1] = low
    stack[#stack + 1] = high
  end
  return stack
end

function C:onTick(_evt)
  if self.state.done then
    return
  end
  local n = self.bridges.array:length()
  if n <= 1 then
    self.state.done = true
    self.bridges.sort:markDone()
    return
  end

  local stack = self.state.stack
  local low = self.state.low
  local high = self.state.high
  local pivot = self.state.pivot
  local pIndex = self.state.pIndex
  local i = self.state.i

  if pivot ~= nil and low ~= nil and high ~= nil and pIndex ~= nil and i ~= nil then
    if i < high then
      self.bridges.viz:markComparing({ a = i, b = pivot })
      if self.bridges.array:compare({ a = i, b = pivot }) < 0 then
        self.bridges.array:swap({ a = pIndex, b = i })
        self.bridges.viz:highlight({ indices = { pIndex, i } })
        pIndex = pIndex + 1
      end
      self.state.pIndex = pIndex
      self.state.i = i + 1
      return
    end

    self.bridges.array:swap({ a = pIndex, b = pivot })
    self.bridges.viz:highlight({ indices = { pIndex, pivot } })

    stack = stack or {}
    stack = pushRange(stack, low, pIndex - 1)
    stack = pushRange(stack, pIndex + 1, high)

    self.state.stack = stack
    self.state.low = nil
    self.state.high = nil
    self.state.pivot = nil
    self.state.pIndex = nil
    self.state.i = nil
    return
  end

  if stack == nil then
    stack = { 0, n - 1 }
  elseif #stack == 0 then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end

  low, high, stack = popRange(stack)
  if low == nil then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end

  self.state.stack = stack
  self.state.low = low
  self.state.high = high
  self.state.pivot = high
  self.state.pIndex = low
  self.state.i = low
end
