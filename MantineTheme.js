import MantineStyles from "@/assets/stylesheets/modules/mantine.module.scss";

import {createTheme, Tabs} from "@mantine/core";

const theme = createTheme({
  fontFamily: "Inter, \"Helvetica Neue\", helvetica, sans-serif",
  fontFamilyMonospace: "Monaco, Courier, monospace",
  components: {
    Tabs: Tabs.extend({
      classNames: {
        tab: MantineStyles.tabs__tab
      }
    })
  }
});

export default theme;
