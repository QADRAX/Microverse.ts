--- Opening book (starter) — short hard-coded lines, then minimax depth 2.
---@meta
---@type opening_book_starterScriptComponent
local C = ChessEngine:extend()

local WHITE_BOOK = {
  { from = "e2", to = "e4" },
  { from = "g1", to = "f3" },
  { from = "f1", to = "c4" },
  { from = "d2", to = "d4" },
}

local BLACK_BOOK = {
  { from = "e7", to = "e5" },
  { from = "g8", to = "f6" },
  { from = "b8", to = "c6" },
  { from = "f8", to = "c5" },
}

local function book_index(evt, color)
  if color == "white" then
    return math.floor(evt.ply / 2) + 1
  end
  return math.floor((evt.ply + 1) / 2)
end

local function find_book_move(self, evt)
  local color = self.bridges.game:myColor()
  local book = color == "white" and WHITE_BOOK or BLACK_BOOK
  local idx = book_index(evt, color)
  local entry = book[idx]
  if entry == nil then
    return nil
  end
  local moves = legal_moves_for_pick(self, evt)
  for _, m in ipairs(moves) do
    if m.from == entry.from and m.to == entry.to then
      return m
    end
  end
  return nil
end

function C:onPickMove(evt)
  if self.bridges.board:isGameOver() then
    return
  end
  local moves = legal_moves_for_pick(self, evt)
  if #moves < 1 then
    return
  end

  local bookMove = find_book_move(self, evt)
  if bookMove ~= nil then
    submit_move(self, bookMove)
    return
  end

  submit_move(self, pick_search_depth2(self, moves))
end
