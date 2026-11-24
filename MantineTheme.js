import MantineStyles from "@/assets/stylesheets/modules/mantine.module.scss";

import {createTheme, Modal, Tabs, Tooltip} from "@mantine/core";

const theme = createTheme({
  fontFamily: "Inter, \"Helvetica Neue\", helvetica, sans-serif",
  fontFamilyMonospace: "Monaco, Courier, monospace",
  components: {
    Modal: Modal.extend({
      classNames: {
        inner: MantineStyles.modal__inner,
        title: MantineStyles.modal__title
      }
    }),
    Tooltip: Tooltip.extend({
      classNames: {
        tooltip: MantineStyles.tooltip
      }
    }),
    Tabs: Tabs.extend({
      classNames: {
        tab: MantineStyles.tabs__tab
      }
    })
  }
});

export default theme;
