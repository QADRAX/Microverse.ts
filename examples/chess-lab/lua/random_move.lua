--- Random move — baseline engine: one legal move per PickMove, indexed by ply.
---@meta
---@class random_moveScriptComponent : ChessEngineComponent
---@field playMove fun(self: random_moveScriptComponent, move: { from: string, to: string, promotion?: string })
local C = ChessEngine:extend()

--- Submit a move returned by board:legalMoves().
function C:playMove(move)
  self.bridges.play:submitMove({
    from = move.from,
    to = move.to,
    promotion = move.promotion,
  })
end

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  -- evt.ply seeds pick_random_move (see helpers.lua).
  local move = pick_random_move(moves, evt.ply)
  if move == nil then
    return
  end
  self:playMove(move)
end
