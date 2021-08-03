include $(TOPDIR)/rules.mk

LUCI_TITLE:=Observatory information display
LUCI_DESCRIPTION:=LuCI interface to display information, such as WAN statistics, to non-authenticated users
LUCI_DEPENDS:=
LUCI_PKGARCH:=all

PKG_LICENSE:=CC0-1.0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
