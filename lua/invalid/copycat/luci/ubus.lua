#!/usr/bin/lua

-- Copycenter 2020 Serena's Copycat
-- License: CC0
-- ubus access
-- re-uses the one from luci.util if it's already in-use

local loaded_packages = package.loaded;
local module_local = {
	name = "invalid.copycat.luci.ubus";
	ubus = {
		module = require("ubus");
		codes = {
			"INVALID_COMMAND",
			"INVALID_ARGUMENT",
			"METHOD_NOT_FOUND",
			"NOT_FOUND",
			"NO_DATA",
			"PERMISSION_DENIED",
			"TIMEOUT",
			"NOT_SUPPORTED",
			"UNKNOWN_ERROR",
			"CONNECTION_FAILED"
		};
	};
};
function module_local.ubus.fnReturn(...)
	if select('#', ...) == 2 then
		local rv, err = select(1, ...), select(2, ...);
		if rv == nil and type(err) == "number" then
			return nil, err, module_local.ubus.codes[err];
		end
	end

	return ...;
end
function module_local.ubus.fnList()
	local ubus = module_local.ubus;
	if not ubus.connection then
		ubus.connection = ubus.module.connect();
		assert(ubus.connection, "Unable to establish ubus connection");
	end

	return ubus.fnReturn(ubus.connection:objects());
end
function module_local.ubus.fnDo(object, method, data)
	local ubus = module_local.ubus;
	if not ubus.connection then
		ubus.connection = ubus.module.connect();
		assert(ubus.connection, "Unable to establish ubus connection");
	end

	if object and method then
		if type(data) ~= "table" then
			data = { };
		end
		return ubus.fnReturn(ubus.connection:call(object, method, data));
	elseif object then
		return ubus.connection:signatures(object);
	else
		return ubus.connection:objects();
	end
end

module(module_local.name);

function list()
	local utilpkg = loaded_packages["luci.util"];
	return ((utilpkg and utilpkg.ubus) or module_local.ubus.fnDo)();
end
function call(object, method, data)
	local utilpkg = loaded_packages["luci.util"];
	return ((utilpkg and utilpkg.ubus) or module_local.ubus.fnDo)(object, method, data);
end

return loaded_packages[module_local.name];
