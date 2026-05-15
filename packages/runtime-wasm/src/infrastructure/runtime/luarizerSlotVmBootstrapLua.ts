/**
 * Lua 5.4 bootstrap for **one Wasmoon VM, many slots**:
 * - Slot `_ENV` uses a **safe global** table (no `debug`, `load`, `io`, `os`, …).
 * - Slot registry and internals are **closure-local** (not on `_G`).
 * - Bridge tables are **read-only** from Lua (`__newindex`); host re-injects via `mergeEnv` each run.
 * - Optional **instruction budget** per chunk via `debug.sethook` when available.
 */
export const LUARIZER_DEFAULT_INSTRUCTION_BUDGET = 5_000_000;

export const LUARIZER_SLOT_VM_BOOTSTRAP_LUA = `
do
  local REAL_G = _G
  local envs = {}

  local function copy_functions(lib)
    if type(lib) ~= "table" then return nil end
    local out = {}
    for k, v in pairs(lib) do
      if type(v) == "function" then
        out[k] = v
      end
    end
    return out
  end

  local function copy_math()
    local src = REAL_G.math
    if type(src) ~= "table" then return {} end
    local blocked = { random = true, randomseed = true }
    local out = {}
    for k, v in pairs(src) do
      if type(v) == "function" and not blocked[k] then
        out[k] = v
      end
    end
    return out
  end

  local SAFE_G = {
    assert = assert,
    error = error,
    getmetatable = getmetatable,
    ipairs = ipairs,
    next = next,
    pairs = pairs,
    pcall = pcall,
    rawequal = rawequal,
    rawget = rawget,
    rawlen = rawlen,
    rawset = rawset,
    select = select,
    setmetatable = setmetatable,
    tonumber = tonumber,
    tostring = tostring,
    type = type,
    xpcall = xpcall,
    table = copy_functions(REAL_G.table),
    string = copy_functions(REAL_G.string),
    math = copy_math(),
    _VERSION = REAL_G._VERSION,
  }

  local ENV_MT = { __index = SAFE_G }

  local function ensure_env(slot_key)
    local e = envs[slot_key]
    if not e then
      e = {}
      setmetatable(e, ENV_MT)
      envs[slot_key] = e
    end
    return e
  end

  local debug_lib = REAL_G.debug
  local DEFAULT_BUDGET = ${LUARIZER_DEFAULT_INSTRUCTION_BUDGET}
  local HOOK_STEP = 10000

  function __luarizer_maybe_await_bridge_result(r)
    local aw = nil
    if type(r) == "userdata" or type(r) == "table" then
      aw = r.await
    end
    if type(aw) ~= "function" then
      return r
    end
    local ok, out = pcall(function()
      return r:await()
    end)
    if not ok then
      error(out, 0)
    end
    return out
  end

  local function proxy_bridge(impl)
    return setmetatable({}, {
      __index = function(_, method)
        local f = impl[method]
        if type(f) ~= "function" then
          return nil
        end
        return function(...)
          local n = select("#", ...)
          local r
          if n == 0 then
            r = f(impl)
          elseif n == 1 then
            r = f(impl, select(1, ...))
          else
            r = f(impl, select(2, ...))
          end
          return __luarizer_maybe_await_bridge_result(r)
        end
      end,
      __newindex = function(_, key)
        error("luarizer: bridge table is read-only (" .. tostring(key) .. ")", 2)
      end,
    })
  end

  function __luarizer_put_bridge_from_global(slot_key, field_name, global_tmp_key)
    local e = ensure_env(slot_key)
    local v = REAL_G[global_tmp_key]
    REAL_G[global_tmp_key] = nil
    if type(v) == "userdata" or type(v) == "table" then
      v = proxy_bridge(v)
    end
    rawset(e, field_name, v)
  end

  function __luarizer_execute_in_slot(slot_key, source, instr_budget)
    instr_budget = instr_budget or DEFAULT_BUDGET
    local env = ensure_env(slot_key)
    local f, load_err = load(source, "@" .. tostring(slot_key), "t", env)
    if not f then
      error(load_err or "load failed", 0)
    end
    local count = 0
    if debug_lib and debug_lib.sethook then
      debug_lib.sethook(function()
        count = count + HOOK_STEP
        if count > instr_budget then
          debug_lib.sethook()
          error("luarizer: instruction limit exceeded", 0)
        end
      end, "", HOOK_STEP)
    end
    local ok, result = pcall(f)
    if debug_lib and debug_lib.sethook then
      debug_lib.sethook()
    end
    if not ok then
      error(result, 0)
    end
    return result
  end

  function __luarizer_destroy_slot(slot_key)
    envs[slot_key] = nil
  end
end
`.trim();
