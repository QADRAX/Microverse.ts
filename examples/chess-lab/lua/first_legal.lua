--- First legal move — deterministic; always plays legalMoves()[1].
---@meta
---@type first_legalScriptComponent
local C = ChessEngine:extend()

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  if #moves < 1 then
    return
  end
  local m = moves[1]
  self.bridges.play:submitMove({ from = m.from, to = m.to, promotion = m.promotion })
end
