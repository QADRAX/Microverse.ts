---@meta
---@type merge_sortScriptComponent
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

  local width = self.state.gap
  if width == nil then
    width = 1
  end

  if width >= n then
    self.state.done = true
    self.bridges.viz:markSortedPrefix({ count = n })
    self.bridges.sort:markDone()
    return
  end

  local left = self.state.low
  if left == nil then
    left = 0
  end

  local mid = self.state.high
  local right = self.state.pivot
  local buf = self.state.buf
  local i = self.state.i
  local j = self.state.j
  local k = self.state.pIndex

  if buf == nil then
    if left >= n then
      self.state.gap = width * 2
      self.state.low = nil
      self.state.high = nil
      self.state.pivot = nil
      return
    end

    mid = math.min(left + width, n)
    right = math.min(left + 2 * width, n)
    if mid >= right then
      self.state.low = left + 2 * width
      return
    end

    buf = {}
    for idx = left, mid - 1 do
      buf[#buf + 1] = self.bridges.array:get({ index = idx })
    end
    for idx = mid, right - 1 do
      buf[#buf + 1] = self.bridges.array:get({ index = idx })
    end

    self.state.low = left
    self.state.high = mid
    self.state.pivot = right
    self.state.buf = buf
    self.state.i = 1
    self.state.j = mid - left + 1
    self.state.pIndex = left
    return
  end

  local leftLen = mid - left
  local rightLen = right - mid
  k = k or left
  i = i or 1
  j = j or leftLen + 1

  if i <= leftLen and j <= leftLen + rightLen then
    local a = buf[i]
    local b = buf[j]
    self.bridges.viz:markComparing({ a = left + i - 1, b = mid + j - leftLen - 1 })
    if a <= b then
      self.bridges.array:set({ index = k, value = a })
      i = i + 1
    else
      self.bridges.array:set({ index = k, value = b })
      j = j + 1
    end
    self.bridges.viz:highlight({ indices = { k } })
    self.state.i = i
    self.state.j = j
    self.state.pIndex = k + 1
    return
  end

  while i <= leftLen do
    self.bridges.array:set({ index = k, value = buf[i] })
    self.bridges.viz:highlight({ indices = { k } })
    i = i + 1
    k = k + 1
    self.state.i = i
    self.state.pIndex = k
    return
  end

  while j <= leftLen + rightLen do
    self.bridges.array:set({ index = k, value = buf[j] })
    self.bridges.viz:highlight({ indices = { k } })
    j = j + 1
    k = k + 1
    self.state.j = j
    self.state.pIndex = k
    return
  end

  self.state.buf = nil
  self.state.i = nil
  self.state.j = nil
  self.state.pIndex = nil
  self.state.high = nil
  self.state.pivot = nil
  self.state.low = right
end
