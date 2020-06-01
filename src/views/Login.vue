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
        <p v-if="showSignup" class="mt-1">
          Signing up with IPFC, you will recieve a Pinata.cloud account with 1GB of free storage.
          Check your email for activation.
        </p>
        <span id="login-signup-buttons">
          <b-button
            v-if="showSignup"
            :disabled="loginButtonDisable"
            type="submit"
            variant="primary"
            @click="signup(serverUrl)"
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
            v-if="showSignup"
            id="sign-up-a"
            type="submit"
            variant="secondary"
            @click="toggleShowSignup()"
            >Log in</b-button
          >
          <b-button
            v-else
            id="sign-up-a"
            type="submit"
            variant="secondary"
            @click="toggleShowSignup()"
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
import defaultCollection from '../assets/defaultCollection.json';
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
      showSignup: false,
    };
  },
  computed: {
    ...mapState({
      serverUrl: 'serverUrl',
    }),
    emailValidation() {
      const email = this.input.email;
      if (email.length <= 5 || email.length >= 64) {
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
      if (email.length <= 5 || email.length >= 64) {
        return 'Email must be 5-64 characters long';
      }
      if (!email.includes('@') || !email.includes('.')) {
        return 'Invalid email';
      } else {
        return null;
      }
    },
    passwordValidation() {
      const password = this.input.password;
      if (password.length < 8 || password.length >= 64) {
        return false;
      } else {
        return true;
      }
    },
    passwordValidationErrorMsg() {
      const password = this.input.password;
      if (password.length < 8 || password.length >= 64) {
        return 'Password must be 8-64 characters long';
      } else {
        return null;
      }
    },

    invalidSignup() {
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
  mounted() {},
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
      // console.log('calling API, options', options);
      await axios(options)
        .then(response => {
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
      const loginURL = this.serverUrl + '/login';
      const username = this.input.email;
      const password = this.input.password;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(username + ':' + password),
      };
      const loginCallback = function(data, that) {
        if (!data.token) {
          that.loggingIn = false;
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
    signup(serverUrl) {
      this.loggingIn = true;
      this.failedLogin = false;
      const that = this;
      const email = this.input.email;
      const password = this.input.password;
      const pinataSignupEndpoint = 'https://api.pinata.cloud/users/signUpNewUser';
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      axios
        .post(pinataSignupEndpoint, params)
        .then(response => {
          const responseData = response.data;
          // console.log('APICall data', data);
          const signupUrl = serverUrl + '/sign_up';
          const signUpData = {
            email: email,
            password: password,
            user_collection: defaultCollection.user_collection,
            pinata_api: responseData.userInformation.api_key,
            pinata_key: responseData.userInformation.api_secret,
          };
          const headers = { 'Content-Type': 'application/json' };
          const signupCallback = function(data) {
            if (!data.message) {
              that.loggingIn = false;
              that.failedLogin = true;
              that.apiErrorMsg = data.error;
            } else {
              that.login(email, password);
            }
          };
          that.callAPI(signupUrl, headers, 'POST', signupCallback, signUpData);
        })
        .catch(function(err) {
          // console.log(err.response);
          that.loggingIn = false;
          that.failedLogin = true;
          that.apiErrorMsg = err.response.data.error || err.response;
        });
    },
    toggleShowSignup() {
      this.showSignup = !this.showSignup;
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
