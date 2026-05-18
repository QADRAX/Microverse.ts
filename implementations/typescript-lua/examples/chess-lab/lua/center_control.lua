--- Center control — scores quiet moves toward the center; captures still use material tie-break.
---@meta
---@type center_controlScriptComponent
local C = ChessEngine:extend()

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  if #moves < 1 then
    return
  end

  local captures = filter_captures(moves)
  if #captures > 0 then
    submit_move(self, best_move_by_score(captures, move_capture_value))
    return
  end

  submit_move(self, best_move_by_score(moves, move_center_score))
end
