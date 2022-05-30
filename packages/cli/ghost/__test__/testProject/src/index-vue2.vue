<template>
  <div id="app">
  </div>
</template>

<script>
import { mount } from '@vue/test-utils'
import { Message } from "element-ui";
import {
  RecordStatusTagType,
} from "@/constants";
import { tableToEexcell } from "@/utils/excel";
export default {
  name: "App",
  mounted() {
    // ....
  }
};
</script>

<style lang="scss">
@import "@/styles/index.scss";
@import "element-ui/lib/theme-chalk/index.scss";

* {
  margin: 0;
  padding: 0;
}
a {
  text-decoration: none;
}
</style>
