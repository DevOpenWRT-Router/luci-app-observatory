# Installing Observatory

## Installing from source

Deploy by using information from [LuCI wiki on modules](https://github.com/openwrt/luci/wiki/Modules).

On OpenWRT 14 and earlier, may have to delete `/tmp/luci-indexcache` for the changes to be picked up.

### TL;DR

Copy
`lua/` to `/usr/lib/lua/`;
`luasrc/` to `/usr/lib/lua/luci/`;
`view/` to `/usr/lib/lua/luci/view/`;
`htdocs/` to `/www/`.

Delete `/tmp/luci-indexcache`.

## Creating package

The following set of instruction tries to minimize the amount of downloading to build a single LuCI package from scratch.
You can just use the [SDK](https://openwrt.org/docs/guide-developer/using_the_sdk) to build the package as the tools would already be precompiled, saving some time.  Should work on any architecture.

When "getting a repository", just downloading an archived snapshot is sufficent, rather than a full Git clone.

1. Get [OpenWRT repository](https://git.openwrt.org/?p=openwrt/openwrt.git;a=summary)
1. Get this repository integrated into LuCI
   - Option 1: integrate
      1. get [LuCI repository](https://git.openwrt.org/?p=project/luci.git;a=summary)
      1. merge this repository into LuCI
         - `luci-app-observatory` should be directly inside `applications` directory within LuCI
   - Option 2: use placeholder and cherry-pick dependencies
      - only needs 1 file from LuCI so can save lots of download
      1. create a placeholder feed directory that can be used to mimic LuCI layout
         - add an `applications` directory under placeholder directory
      1. get this repository
         - place under `applications`
            - should be `<placeholder>/applications/luci-app-observatory`
      1. get [`luci.mk`](https://git.openwrt.org/?p=project/luci.git;a=blob_plain;f=luci.mk;hb=c80fcd23753a02a24de676c612492b6d55b747e1) from LuCI repository
         1. place `luci.mk` within placeholder
            - `applications` should be its sibling
      1. Create feed referencing this repository
         - Example `feed.conf` entry, assuming `luci-extra-apps` is the placeholder directory
         ```
         src-link luci-extra-apps-repo /home/builduser/openwrt/luci-extra-apps
         ```
1. Install feed into OpenWRT
   - Assuming the feed is named 'luci-extra-apps-repo':
     ```shell
     scripts/feeds update luci-extra-apps-repo
     scripts/feeds install -a -p luci-extra-apps-repo
     ```
   - If integrated into LuCI, just simply update the LuCI feed.
1. Use `make menuconfig` to select target and package
   - Can use any target
   - Make sure to select package and make it a Module (marked with M)
      - LuCI &rarr; Applications &rarr; luci-app-observatory
1. Start building
   ```shell
   make tools/install
   make package/luci-app-observatory/install
   ```
   Note the following targets are not made as we don't need to compile any binaries:
   - `toolchain/install`
   - `package/luci-app-observatory/compile`
1. Retrieve IPK file and install into router
   - should be under `bin` directory

### Broken package

Although [documentation](https://github.com/openwrt/luci/wiki/Modules) states that `lua` and `view` directories under the module (assuming applications are handled the same way) should already be picked up and go to their respective locations, there is at least a [version of `luci.mk`](https://github.com/openwrt/luci/blob/c80fcd23753a02a24de676c612492b6d55b747e1/luci.mk) that doesn't (or, at least, the build steps above didn't put it in), so it might be necessary to hack it in.

To find out whether it is necessary, look in `<openwrt_project_root>/build_dir/target-i386_i486_uClibc-0.9.33.2/luci-app-observatory/ipkg-all/luci-app-observatory/usr/lib/lua` for both `invalid` and `luci/view` directories, adjusting the path to match your build as necessary.  If not, change into the `luci-app-observatory` source directory, and hack it in:

```shell
mkdir -p root/usr/lib && cp -aR lua root/usr/lib/
cp -aR view luasrc/
```

The above makes the `lua` and `view` directory contents available within the known directories.

Alternatively, can link instead of copy, but note that when trying to use a symbolic link, it must use absolute path, as the issue we're dealing with is that the `lua` and `view` directories are ignored and will not land in the build directory.

To retry, clean up first:

```shell
make package/clean
```

or more specifically, just the application that we're working with:

```shell
make package/luci-app-observatory/clean
```

and try to build `package/luci-app-observatory/install` again.

Troubleshoot issues by reviewing "[How to build a single package](https://openwrt.org/docs/guide-developer/single.package)" as a starting point.

