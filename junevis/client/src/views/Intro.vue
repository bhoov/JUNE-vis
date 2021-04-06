<template>
  <div class="container main">
    <div class="row">
      <div class="col-2"> 
          <br>
           <img alt="Global Pulse Logo" src="../assets/GP_logo_RGB.svg" class="right">
        <img src="" alt="">
      </div>
      <div class="col-10">
        <!--    <img alt="Vue logo" src="../assets/logo.png">-->
        <h2 class="with-subtitle">Welcome to Camp Dashboard</h2>
        <h4 class="muted subtitle">
          An operational response simulation tool for epidemics within settlements
        </h4>
    
        <p>
          This dashboard presents the modelling results of an agent-based
    
          <a
            href="https://www.unglobalpulse.org/2020/10/modelling-the-spread-of-covid-19-and-the-impact-of-public-health-interventions-in-coxs-bazar-and-other-refugee-camps/"
          >
            epidemiological simulation for Cox’s Bazar, Bangladesh</a
          >. 
        </p>
      
        <p>
          Here, you can compare simulations of how the COVID-19 epidemic could
          evolve under several scenarios regarding the opening of learning centers. 
        </p>
        <br>
        <hr>
        <h5>How to use this dashboard</h5>
        <p>Under the
          <router-link to="/exploreRuns">
            <span class="tab">Explore Runs</span>
          </router-link>
          tab, you can see how specific variables in the model evolve under 
          different scenarios. You can vary these scenarios
          by specifying whether <span class="param">learning centers</span> are
          <span class="param-option">open</span> or
          <span class="param-option">closed</span>, and what
          <span class="param">intensities of interactions</span> occur in
          <span class="param-option">indoor</span> settings,
          <span class="param-option">shelter</span> settings, and
          <span class="param-option">outdoor</span> settings.
        </p>
    
        <p>
          Use the
          <span class="tab-option">Select field</span> dropdown menu to plot your
          variable of interest, and use the
          <span class="tab-option">Select region</span> dropdown to select your
          region of interest. Below the main plot, you will see all the scenario
          simulations that were run for this project, each associated with a
          thumbnail visualizing that scenario's SIR curve.
        </p>
        <br>
        <p>
          Clicking the
          <router-link to="/mask_wearing/runDetails/1">
            <span class="tab">Compare Runs</span>
          </router-link>
          tab, or one of the scenario thumbnails at the bottom of the Explore Runs
          page, will take you to a page with more details about a particular
          scenario run. These include plots on: the number of people
          <span class="plot-info">susceptible, infected, recovered</span> over time;
          the number of people infected at given
          <span class="plot-info">locations of the camp</span> over time; the
          percentage of the population in given
          <span class="plot-info">age ranges affected </span>over time; and how
          different model variables vary in different
          <span class="plot-info">geographic regions</span>.
          </p>
        <p>
          You can view results
          from any 2 runs at a given time and vary parameter values in the same way
          as on the Explore Runs page. (Note that one set of plots will be 
          <span class="muted-3"
            >faded out</span
          > if the 2 runs are identical.)
        </p>
        <br>
        <p>
          The
          <router-link to="/compareGeos"
            ><span class="tab">Geography Overview</span></router-link
          >
          shows the geographic variation in each of the simulation results (runs).
          Use the dropdown menu to select the variable of interest. Red curves show
          the trend of the selected variable for each region, whereas the gray
          shading of each region reveals which regions were impacted the most over
          the course of each simulation. Values connecting to the lightest and
          darkest shades are shown as dots on the bottom left corner of each card.
        </p>
        <br>
        <p class="muted-3">
            An example of how this dashboard can be used is found in Global Pulse
            Report 3: Learning center reopening.
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


a:visited{
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
