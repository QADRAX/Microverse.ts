---@meta
---@type cocktail_sortScriptComponent
local C = SortingAlgorithm:extend()

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

  local low = self.state.low
  if low == nil then
    low = 0
  end
  local high = self.state.high
  if high == nil then
    high = n - 1
  end

  if low >= high then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end

  local forward = true
  if self.state.pivot ~= nil then
    forward = self.state.pivot ~= 0
  end

  if forward then
    local j = self.state.j
    if j == nil then
      j = low
    end
    local swapped = false
    if j < high then
      self.bridges.viz:markComparing({ a = j, b = j + 1 })
      if self.bridges.array:compare({ a = j, b = j + 1 }) > 0 then
        self.bridges.array:swap({ a = j, b = j + 1 })
        self.bridges.viz:highlight({ indices = { j, j + 1 } })
        swapped = true
      end
      self.state.j = j + 1
      if swapped then
        self.state.swapped = true
      elseif self.state.swapped == nil then
        self.state.swapped = false
      end
      return
    end
    high = high - 1
    self.state.high = high
    self.state.j = nil
    self.state.pivot = 0
    return
  end

  local j = self.state.j
  if j == nil then
    j = high
  end
  local swapped = false
  if j > low then
    self.bridges.viz:markComparing({ a = j - 1, b = j })
    if self.bridges.array:compare({ a = j - 1, b = j }) > 0 then
      self.bridges.array:swap({ a = j - 1, b = j })
      self.bridges.viz:highlight({ indices = { j - 1, j } })
      swapped = true
    end
    self.state.j = j - 1
    if swapped then
      self.state.swapped = true
    end
    return
  end

  if not self.state.swapped then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end

  low = low + 1
  self.state.low = low
  self.state.j = nil
  self.state.pivot = 1
  self.state.swapped = false
  self.bridges.viz:markSortedPrefix({ count = low })
end
