--- Capture first — prefers any capture, otherwise pseudo-random legal move.
---@meta
---@type capture_firstScriptComponent
local C = ChessEngine:extend()

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  local captures = filter_captures(moves)
  local pool = #captures > 0 and captures or moves
  local move = pick_random_move(pool, evt.ply)
  if move == nil then
    return
  end
  self.bridges.play:submitMove({ from = move.from, to = move.to, promotion = move.promotion })
end
