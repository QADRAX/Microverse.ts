--- Prefer checks — tries to give check, then capture, then random.
---@meta
---@type prefer_checksScriptComponent
local C = ChessEngine:extend()

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  local checks = {}
  for _, m in ipairs(moves) do
    if m.givesCheck then
      checks[#checks + 1] = m
    end
  end
  if #checks > 0 then
    local move = pick_random_move(checks, evt.ply)
    if move ~= nil then
      self.bridges.play:submitMove({ from = move.from, to = move.to, promotion = move.promotion })
    end
    return
  end
  local captures = filter_captures(moves)
  if #captures > 0 then
    local move = pick_random_move(captures, evt.ply)
    if move ~= nil then
      self.bridges.play:submitMove({ from = move.from, to = move.to, promotion = move.promotion })
    end
    return
  end
  local move = pick_random_move(moves, evt.ply)
  if move ~= nil then
    self.bridges.play:submitMove({ from = move.from, to = move.to, promotion = move.promotion })
  end
end
