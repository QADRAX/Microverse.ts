---@meta
---@type shell_sortScriptComponent
local C = SortingAlgorithm:extend()

local function nextGap(gap)
  return math.floor(gap / 2)
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

  local gap = self.state.gap
  if gap == nil then
    gap = math.floor(n / 2)
    if gap < 1 then
      gap = 1
    end
  end

  if gap < 1 then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end

  local i = self.state.i
  if i == nil then
    i = gap
  end

  if i >= n then
    gap = nextGap(gap)
    self.state.gap = gap
    self.state.i = nil
    self.state.j = nil
    return
  end

  local j = self.state.j
  if j == nil then
    j = i
  end

  if j >= gap then
    self.bridges.viz:markComparing({ a = j - gap, b = j })
    if self.bridges.array:compare({ a = j - gap, b = j }) > 0 then
      self.bridges.array:swap({ a = j - gap, b = j })
      self.bridges.viz:highlight({ indices = { j - gap, j } })
      self.state.j = j - gap
      return
    end
  end

  self.state.i = i + 1
  self.state.j = nil
end
