# Observatory

A LuCI application that shows information about the OpenWRT router it's running on.

## Features

- WAN interface statistics

## Installation

See [INSTALL](INSTALL.md).

## Usage

On a page within Admin, including the login screen, there should be a link at the bottom right that says "Observatory".  That will lead to the Dashboard.

Alternatively, the URL would be like `http://router.example.com/cgi-bin/luci/observatory/`, replacing `http://router.example.com` with the protocol and domain normally used to access LuCI on the router.

## Design goals

- working on as many systems and browsers as feasibly possible
   - bells and whistles may be broken on older browsers, but the train should still roll
   - no, not going to make this work on [Lynx](https://invisible-island.net/lynx/)
   - yes, it works on [IceCat](https://www.gnu.org/software/gnuzilla/) with [LibreJS](https://www.gnu.org/software/librejs/) enabled
   - can be installed on OpenWRT 14, 15, 18 and 19
- accessible to anyone
   - no login required, thus no session timeouts
      - hibernated page (e.g. in Chromium) causes session expiration
   - **do not use** in potentially hostile environments
- usable over long sessions
   - no session timeouts
   - easy on the eyes
      - dark color scheme available
   - minimal load on router
      - should incur less load than looking at the Interfaces page

## License

With [CC0](http://creativecommons.org/publicdomain/zero/1.0/), but see [LICENSE](LICENSE) file for details.

## Integrating into OpenWRT / LuCI

Not going to attempt to integrate it into OpenWRT because of design principle differences and lack of interest in maintaining it forever.

Differences include:

- Targeting non-admin users
   - there is no support for such use, at least with the default Bootstrap theme
- Support of old software
   - intend to have it be functional on old versions of OpenWRT and LuCI
   - intend to have it be functional on old browsers

That is not to say that all attempt would be precluded; just that it's rather unlikely at this point.

