/**
 * @copyright 2016-present Kriasoft (https://git.io/Jt7GM)
 */

import { PaletteMode } from "@material-ui/core";
import { createMuiTheme, Theme } from "@material-ui/core/styles";
import { components } from "./components";

/**
 * Customized Material UI themes for "light" and "dark" modes.
 *
 * @see https://next.material-ui.com/customization/default-theme/
 */
const themes = (["light", "dark"] as PaletteMode[]).map((mode) =>
  createMuiTheme(
    {
      palette: {
        mode,
      },

      typography: {
        fontFamily: [
          `-apple-system`,
          `"BlinkMacSystemFont"`,
          `"Segoe UI"`,
          `"Roboto"`,
          `"Oxygen"`,
          `"Ubuntu"`,
          `"Cantarell"`,
          `"Fira Sans"`,
          `"Droid Sans"`,
          `"Helvetica Neue"`,
          `sans-serif`,
        ].join(","),
      },

      components,
    },
    {
      typography: {
        h1: { fontSize: "2em" },
        h2: { fontSize: "1.5em" },
        h3: { fontSize: "1.3em" },
        h4: { fontSize: "1em" },
        h5: { fontSize: "0.8em" },
        h6: { fontSize: "0.7em" },
        button: { textTransform: "none" },
      },
    },
  ),
);

export default {
  light: themes[0],
  dark: themes[1],
} as { [key in PaletteMode]: Theme };
