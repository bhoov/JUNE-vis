<template>
  <div class="container main">
    <div class="row">
      <div class="col-2">
        <br />
        <img
          alt="Global Pulse Logo"
          src="../assets/GP_logo_RGB.svg"
          class="right"
        />
        <img src="" alt="" />
      </div>
      <div class="col-10">
        <!--    <img alt="Vue logo" src="../assets/logo.png">-->
        <h2 class="with-subtitle">Welcome to Camp Dashboard</h2>
        <h4 class="muted subtitle">
          An operational response simulation tool for epidemics within
          settlements
        </h4>

        <p>
          This dashboard presents the modelling results of an agent-based

          <a
            href="https://www.unglobalpulse.org/2020/10/modelling-the-spread-of-covid-19-and-the-impact-of-public-health-interventions-in-coxs-bazar-and-other-refugee-camps/"
          >
            epidemiological simulation for Cox’s Bazar, Bangladesh</a
          >
          using <a href="https://github.com/bhoov/JUNE-vis">JUNE-vis</a>.
        </p>

        <p>
          Here, you can compare simulations of how the COVID-19 epidemic could
          evolve under several scenarios comparing the effectiveness of mask
          wearing. You can create visualizations for new
          <a href="https://github.com/IDAS-Durham/JUNE">JUNE</a>
          simulations by following the
          <a href="https://bhoov.github.io/JUNE-vis/Create%20Project.html"
            >instructions</a
          >.
        </p>
        <br />
        <p class="muted-3">
          A short example of how to use this dashboard can be used can be found
          in Section 7 of the accompanying paper:
          <a
            href="https://www.medrxiv.org/content/10.1101/2021.01.27.21250611v1"
            >Operational response simulation tool for epidemics within refugee
            and IDP settlements</a
          >
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main {
  max-width: 1080px;
}

.home {
  margin: auto;
  line-height: 1.6;
}

a:visited {
  color: var(--darkblue);
}

.with-subtitle {
  margin-bottom: 0rem;
  padding-bottom: 0rem;
}

.subtitle {
  margin-top: 0.8rem;
  padding-top: 0rem;
  /* font-style: oblique; */
}

.param {
  font-weight: 600;
  /* border-bottom: 1px dashed black; */
}

.param-option {
  /* font-weight: 600; */
  /* font-style: oblique; */
  border-bottom: 1px dashed black;
}

.plot-info {
  font-weight: 600;
  /*border-bottom: 1px dotted black;*/
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src

export default defineComponent({
  name: "Intro",
  components: {
    HelloWorld,
  },
});
</script>
