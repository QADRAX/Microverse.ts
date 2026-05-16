---@meta
---@type comb_sortScriptComponent
local C = SortingAlgorithm:extend()

local function nextGap(gap)
  gap = math.floor(gap / 1.3)
  if gap < 1 then
    return 1
  end
  return gap
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
    gap = n
  end

  local i = self.state.i
  if i == nil then
    i = 0
  end

  if i + gap >= n then
    if gap == 1 and not self.state.swapped then
      self.state.done = true
      self.bridges.viz:markSortedPrefix({ count = n })
      self.bridges.sort:markDone()
      return
    end
    gap = nextGap(gap)
    self.state.gap = gap
    self.state.i = nil
    self.state.swapped = false
    return
  end

  local swapped = self.state.swapped or false
  self.bridges.viz:markComparing({ a = i, b = i + gap })
  if self.bridges.array:compare({ a = i, b = i + gap }) > 0 then
    self.bridges.array:swap({ a = i, b = i + gap })
    self.bridges.viz:highlight({ indices = { i, i + gap } })
    swapped = true
  end

  self.state.i = i + 1
  self.state.swapped = swapped
end
