--- Hub-level shared library (`BusinessScriptingEngine` `sharedLuaChunks`).
---@global MicroverseMath
---@class MicroverseMath
---@field sum fun(a: integer, b: integer): integer
MicroverseMath = MicroverseMath or {}

---@param a integer
---@param b integer
---@return integer
function MicroverseMath.sum(a, b)
  return a + b
end
