--- Greedy material — captures the most valuable piece; random quiet move otherwise.
---@meta
---@type greedy_materialScriptComponent
local C = ChessEngine:extend()

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  local captures = filter_captures(moves)
  if #captures > 0 then
    local best = captures[1]
    local bestVal = move_capture_value(best)
    for i = 2, #captures do
      local m = captures[i]
      local v = move_capture_value(m)
      if v > bestVal then
        best = m
        bestVal = v
      end
    end
    self.bridges.play:submitMove({ from = best.from, to = best.to, promotion = best.promotion })
    return
  end
  local move = pick_random_move(moves, evt.ply)
  if move ~= nil then
    self.bridges.play:submitMove({ from = move.from, to = move.to, promotion = move.promotion })
  end
end
