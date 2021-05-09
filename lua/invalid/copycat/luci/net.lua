#!/usr/bin/lua

-- Copycenter 2020 Serena's Copycat
-- License: CC0
-- LuCI-specific network utility functions

local module_global = {
	ipairs = ipairs;
	pairs = pairs;
	print = print;
	string = string;
	table = table;
};
local loaded_packages = package.loaded;
local module_local = {
	name = "invalid.copycat.luci.net";
	ubus = require("invalid.copycat.luci.ubus");
}

module(module_local.name);

function get_interface_ips(ipmap)
	if nil == ipmap then
		ipmap = {};
	end
	local interfaces = module_local.ubus.call("network.interface", "dump", {}).interface;
	for i = 1, #interfaces do
        	local interface = interfaces[i];
		for i, k in module_global.ipairs({ "ipv4-address", "ipv6-address" }) do
			if interface[k] then
				local addresses = interface[k];
		        	for a = 1, #addresses do
					ipmap[addresses[a].address] = interface.interface;
				end
			end
        	end
	end
	return ipmap;
end

function get_wan_interfaces()
	local result = {};
	local interfaces = module_local.ubus.call("network.interface", "dump", {}).interface;
	for _, interface in module_global.ipairs(interfaces) do
		if interface.l3_device then
			local hasDefaultRoute = false;
			for _, rt in module_global.ipairs(interface.route) do
				if '0.0.0.0' == rt.target and 0 == rt.mask then
					hasDefaultRoute = true;
					break;
				end
			end
			if hasDefaultRoute then
					module_global.table.insert(result, {
							name = interface.interface;
							dev = interface.l3_device;
							up = interface.up and interface.uptime;
						});
			end
        	end
	end
	return result;	
end

function get_device_statistics(device)
	local status = module_local.ubus.call("network.device", "status", { name = device });
	if status then
		local stats = status.statistics;
		return {
			rx_packets = stats.rx_packets; rx_bytes = stats.rx_bytes;
			tx_packets = stats.tx_packets; tx_bytes = stats.tx_bytes;
		};
	else
		return nil;
	end
end

return loaded_packages[module_local.name];
