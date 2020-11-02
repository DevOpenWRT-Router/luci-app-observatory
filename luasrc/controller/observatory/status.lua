-- Copycenter 2020 Serena's Copycat
-- License: CC0 (don't they have a "keep it out of the legal system?!")
module("luci.controller.observatory.status", package.seeall)

function index()
	entry({"observatory"},
		firstchild(),
		_("Observatory"), 90).sysauth = false;
	entry({"observatory", "status"},
		firstchild(),
		_("Status"), 10);
	local node = entry({"observatory", "status", "summary"},
		template("observatory/status"),
		_("Dashboard"), 10);
	node.leaf = true;
	node.css = "observatory/status.css";
	-- data nodes (hidden by empty title but mark so explicitly)
	entry({"observatory", "status", "data"},
		alias({"observatory", "status", "summary"})).hidden = true;
	entry({"observatory", "status", "data", "wan"},
		call("status_data_wan")).leaf = true;
end

function status_data_wan()
	local net = require("invalid.copycat.luci.net");
	local interfaces = net.get_wan_interfaces();
	local result = {};
	for _, interface in ipairs(net.get_wan_interfaces()) do
		local data = {
			name = interface.name;
			statistics = net.get_device_statistics(interface.dev);
		};
		data.statistics.up = interface.up;
		table.insert(result, data);
	end
	luci.http.prepare_content("application/json");
	luci.http.write_json(result);
end
