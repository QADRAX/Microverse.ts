--- Minimax depth 2 — uses board:searchScore (host simulates opponent replies).
---@meta
---@type minimax_depth2ScriptComponent
local C = ChessEngine:extend()

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  if #moves < 1 then
    return
  end
  local best = pick_search_depth2(self, moves)
  submit_move(self, best)
end
