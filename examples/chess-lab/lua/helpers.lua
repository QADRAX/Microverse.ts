--- Shared prelude injected into every ChessEngine script (see chessScriptRegistry).
---@meta

-- Standard piece values for capture heuristics (pawns=1 … queen=9).
PIECE_VALUE = { p = 1, n = 3, b = 3, r = 5, q = 9, k = 0 }

--- Drop the immediate undo of the opponent's last move when other moves exist.
function filter_not_undo(moves, lastFrom, lastTo)
  if lastFrom == nil or lastTo == nil then
    return moves
  end
  local out = {}
  for _, m in ipairs(moves) do
    if not (m.from == lastTo and m.to == lastFrom) then
      out[#out + 1] = m
    end
  end
  if #out < 1 then
    return moves
  end
  return out
end

--- When the position has occurred twice, avoid moves that would claim a threefold draw.
function filter_avoid_threefold(self, moves)
  local out = {}
  for _, m in ipairs(moves) do
    if not self.bridges.board:moveWouldThreefold({
      from = m.from,
      to = m.to,
      promotion = m.promotion,
    }) then
      out[#out + 1] = m
    end
  end
  if #out < 1 then
    return moves
  end
  return out
end

--- Legal moves with anti-repetition heuristics (undo + imminent threefold).
---@param self ChessEngineComponent
---@param evt MicroverseEvt_PickMove
function legal_moves_for_pick(self, evt)
  local moves = self.bridges.board:legalMoves()
  moves = filter_not_undo(moves, evt.lastFrom, evt.lastTo)
  if evt.positionRepeats ~= nil and evt.positionRepeats >= 2 then
    moves = filter_avoid_threefold(self, moves)
  end
  return moves
end

--- Pick a move from a list using ply as a deterministic index (no math.random in Wasm).
---@param moves table[]
---@param seed integer|nil ply from PickMove event
---@return table|nil move payload from board:legalMoves()
function pick_random_move(moves, seed)
  local n = #moves
  if n <= 0 then
    return nil
  end
  local s = seed or 0
  local i = (s % n) + 1
  return moves[i]
end

--- Material value gained if this move is a capture (0 otherwise).
function move_capture_value(move)
  if move.captured == nil then
    return 0
  end
  return PIECE_VALUE[move.captured] or 0
end

--- Subset of moves that capture an opponent piece.
function filter_captures(moves)
  local out = {}
  for _, m in ipairs(moves) do
    if move_capture_value(m) > 0 then
      out[#out + 1] = m
    end
  end
  return out
end

-- Centipawn-ish bonus for landing on central squares (opening-friendly heuristic).
local CENTER_FILES = { d = true, e = true }
local CENTER_RANKS = { ["4"] = true, ["5"] = true }

function center_score_for_square(square)
  if square == nil or #square < 2 then
    return 0
  end
  local file = square:sub(1, 1)
  local rank = square:sub(2, 2)
  local score = 0
  if CENTER_FILES[file] then
    score = score + 12
  end
  if CENTER_RANKS[rank] then
    score = score + 8
  end
  return score
end

function move_center_score(move)
  return center_score_for_square(move.to)
end

function best_move_by_score(moves, scorer)
  local best = moves[1]
  local bestScore = -99999
  for _, m in ipairs(moves) do
    local s = scorer(m)
    if s > bestScore then
      bestScore = s
      best = m
    end
  end
  return best
end

function submit_move(self, move)
  self.bridges.play:submitMove({
    from = move.from,
    to = move.to,
    promotion = move.promotion,
  })
end

function pick_minimax_depth1(self, moves)
  local best = moves[1]
  local bestScore = -99999
  for _, m in ipairs(moves) do
    local score = self.bridges.board:evaluateAfterMove({
      from = m.from,
      to = m.to,
      promotion = m.promotion,
    })
    if score ~= nil and score > bestScore then
      bestScore = score
      best = m
    end
  end
  return best
end

function pick_search_depth2(self, moves)
  local best = moves[1]
  local bestScore = -99999
  for _, m in ipairs(moves) do
    local score = self.bridges.board:searchScore({
      from = m.from,
      to = m.to,
      promotion = m.promotion,
      depth = 2,
    })
    if score ~= nil and score > bestScore then
      bestScore = score
      best = m
    end
  end
  return best
end
