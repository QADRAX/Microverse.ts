--- Minimax depth 1 — one-ply search using board:evaluateAfterMove (host simulates, no illegal apply).
---@meta
---@type minimax_depth1ScriptComponent
local C = ChessEngine:extend()

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  if #moves < 1 then
    return
  end

  local bestMove = moves[1]
  local bestScore = -99999

  for _, m in ipairs(moves) do
    local score = self.bridges.board:evaluateAfterMove({
      from = m.from,
      to = m.to,
      promotion = m.promotion,
    })
    if score ~= nil and score > bestScore then
      bestScore = score
      bestMove = m
    end
  end

  self.bridges.play:submitMove({
    from = bestMove.from,
    to = bestMove.to,
    promotion = bestMove.promotion,
  })
end
