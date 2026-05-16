/** @see MICROVERSE_LUA_COMPONENT_SLOT_PRELUDE */
export const MICROVERSE_LUA_COMPONENT_SLOT_PRELUDE = `
rawset(_ENV, "__microverse_component_rawProps", {})
rawset(_ENV, "__microverse_component_dirty", {})

local function rawProps()
  return rawget(_ENV, "__microverse_component_rawProps")
end

local function dirty()
  return rawget(_ENV, "__microverse_component_dirty")
end

local PropertiesMT = {
  __index = function(t, k)
    return rawget(t, "__raw")[k]
  end,
  __newindex = function(t, k, v)
    rawget(t, "__raw")[k] = v
    local d = dirty()
    d[k] = v
  end,
}

function __microverse_lua_attach_bridges(impl)
  if type(impl) ~= "table" then
    return
  end
  impl.bridges = impl.bridges or {}
  local names = rawget(_ENV, "__microverse_bridge_names")
  if type(names) ~= "table" then
    return
  end
  for _, name in ipairs(names) do
    if type(name) == "string" then
      local g = rawget(_ENV, name)
      if type(g) == "table" then
        impl.bridges[name] = g
        rawset(_ENV, name, nil)
      end
    end
  end
end

rawset(_ENV, "__microverse_lua_attach_bridges", __microverse_lua_attach_bridges)

rawset(_ENV, "component", {
  extend = function()
    local impl = { state = {}, bridges = {} }
    local proxy = { __raw = rawProps() }
    setmetatable(proxy, PropertiesMT)
    impl.properties = proxy
    local base = rawget(_ENV, "__microverse_component_hook_base")
    if type(base) == "table" then
      setmetatable(impl, { __index = base })
    end
    __microverse_lua_attach_bridges(impl)
    rawset(_ENV, "__microverse_lua_ComponentImpl", impl)
    return impl
  end,
})

rawset(_ENV, "__microverse_lua_component_apply_incoming", function()
  local incoming = rawget(_ENV, "__microverseIncomingProps")
  if type(incoming) ~= "table" then
    return
  end
  local rp = rawProps()
  local impl = rawget(_ENV, "__microverse_lua_ComponentImpl")
  if type(impl) ~= "table" or type(impl.properties) ~= "table" then
    for k, v in pairs(incoming) do
      rp[k] = v
    end
    return
  end
  for k, v in pairs(incoming) do
    impl.properties[k] = v
  end
end)

rawset(_ENV, "__microverse_lua_component_flush_to_sink", function()
  local push = rawget(_ENV, "__microverseFlushPush")
  local d = dirty()
  for k, v in pairs(d) do
    if type(push) == "function" then
      push(k, v)
    end
    d[k] = nil
  end
end)
`.trim();
