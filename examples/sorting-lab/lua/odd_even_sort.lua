---@meta
---@type odd_even_sortScriptComponent
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

  local phase = self.state.i
  if phase == nil then
    phase = 0
  end

  local j = self.state.j
  if j == nil then
    j = phase
  end

  local swapped = self.state.swapped or false
  while j + 1 < n do
    self.bridges.viz:markComparing({ a = j, b = j + 1 })
    if self.bridges.array:compare({ a = j, b = j + 1 }) > 0 then
      self.bridges.array:swap({ a = j, b = j + 1 })
      self.bridges.viz:highlight({ indices = { j, j + 1 } })
      swapped = true
    end
    self.state.j = j + 2
    self.state.swapped = swapped
    return
  end

  if not swapped then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end

  self.state.i = 1 - phase
  self.state.j = nil
  self.state.swapped = false
end
