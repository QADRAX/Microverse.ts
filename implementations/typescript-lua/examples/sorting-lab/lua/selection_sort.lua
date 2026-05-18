---@meta
---@type selection_sortScriptComponent
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
  local i = self.state.i or 0
  local j = self.state.j or i + 1
  local minJ = self.state.minJ or i
  if i >= n - 1 then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end
  if j < n then
    self.bridges.viz:markComparing({ a = minJ, b = j })
    if self.bridges.array:compare({ a = minJ, b = j }) > 0 then
      minJ = j
    end
    self.state.minJ = minJ
    self.state.j = j + 1
    return
  end
  if minJ ~= i then
    self.bridges.array:swap({ a = i, b = minJ })
    self.bridges.viz:highlight({ indices = { i, minJ } })
  end
  self.bridges.viz:markSortedPrefix({ count = i + 1 })
  self.state.i = i + 1
  self.state.j = i + 2
  self.state.minJ = i + 1
end
