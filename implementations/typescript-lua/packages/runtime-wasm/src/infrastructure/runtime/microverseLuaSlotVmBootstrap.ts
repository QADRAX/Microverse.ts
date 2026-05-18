/**
 * Lua 5.4 bootstrap for **one Wasmoon VM, many slots**:
 * - Slot `_ENV` uses a **safe global** table (no `debug`, `load`, `io`, `os`, …).
 * - Slot registry and internals are **closure-local** (not on `_G`).
 * - Bridge tables are **read-only** from Lua (`__newindex`); host re-injects via `mergeEnv` each run.
 * - **No auto-await**: async bridges return a handle with `:await()`; optional 2nd-arg callback runs after the current chunk step.
 * - Optional **instruction budget** per chunk via `debug.sethook` when available.
 */
export const MICROVERSE_LUA_DEFAULT_INSTRUCTION_BUDGET = 5_000_000;

export const MICROVERSE_LUA_SLOT_VM_BOOTSTRAP = `
do
  local REAL_G = _G
  local envs = {}
  local pending_async = {}

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
  local DEFAULT_BUDGET = ${MICROVERSE_LUA_DEFAULT_INSTRUCTION_BUDGET}
  local HOOK_STEP = 10000

  local function is_awaitable(r)
    if type(r) == "userdata" or type(r) == "table" then
      return type(r.await) == "function"
    end
    return false
  end

  function __microverse_lua_await_value(r)
    if not is_awaitable(r) then
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

  function __microverse_lua_wrap_async_result(r)
    if not is_awaitable(r) then
      return r
    end
    return setmetatable({}, {
      __index = function(_, key)
        if key == "await" then
          return function()
            return __microverse_lua_await_value(r)
          end
        end
        return nil
      end,
    })
  end

  local function is_lua_callback(v)
    return type(v) == "function"
  end

  local function schedule_on_complete(onComplete, r)
    pending_async[#pending_async + 1] = { cb = onComplete, r = r }
  end

  local function flush_pending_async()
    for i = 1, #pending_async do
      local job = pending_async[i]
      local out = __microverse_lua_await_value(job.r)
      job.cb(out)
    end
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
          local onComplete = nil
          local payload
          if n >= 3 and is_lua_callback(select(3, ...)) then
            onComplete = select(3, ...)
            payload = select(2, ...)
          elseif n >= 2 and is_lua_callback(select(2, ...)) then
            onComplete = select(2, ...)
            payload = select(1, ...)
          elseif n >= 2 then
            payload = select(2, ...)
          elseif n >= 1 then
            payload = select(1, ...)
          end
          local r
          if onComplete ~= nil then
            if payload ~= nil then
              r = f(impl, payload)
            else
              r = f(impl)
            end
            schedule_on_complete(onComplete, r)
            return nil
          end
          if payload ~= nil then
            r = f(impl, payload)
          elseif n == 0 then
            r = f(impl)
          else
            r = f(impl, select(1, ...))
          end
          return __microverse_lua_wrap_async_result(r)
        end
      end,
      __newindex = function(_, key)
        error("microverse: bridge table is read-only (" .. tostring(key) .. ")", 2)
      end,
    })
  end

  function __microverse_lua_put_bridge_from_global(slot_key, field_name, global_tmp_key)
    local e = ensure_env(slot_key)
    local v = REAL_G[global_tmp_key]
    REAL_G[global_tmp_key] = nil
    if type(v) == "userdata" or type(v) == "table" then
      v = proxy_bridge(v)
    end
    rawset(e, field_name, v)
  end

  function __microverse_lua_execute_in_slot(slot_key, source, instr_budget)
    instr_budget = instr_budget or DEFAULT_BUDGET
    pending_async = {}
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
          error("microverse: instruction limit exceeded", 0)
        end
      end, "", HOOK_STEP)
    end
    local ok, result = pcall(f)
    if debug_lib and debug_lib.sethook then
      debug_lib.sethook()
    end
    flush_pending_async()
    if not ok then
      error(result, 0)
    end
    return result
  end

  function __microverse_lua_destroy_slot(slot_key)
    envs[slot_key] = nil
  end
end
`.trim();
