<template>
  <div id="nav">
    <div id="home">
      <router-link to="/"><i class="fas fa-home fa-lg"></i></router-link>
      <i class="fas fa-greater-than" style="margin-left: 1rem;"></i>
        <select id="project-selection" v-model="selectedProject" style="margin-left: 1rem;">
          <option v-for="project in projectNames" :value="project">
            {{ project }}
          </option>
        </select>
    </div>
    <router-link :to="`/${selectedProject}/exploreRuns`">Explore Runs</router-link> |
    <router-link :to="`/${selectedProject}/runDetails/1`">Compare Runs</router-link>
    |
    <router-link :to="`/${selectedProject}/compareGeos`">Geography Overview</router-link>
  </div>
  <router-view />
</template>

<style lang="scss">
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  //text-align: center;
  color: #2c3e50;
  // padding: 0 30px;
}

:root {
  --gpblue: #00aeef;
  --darkred: #9b4531;
  --yellow: #ffb100;
  --orange: #cf8236;
  --brightblue: #007be0;
  --olive: #665e1e;
  --teal: #007be0;
  --darkblue: #00447c;
  --lightred: #cf5c42;
  --grey: #5d6263;
  --lightgrey: #96999b;
  --lightblue: #e1f4fd;
}

body {
  color: #5d6263;
  background: #ffffff;
  font-family: "Literata", sans-serif;
  size: 18px;
  line-height: 1.5;
  font-weight: 500;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: #1e1e1e;
  background: #ffffff;
  font-family: "Rubik", sans-serif;
  font-weight: bold;
  line-height: 1;
}

h1 {
  font-size: 48px;
}

h2 {
  font-size: 34px;
}

h3 {
  font-size: 26px;
}

h4 {
  font-size: 22px;
}

h5 {
  font-size: 18px;
}

h6 {
  font-size: 15px;
}

a {
  //color: #2c3e50;
  color: #333;
}

.muted {
  color: rgba(50, 50, 50, 0.75);
}

.muted-3 {
  opacity: 0.7;
}
.muted-5 {
  opacity: 0.5;
}
.muted-8 {
  opacity: 0.2;
}

.tab {
  font-weight: 900;
  font-size: 17px;
  font-family: "Rubik", sans-serif;
}

.tab-option::before {
  content: open-quote;
}
.tab-option::after {
  content: close-quote;
}

#home {
  position: absolute;
  margin: auto;
  // height: 2rem;
  margin: 0 1rem;
}

#nav {
  padding: 15px;
  margin-bottom: 1rem;
  width: 100%;
  background: var(--lightblue);
  text-align: center;

  a {
    font-size: 17px;
    font-family: "Rubik", sans-serif;
    text-decoration: none;

    &.router-link-exact-active {
      // color: #00aeef;
      // text-decoration: underline;
      font-weight: 900;
    }

    &.router-link-active {
      // color: #00aeef;
      // text-decoration: underline;
      font-weight: 900;
    }
  }

  a:hover {
    // color: var(--darkblue);
    text-decoration: underline;
  }
}

/**
*** SIMPLE GRID
*** (C) ZACH COLE 2016
**/

@import url(https://fonts.googleapis.com/css?family=Lato:400,300,300italic,400italic,700,700italic);

/* UNIVERSAL */

// html,
// body {
//   height: 100%;
//   width: 100%;
//   margin: 0;
//   padding: 0;
//   left: 0;
//   top: 0;
//   font-size: 100%;
// }

/* ROOT FONT STYLES */

/* POSITIONING */

.left {
  text-align: left;
}

.right {
  text-align: right;
}

.center {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.justify {
  text-align: justify;
}

/* ==== GRID SYSTEM ==== */

.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.row {
  position: relative;
  width: 100%;
}

.row [class^="col"] {
  float: left;
  margin: 0.5rem 2%;
  min-height: 0.125rem;
}

.col-1,
.col-2,
.col-3,
.col-4,
.col-5,
.col-6,
.col-7,
.col-8,
.col-9,
.col-10,
.col-11,
.col-12 {
  width: 96%;
}

.col-1-sm {
  width: 4.33%;
}

.col-2-sm {
  width: 12.66%;
}

.col-3-sm {
  width: 21%;
}

.col-4-sm {
  width: 29.33%;
}

.col-5-sm {
  width: 37.66%;
}

.col-6-sm {
  width: 46%;
}

.col-7-sm {
  width: 54.33%;
}

.col-8-sm {
  width: 62.66%;
}

.col-9-sm {
  width: 71%;
}

.col-10-sm {
  width: 79.33%;
}

.col-11-sm {
  width: 87.66%;
}

.col-12-sm {
  width: 96%;
}

.row::after {
  content: "";
  display: table;
  clear: both;
}

.hidden-sm {
  display: none;
}

// @media only screen and (min-width: 33.75em) {  /* 540px */
//   .container {
//     width: 80%;
//   }
// }

@media only screen and (min-width: 45em) {
  /* 720px */
  .col-1 {
    width: 4.33%;
  }

  .col-2 {
    width: 12.66%;
  }

  .col-3 {
    width: 21%;
  }

  .col-4 {
    width: 29.33%;
  }

  .col-5 {
    width: 37.66%;
  }

  .col-6 {
    width: 46%;
  }

  .col-7 {
    width: 54.33%;
  }

  .col-8 {
    width: 62.66%;
  }

  .col-9 {
    width: 71%;
  }

  .col-10 {
    width: 79.33%;
  }

  .col-11 {
    width: 87.66%;
  }

  .col-12 {
    width: 96%;
  }

  .hidden-sm {
    display: block;
  }

  .working {
    cursor: progress !important;
  }
}

// @media only screen and (min-width: 60em) { /* 960px */
//   .container {
//     width: 75%;
//     max-width: 60rem;
//   }
// }
</style>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  onMounted,
  toRefs,
  computed,
} from "@vue/runtime-core";
import * as api from "@/api/API";
import { project } from "ramda";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "MainApp",
  components: {},
  setup(props: any, context: any) {

    const router = useRouter();

    const projectNames = ref([] as string[])
    const selectedProject = ref("")

    api.allProjectNames().then(r => {
      console.log("All project names: ", r)
      projectNames.value = r
      if (projectNames.value.length > 0) {
        selectedProject.value = projectNames.value[0]
      }
    })

    watch(() => selectedProject.value, (next, old) => {
      console.log("Old? ", old)
      console.log("New? ", next)

      if (old.length > 0) {
        const regex = new RegExp(`${old}`);
        console.log("Regex? ", regex);

        // replace 'old' in the URL with 'new'
        const current = router.currentRoute.value
        const currentPath = current.fullPath
        console.log("Current Path: ", currentPath);
        const newPath = currentPath.replace(regex, next)
        console.log("New Path: ", newPath)
        router.push(newPath)
      }
    })

    return {
      selectedProject,
      projectNames
    }
  },
});
</script>