import type { ResolvedComponentTypeRegistry } from './componentTypeSpec';

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

local ReferencesMT = {
  __index = function(t, k)
    local wrap = rawget(_ENV, "__microverse_reference_wrap")
    local raw = rawget(t, "__raw")
    local val = raw[k]
    if type(wrap) == "function" then
      return wrap(k, val)
    end
    return val
  end,
}

function __microverse_lua_build_component_impl(bridges)
  local impl = { state = {}, bridges = type(bridges) == "table" and bridges or {} }
  local proxy = { __raw = rawProps() }
  setmetatable(proxy, PropertiesMT)
  impl.properties = proxy
  local refProxy = { __raw = rawProps() }
  setmetatable(refProxy, ReferencesMT)
  impl.references = refProxy
  local base = rawget(_ENV, "__microverse_component_hook_base")
  if type(base) == "table" then
    setmetatable(impl, { __index = base })
  end
  rawset(_ENV, "__microverse_lua_ComponentImpl", impl)
  return impl
end

rawset(_ENV, "__microverse_lua_build_component_impl", __microverse_lua_build_component_impl)

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

/** Lua prelude that registers `TypeName:extend()` singletons for each component type. */
export function profileBridgeSlotKey(typeName: string, bridgeName: string): string {
  return `__mv_${typeName}_${bridgeName}`;
}

export function profileBridgeNamesMergeEnvKey(typeName: string): string {
  return `__microverse_profile_bridge_names_${typeName}`;
}

export function buildComponentTypeBridgeNamesPreludeLua(
  componentTypes: ResolvedComponentTypeRegistry,
): string {
  const lines: string[] = [];
  for (const typeName of Object.keys(componentTypes).sort((a, b) => a.localeCompare(b))) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(typeName)) {
      throw new Error(`unsafe component type name for bridge names prelude: ${typeName}`);
    }
    const names = componentTypes[typeName]!.bridgeNames;
    const entries = names.map((n) => JSON.stringify(n)).join(', ');
    lines.push(
      `rawset(_ENV, ${JSON.stringify(profileBridgeNamesMergeEnvKey(typeName))}, { ${entries} })`,
    );
  }
  return lines.join('\n');
}

export function buildComponentTypeSingletonsPreludeLua(typeNames: readonly string[]): string {
  const lines: string[] = [
    'local function __microverse_collect_profile_bridges(typeName)',
    '  local names = rawget(_ENV, "__microverse_profile_bridge_names_" .. typeName)',
    '  local bridges = {}',
    '  if type(names) ~= "table" then',
    '    return bridges',
    '  end',
    '  for _, name in ipairs(names) do',
    '    if type(name) == "string" then',
    '      local b = rawget(_ENV, "__mv_" .. typeName .. "_" .. name)',
    '      if type(b) == "table" then',
    '        bridges[name] = b',
    '      end',
    '    end',
    '  end',
    '  return bridges',
    'end',
    'local function __microverse_make_type_extend(typeName)',
    '  return function(self)',
    '    local ext = rawget(_ENV, "__microverse_lua_extend_component")',
    '    if type(ext) == "function" then',
    '      ext(typeName)',
    '    end',
    '    local build = rawget(_ENV, "__microverse_lua_build_component_impl")',
    '    if type(build) ~= "function" then',
    '      error("component type extend: build impl missing")',
    '    end',
    '    return build(__microverse_collect_profile_bridges(typeName))',
    '  end',
    'end',
  ];
  for (const name of typeNames) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(`unsafe component type name for Lua singleton: ${name}`);
    }
    lines.push(`rawset(_ENV, ${JSON.stringify(name)}, { extend = __microverse_make_type_extend(${JSON.stringify(name)}) })`);
  }
  return lines.join('\n');
}

/** Applies host-selected profile (same as `Type:extend()` without requiring Lua to call it). */
export function buildApplyHostScriptProfileChunkLua(profileName: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(profileName)) {
    throw new Error(`unsafe script profile name: ${profileName}`);
  }
  return [
    `local T = ${profileName}`,
    'if type(T) == "table" and type(T.extend) == "function" then',
    '  T:extend()',
    'end',
  ].join('\n');
}
