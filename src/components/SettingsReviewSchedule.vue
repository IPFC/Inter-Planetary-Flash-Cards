<template>
  <b-container id="main" fluid>
    <b-list-group-item button @click="openSettings()">
      Review Schedule
    </b-list-group-item>
    <b-list-group v-if="settingsOpen" class="second-layer-settings">
      <b-form>
        <b-form-group
          id="max-cards"
          label="Maximum number of cards to review in a day"
          label-for="max-cards"
          description="Note: You might have to review a new card several times the first day. 
          This sets the number of unique cards to review in a day, not review times."
        >
          <b-form-input
            id="max-cards-input"
            v-model="scheduleSettings.maxCards"
            type="number"
            required
          ></b-form-input>
        </b-form-group>
        <b-form-group
          id="initial-schedule"
          label="Initial review schedule: Day 1"
          label-for="initial-schedule"
          description="How many steps and their time in minutes.
          Increase the steps if you are often forgetting words on day two."
        >
          <b-container>
            <b-row>
              <b-button class="btn-circle initial-schedule" @click="deleteInitialReviewStep()">
                <font-awesome-icon color="white" size="1x" icon="minus-circle"></font-awesome-icon>
              </b-button>
              <b-form-input
                id="input-1-1"
                v-model="scheduleSettings.initialReviews[0]"
                class="initial-schedule"
                type="number"
                required
              ></b-form-input>
              <b-form-input
                v-if="scheduleSettings.initialReviews.length > 1"
                id="input-1-2"
                v-model="scheduleSettings.initialReviews[1]"
                class="initial-schedule"
                type="number"
              ></b-form-input>
              <b-form-input
                v-if="scheduleSettings.initialReviews.length > 2"
                id="input-1-3"
                v-model="scheduleSettings.initialReviews[2]"
                class="initial-schedule"
                type="number"
              ></b-form-input>
              <b-form-input
                v-if="scheduleSettings.initialReviews.length > 3"
                id="input-1-4"
                v-model="scheduleSettings.initialReviews[3]"
                class="initial-schedule"
                type="number"
              ></b-form-input>
              <b-form-input
                v-if="scheduleSettings.initialReviews.length > 4"
                id="input-1-5"
                v-model="scheduleSettings.initialReviews[4]"
                class="initial-schedule"
                type="number"
              ></b-form-input>
              <b-button class="btn-circle initial-schedule" @click="addInitialReviewStep()">
                <font-awesome-icon color="white" size="1x" icon="plus-circle"></font-awesome-icon>
              </b-button>
            </b-row>
          </b-container>
        </b-form-group>
        <b-form-group
          id="multiplier"
          label="Multiplier: Day 2 and on"
          label-for="multiplier"
          description="At default 2x reviews will be spread 2, 4, 8, 16, 32, etc. days apart. Set a bit lower if you often fail later reviews."
        >
          <b-container>
            <b-row>
              <b-form-input
                v-model="scheduleSettings.laterReviewsMultiplier"
                style="max-width: 70%"
                type="range"
                min="1"
                max="3"
                step="0.05"
              ></b-form-input>
              <div class="ml-4" style="font-weight: bold">
                {{ scheduleSettings.laterReviewsMultiplier }}x
              </div>
            </b-row>
          </b-container>
        </b-form-group>
        <b-form-group
          id="randomizer"
          label="Randomizer"
          label-for="randomizer"
          description="How much randomness to add to the card schedule. This ensures the cards won't always be in the same order and all due on the same day."
        >
          <b-container>
            <b-row>
              <b-form-input
                v-model="scheduleSettings.randomizer"
                style="max-width: 70%"
                type="range"
                min="0"
                max=".5"
                step="0.01"
              ></b-form-input>
              <div class="ml-4" style="font-weight: bold">{{ randomizerPercentage }}%</div>
            </b-row>
          </b-container>
        </b-form-group>
        <b-form-group
          id="fail-mode"
          label="Fail mode:"
          label-for="fail-mode"
          description="How many levels should the card be reduced by on an incorrect answer."
        >
          <b-form-select v-model="selected" @input="failModeSelect(selected)">
            <b-form-select-option value="reset">Reset card level to 0</b-form-select-option>
            <b-form-select-option number value="1">Decrease level by 1</b-form-select-option>
            <b-form-select-option number value="2">Decrease level by 2</b-form-select-option>
            <b-form-select-option number value="3">Decrease level by 3</b-form-select-option>
            <b-form-select-option number value="4">Decrease level by 4</b-form-select-option>
            <b-form-select-option number value="5">Decrease level by 5</b-form-select-option>
          </b-form-select>
        </b-form-group>
        <b-button @click="submit()">
          Save changes
        </b-button>
      </b-form>
    </b-list-group>
  </b-container>
</template>

<script>
import {
  BListGroup,
  BListGroupItem,
  BFormInput,
  BForm,
  BFormSelect,
  BFormSelectOption,
  BFormGroup,
} from 'bootstrap-vue';

export default {
  name: 'ReviewScheduleSettings',
  components: {
    BListGroup,
    BListGroupItem,
    BFormInput,
    BForm,
    BFormSelect,
    BFormSelectOption,
    BFormGroup,
  },
  data() {
    return {
      selected: this.$store.state.userCollection.webapp_settings.scheduleSettings.failMode,
      settingsOpen: false,
      scheduleSettings: {
        // just an example. these will be reset to store's values at opening
        initialReviews: [1, 5, 20], // in minutes
        laterReviewsMultiplier: 2, // how many x
        failMode: 'reset', // if set to a number, is how many levels to subtract
        randomizer: 0.1, // percent to randomize
        maxCards: 50,
      },
    };
  },
  computed: {
    randomizerPercentage() {
      return Math.round(this.scheduleSettings.randomizer * 100);
    },
  },
  watch: {},
  methods: {
    openSettings() {
      // this.setMenu()
      this.settingsOpen = !this.settingsOpen;
    },
    setMenu() {
      this.scheduleSettings = this.$store.state.userCollection.webapp_settings.scheduleSettings;
    },
    submit() {
      const submitData = {
        settingSection: 'scheduleSettings',
        settings: this.scheduleSettings,
      };
      this.$store.commit('updateSettingSection', submitData);
    },
    addInitialReviewStep() {
      this.scheduleSettings.initialReviews.push(0);
    },
    deleteInitialReviewStep() {
      this.scheduleSettings.initialReviews.splice(-1, 1);
    },
    failModeSelect(value) {
      if (value === 'reset') {
        this.scheduleSettings.failMode = value;
      } else {
        this.scheduleSettings.failMode = parseInt(value);
      }
    },
  },
};
</script>

<style scoped>
#main {
  padding: 0;
}
#main >>> label {
  font-weight: bold;
}
.second-layer-settings {
  padding: 20px;
}
.initial-schedule {
  max-width: 3.8em;
  margin-right: 5px;
}
.btn-circle {
  background-color: rgb(216, 216, 216);
  border: none;
}
</style>
