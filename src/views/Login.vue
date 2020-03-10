<template>
  <div>
    <div id="login-body">
      <b-alert
        :show="dismissCountDown"
        dismissible
        fade
        variant="warning"
        @dismiss-count-down="countDownChanged"
      >
        {{ apiErrorMsg }}
      </b-alert>
      <b-form id="form-signin" @submit.stop.prevent>
        <label for="feedback-email">Email</label>
        <b-form-input
          id="feedback-email"
          v-model="input.email"
          :state="emailValidation"
        ></b-form-input>
        <b-form-invalid-feedback v-if="input.email" :state="emailValidation">{{
          emailValidationErrorMsg
        }}</b-form-invalid-feedback>
        <!-- <b-form-valid-feedback :state="emailValidation">Looks Good.</b-form-valid-feedback> -->

        <label for="feedback-password">Password</label>
        <b-form-input
          id="feedback-password"
          v-model="input.password"
          :state="passwordValidation"
          type="password"
        ></b-form-input>
        <b-form-invalid-feedback v-if="input.password" :state="passwordValidation">{{
          passwordValidationErrorMsg
        }}</b-form-invalid-feedback>
        <!-- <b-form-valid-feedback :state="passwordValidation">Looks Good.</b-form-valid-feedback> -->

        <b-button
          v-if="signingUp"
          id="button-get-pinata"
          type="submit"
          variant="primary"
          @click="OpenPinata()"
          >Get Pinata</b-button
        >
        <br />

        <label v-if="signingUp" for="feedback-pinata-api">Pinata API key</label>
        <b-form-input
          v-if="signingUp"
          id="feedback-pinata-api"
          v-model="input.pinataApi"
          :state="pinataApiValidation"
        ></b-form-input>
        <b-form-invalid-feedback v-if="signingUp" :state="pinataApiValidation">{{
          pinataApiValidationErrorMsg
        }}</b-form-invalid-feedback>
        <!-- <b-form-valid-feedback v-if="signingUp" :state="pinataApiValidation">Looks Good.</b-form-valid-feedback> -->

        <label v-if="signingUp" for="feedback-pinata-secret">Pinata secret API key</label>
        <b-form-input
          v-if="signingUp"
          id="feedback-pinata-secret"
          v-model="input.pinataSecret"
          :state="pinataSecretValidation"
          type="password"
        ></b-form-input>
        <b-form-invalid-feedback v-if="signingUp" :state="pinataSecretValidation">{{
          pinataSecretValidationErrorMsg
        }}</b-form-invalid-feedback>
        <!-- <b-form-valid-feedback v-if="signingUp" :state="pinataSecretValidation">Looks Good.</b-form-valid-feedback> -->

        <span id="login-signup-buttons">
          <b-button
            v-if="signingUp"
            :disabled="loginButtonDisable"
            type="submit"
            variant="primary"
            @click="SignUp()"
          >
            <font-awesome-icon v-show="loggingIn" icon="spinner" spin />
            Sign up</b-button
          >
          <b-button
            v-else
            :disabled="loginButtonDisable"
            type="submit"
            variant="primary"
            @click="login()"
          >
            <font-awesome-icon v-show="loggingIn" icon="spinner" spin />
            Log in</b-button
          >

          <b-button
            v-if="signingUp"
            id="sign-up-a"
            type="submit"
            variant="secondary"
            @click="toggleSigningUp()"
            >Log in</b-button
          >
          <b-button
            v-else
            id="sign-up-a"
            type="submit"
            variant="secondary"
            @click="toggleSigningUp()"
            >Sign up</b-button
          >
        </span>
      </b-form>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex';
import { BForm, BFormInvalidFeedback, BFormInput, BAlert } from 'bootstrap-vue';
const axios = require('axios');

export default {
  name: 'Login',
  components: { BForm, BFormInvalidFeedback, BFormInput, BAlert },
  data() {
    return {
      input: {
        email: '',
        password: '',
        pinataApi: '',
        pinataSecret: '',
      },
      apiErrorMsg: '',
      failedLogin: false,
      dismissSecs: 5,
      dismissCountDown: 0,
      loggingIn: false,
      signingUp: false,
    };
  },
  computed: {
    ...mapState({
      serverURL: 'serverURL',
    }),
    emailValidation() {
      const email = this.input.email;
      if (email.length < 4 || email.length > 25) {
        return false;
      }
      if (!email.includes('@') || !email.includes('.')) {
        return false;
      } else {
        return true;
      }
    },
    emailValidationErrorMsg() {
      const email = this.input.email;
      if (email.length < 4 || email.length > 25) {
        return 'Email must be 5-25 characters long';
      }
      if (!email.includes('@') || !email.includes('.')) {
        return 'Invalid email';
      } else {
        return null;
      }
    },
    passwordValidation() {
      const password = this.input.password;
      if (password.length < 8 || password.length > 20) {
        return false;
      } else {
        return true;
      }
    },
    passwordValidationErrorMsg() {
      const password = this.input.password;
      if (password.length < 8 || password.length > 20) {
        return 'Password must be 8-20 characters long';
      } else {
        return null;
      }
    },
    pinataApiValidation() {
      const pinataApi = this.input.pinataApi;
      if (pinataApi.length < 20 || pinataApi.length > 20) {
        return false;
      } else {
        return true;
      }
    },
    pinataApiValidationErrorMsg() {
      const pinataApi = this.input.pinataApi;
      if (pinataApi.length < 20 || pinataApi.length > 20) {
        return "Invalid pinata api key. In pinata, click the profile icon, then 'account'";
      } else {
        return null;
      }
    },
    pinataSecretValidation() {
      const pinataSecret = this.input.pinataSecret;
      if (pinataSecret.length < 64 || pinataSecret.password > 64) {
        return false;
      } else {
        return true;
      }
    },
    pinataSecretValidationErrorMsg() {
      const pinataSecret = this.input.pinataSecret;
      if (pinataSecret.length < 64 || pinataSecret.length > 64) {
        return "Invalid pinata api secret key. In pinata, click the profile icon, then 'account'";
      } else {
        return null;
      }
    },
    invalidSignUp() {
      if (
        !this.emailValidation ||
        !this.passwordValidation ||
        !this.pinataApiValidation ||
        !this.pinataSecretValidation
      ) {
        return true;
      } else {
        return false;
      }
    },
    invalidLogin() {
      if (!this.emailValidation || !this.passwordValidation) {
        return true;
      } else {
        return false;
      }
    },
    loginButtonDisable() {
      if (!this.emailValidation || !this.passwordValidation || this.loggingIn) {
        return true;
      } else {
        return false;
      }
    },
  },
  watch: {
    failedLogin: function() {
      if (this.failedLogin === true) {
        this.showAlert();
      }
    },
  },
  mounted() {
    this.$emit('homeLoad');
  },
  methods: {
    async callAPI(url, headers, method, callback = null, data = null) {
      const that = this;
      const options = {
        url: url,
        headers: headers,
        method: method,
      };
      if (data !== null) {
        options.data = data;
      }
      await axios(options)
        .then(response => {
          console.log(response);
          data = response.data;
          if (callback !== null) {
            callback(data, that);
          }
          return data;
        })
        .catch(function(err) {
          that.failedLogin = true;
          that.apiErrorMsg = err;
        });
    },
    login() {
      this.loggingIn = true;
      this.failedLogin = false;
      const loginURL = this.serverURL + '/login';
      const username = this.input.email;
      const password = this.input.password;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(username + ':' + password),
      };
      const loginCallback = function(data, that) {
        console.log(data);
        if (!data.token) {
          that.failedLogin = true;
          that.apiErrorMsg = data.error;
        } else {
          that.$store.commit('updateJwt', data.token);
          that.$store.dispatch('checkJwt');
          that.$store.commit('updatePinataKeys', data.pinata_keys);
          const userCollection = that.$store.state.user_collection;
          userCollection.user_id = data.user_id;
          that.$store.commit('updateUserCollection', userCollection);
          that.$store.commit('updateInitialSync', 0);
          that.$router.push('home');
        }
        that.loggingIn = false;
      };
      this.callAPI(loginURL, headers, 'GET', loginCallback);
    },
    SignUp() {
      this.loggingIn = true;
      this.failedLogin = false;
      const signupURL = this.serverURL + '/sign_up';
      const data = {
        email: this.input.email,
        password: this.input.password,
        pinata_api: this.input.pinataApi,
        pinata_key: this.input.pinataSecret,
      };
      const headers = { 'Content-Type': 'application/json' };
      const signupCallback = function(data, that) {
        console.log(data);
        if (!data.message) {
          that.failedLogin = true;
          that.apiErrorMsg = data.error;
        } else {
          that.login();
        }
        that.loggingIn = false;
      };
      this.callAPI(signupURL, headers, 'POST', signupCallback, data);
    },
    toggleSigningUp() {
      this.signingUp = !this.signingUp;
    },

    OpenPinata() {
      window.open('https://pinata.cloud/signup', '_blank');
    },
    countDownChanged(dismissCountDown) {
      this.dismissCountDown = dismissCountDown;
    },
    showAlert() {
      this.dismissCountDown = this.dismissSecs;
    },
  },
};
</script>

<style scoped>
#login-body {
  align-items: center;
  margin: auto;
  max-width: 370px;
  padding: 20px;
  overflow-y: auto;
}
h1 {
  text-align: center;
}
#form-signin {
  max-width: 330px;
}
#sign-up-a {
  margin: 10px;
}
#login-signup-buttons {
  margin-top: 10px;
}
#button-get-pinata {
  margin-top: 10px;
}
label {
  margin-top: 5px;
}
</style>
