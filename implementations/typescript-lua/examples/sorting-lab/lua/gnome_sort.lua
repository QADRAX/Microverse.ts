---@meta
---@type gnome_sortScriptComponent
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

  local i = self.state.i
  if i == nil then
    i = 1
  end

  if i >= n then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end

  if i > 0 then
    self.bridges.viz:markComparing({ a = i - 1, b = i })
    if self.bridges.array:compare({ a = i - 1, b = i }) > 0 then
      self.bridges.array:swap({ a = i - 1, b = i })
      self.bridges.viz:highlight({ indices = { i - 1, i } })
      self.state.i = i - 1
      return
    end
  end

  self.bridges.viz:markSortedPrefix({ count = i + 1 })
  self.state.i = i + 1
end
