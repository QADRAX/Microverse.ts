--- Hub-level shared library (`BusinessScriptingEngine` `sharedLuaChunks`).
---@global LuarizerMath
---@class LuarizerMath
---@field sum fun(a: integer, b: integer): integer
LuarizerMath = LuarizerMath or {}

---@param a integer
---@param b integer
---@return integer
function LuarizerMath.sum(a, b)
  return a + b
end
