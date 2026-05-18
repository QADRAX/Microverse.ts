--- Develop knights — prefers knight moves toward central squares.
---@meta
---@type develop_knightsScriptComponent
local C = ChessEngine:extend()

local function is_knight_move(self, move)
  local piece = self.bridges.board:pieceAt({ square = move.from })
  return piece ~= nil and piece.type == "n"
end

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  if #moves < 1 then
    return
  end

  local knightMoves = {}
  for _, m in ipairs(moves) do
    if is_knight_move(self, m) then
      knightMoves[#knightMoves + 1] = m
    end
  end

  if #knightMoves > 0 then
    submit_move(self, best_move_by_score(knightMoves, move_center_score))
    return
  end

  submit_move(self, pick_minimax_depth1(self, moves))
end
