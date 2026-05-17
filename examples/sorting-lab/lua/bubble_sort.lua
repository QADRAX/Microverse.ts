---@meta
---@type bubble_sortScriptComponent
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
  local j = self.state.j or 0
  if i >= n - 1 then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end
  self.bridges.viz:markComparing({ a = j, b = j + 1 })
  local cmp = self.bridges.array:compare({ a = j, b = j + 1 })
  if cmp > 0 then
    self.bridges.array:swap({ a = j, b = j + 1 })
    self.bridges.viz:highlight({ indices = { j, j + 1 } })
  end
  j = j + 1
  if j >= n - 1 - i then
    i = i + 1
    j = 0
    self.bridges.viz:markSortedPrefix({ count = i })
  end
  self.state.i = i
  self.state.j = j
end
