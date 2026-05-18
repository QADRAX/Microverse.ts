--- Hybrid aggressive — checks, then safe captures, then depth-2 search.
---@meta
---@type hybrid_aggressiveScriptComponent
local C = ChessEngine:extend()

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  if #moves < 1 then
    return
  end

  local checks = {}
  for _, m in ipairs(moves) do
    if m.givesCheck then
      checks[#checks + 1] = m
    end
  end
  if #checks > 0 then
    submit_move(self, pick_search_depth2(self, checks))
    return
  end

  local captures = filter_captures(moves)
  if #captures > 0 then
    local best = nil
    local bestVal = -1
    for _, m in ipairs(captures) do
      if self.bridges.board:isMoveSafe({ from = m.from, to = m.to, promotion = m.promotion }) then
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

  submit_move(self, pick_search_depth2(self, moves))
end
