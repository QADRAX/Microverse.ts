/**
 * Lua 5.4 bootstrap for **one Wasmoon VM, many slots**: each `slot_key` gets its own
 * `load(..., "t", env)` environment with `__index = _G` (shared builtins, isolated globals).
 */
export const LUARIZER_SLOT_VM_BOOTSTRAP_LUA = `
__luarizer_envs = __luarizer_envs or {}

local function __luarizer_ensure_env(slot_key)
  local e = __luarizer_envs[slot_key]
  if not e then
    e = {}
    setmetatable(e, { __index = _G })
    __luarizer_envs[slot_key] = e
  end
  return e
end

function __luarizer_put_bridge_from_global(slot_key, field_name, global_tmp_key)
  local e = __luarizer_ensure_env(slot_key)
  local v = _G[global_tmp_key]
  rawset(e, field_name, v)
  _G[global_tmp_key] = nil
end

function __luarizer_execute_in_slot(slot_key, source)
  local env = __luarizer_ensure_env(slot_key)
  local f, err = load(source, "@" .. tostring(slot_key), "t", env)
  if not f then
    error(err or "load failed", 0)
  end
  return f()
end

function __luarizer_destroy_slot(slot_key)
  __luarizer_envs[slot_key] = nil
end
`.trim();
