---@meta
---@type insertion_sortScriptComponent
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
  local i = self.state.i or 1
  if i >= n then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end
  local j = self.state.j
  if j == nil then
    j = i
  end
  if j > 0 then
    self.bridges.viz:markComparing({ a = j - 1, b = j })
    if self.bridges.array:compare({ a = j - 1, b = j }) > 0 then
      self.bridges.array:swap({ a = j - 1, b = j })
      self.bridges.viz:highlight({ indices = { j - 1, j } })
      self.state.j = j - 1
      return
    end
  end
  self.bridges.viz:markSortedPrefix({ count = i + 1 })
  self.state.i = i + 1
  self.state.j = nil
end
