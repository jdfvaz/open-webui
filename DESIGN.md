# Account appearance contract

The existing OpenWebUI Svelte components, Tailwind colors, typography, spacing,
settings rows and native theme selector remain the design system for this change.
General settings owns the selector; the shared account-theme utility owns applying
the existing Light, Dark, System, OLED Dark and Her appearances. No new component,
layout, type scale, motion or color is introduced.

`ui.theme` in user settings is the account preference. The browser's `theme` value
is its early-paint cache. Authentication loads the account preference before the
chat is ready. Existing local preferences migrate once when the account has no
saved theme. `theme-account` associates the cache with its account so a later
account does not inherit it. A failed migration does not block chat.

Theme changes save through the existing user settings permissions and only become
the active appearance after saving succeeds. A failed save restores the selector
and theme setting and displays the existing error toast. The selector is disabled
while saving. Other personal settings are preserved by the existing settings save
flow. System continues to respond to device appearance changes. Office reads the
same account preference; its OLED Dark and Her variants use Dark and Light.

Existing colors are preserved: standard Dark uses gray 800 `#333`, 850 `#262626`,
900 `#171717`, 950 `#0d0d0d`; OLED uses `#101010`, `#050505`, `#000000`, `#000000`.
Browser chrome uses `#171717` for Dark, `#ffffff` for Light, `#000000` for OLED and
`#983724` for Her. Native controls inherit the resolved light or dark color scheme.
