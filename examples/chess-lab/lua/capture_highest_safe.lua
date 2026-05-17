--- Capture highest (safe) — best capture that passes board:isMoveSafe, else depth-1 minimax.
---@meta
---@type capture_highest_safeScriptComponent
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
    local best = nil
    local bestVal = -1
    for _, m in ipairs(captures) do
      local safe = self.bridges.board:isMoveSafe({
        from = m.from,
        to = m.to,
        promotion = m.promotion,
      })
      if safe then
        local v = move_capture_value(m)
        if v > bestVal then
          bestVal = v
          best = m
        end
      end
    end
    if best ~= nil then
      submit_move(self, best)
      return
    end
  end

  submit_move(self, pick_minimax_depth1(self, moves))
end
