--- Avoid hanging — quiet moves avoid destination squares attacked by the opponent.
---@meta
---@type avoid_hangingScriptComponent
local C = ChessEngine:extend()

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  local safe = {}
  for _, m in ipairs(moves) do
    if move_capture_value(m) > 0 then
      -- Captures are always considered (greedy escape from passivity).
      safe[#safe + 1] = m
    elseif not self.bridges.board:isSquareAttacked({ square = m.to }) then
      safe[#safe + 1] = m
    end
  end
  local pool = #safe > 0 and safe or moves
  local move = pick_random_move(pool, evt.ply)
  if move ~= nil then
    self.bridges.play:submitMove({ from = move.from, to = move.to, promotion = move.promotion })
  end
end
