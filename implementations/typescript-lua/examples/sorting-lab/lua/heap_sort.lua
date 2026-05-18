---@meta
---@type heap_sortScriptComponent
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

  local heapSize = self.state.heapSize
  if heapSize == nil then
    heapSize = n
    self.state.heapSize = heapSize
    self.state.i = math.floor(heapSize / 2) - 1
    return
  end

  local root = self.state.i
  if root ~= nil and root >= 0 then
    local step = self.state.j or 0
    local largest = self.state.minJ or root
    local left = 2 * root + 1
    local right = 2 * root + 2

    if step == 0 and left < heapSize then
      self.bridges.viz:markComparing({ a = largest, b = left })
      if self.bridges.array:compare({ a = largest, b = left }) < 0 then
        largest = left
      end
      self.state.minJ = largest
      self.state.j = 1
      return
    end

    if step == 1 and right < heapSize then
      self.bridges.viz:markComparing({ a = largest, b = right })
      if self.bridges.array:compare({ a = largest, b = right }) < 0 then
        largest = right
      end
      self.state.minJ = largest
      self.state.j = 2
      return
    end

    if largest ~= root then
      self.bridges.array:swap({ a = root, b = largest })
      self.bridges.viz:highlight({ indices = { root, largest } })
      self.state.i = largest
      self.state.j = nil
      self.state.minJ = nil
      return
    end

    self.state.i = root - 1
    self.state.j = nil
    self.state.minJ = nil
    return
  end

  if heapSize > 1 then
    self.bridges.array:swap({ a = 0, b = heapSize - 1 })
    self.bridges.viz:highlight({ indices = { 0, heapSize - 1 } })
    self.bridges.viz:markSortedPrefix({ count = n - heapSize + 1 })
    heapSize = heapSize - 1
    self.state.heapSize = heapSize
    self.state.i = 0
    self.state.j = nil
    self.state.minJ = nil
    return
  end

  self.state.done = true
  self.bridges.viz:markSortedPrefix({ count = n })
  self.bridges.sort:markDone()
end
