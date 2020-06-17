// inpspired by https://github.com/adambrgmn/react-oauth-flow but using the popular
// client-oauth2 library: https://github.com/mulesoft/js-client-oauth2/ and added
// pkce functionality + some sensible defaults for Innoactive's projects

import PropTypes from "prop-types";
import { Component } from "react";
import ClientOAuth2 from "client-oauth2";
import queryString from "query-string";

import { generateCodeChallenge, getCodeVerifier } from "./pkce";

class BaseOAuthClientComponent extends Component {
  constructor(props) {
    super(props);

    const { apiRoot, clientId, clientSecret } = props;

    this.oauthClient = new ClientOAuth2({
      clientId,
      clientSecret,
      accessTokenUri: `${apiRoot}/oauth/token/`,
      authorizationUri: `${apiRoot}/oauth/authorize`,
      redirectUri: `${document.location.origin}/hub/callback/`,
      scopes: ["read"],
    });
  }

  render() {
    return null;
  }
}

const basePropTypes = {
  apiRoot: PropTypes.string.isRequired,
  clientId: PropTypes.string.isRequired,
  clientSecret: PropTypes.string.isRequired,
};

BaseOAuthClientComponent.propTypes = basePropTypes;

export class RequestAuthorizationCode extends BaseOAuthClientComponent {
  constructor(props) {
    super(props);

    this.state = {
      // generate code challenge for PKCE
      code_challenge: generateCodeChallenge(),
    };
  }

  render() {
    // default for children function is redirecting the browser
    const {
      children = (url) => {
        window.location.assign(url);
        return null;
      },
      state,
    } = this.props;

    // request user's authorization by redirecting
    const url = this.oauthClient.code.getUri({
      state: state ? JSON.stringify(state) : undefined,
      query: {
        code_challenge: this.state.code_challenge,
        code_challenge_method: "S256",
      },
    });

    return children(url);
  }
}

RequestAuthorizationCode.propTypes = {
  ...basePropTypes,
  state: PropTypes.objectOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
      PropTypes.object,
    ])
  ),
  children: PropTypes.func,
};

export class AuthorizationCodeCallback extends BaseOAuthClientComponent {
  constructor(props) {
    super(props);

    this.state = {
      processing: true,
      state: null,
      error: null,
    };

    this.getAuthorizationCode = this.getAuthorizationCode.bind(this);
  }

  componentDidMount() {
    this.getAuthorizationCode();
  }

  getAuthorizationCode() {
    const { onAuthSuccess } = this.props;

    // Obtain the generated and stored code verifier for PKCE
    const codeVerifier = getCodeVerifier();

    // parse the state that was sent along initially with the authorization request
    const { state: stateString } = queryString.parse(document.location.search);
    const state = stateString ? JSON.parse(stateString) : undefined;

    this.oauthClient.code
      .getToken(document.location.href, {
        body: { code_verifier: codeVerifier },
      })
      .then((token) => {
        if (typeof onAuthSuccess === "function") {
          onAuthSuccess(token);
        }

        this.setState(() => ({ processing: false, state, token }));
      })
      .catch((error) => {
        this.setState(() => ({
          processing: false,
          error,
        }));
      });
  }

  render() {
    const { children } = this.props;
    const { processing, state, error } = this.state;

    return children({ processing, state, error });
  }
}

AuthorizationCodeCallback.propTypes = {
  ...basePropTypes,
  children: PropTypes.func,
  onAuthSuccess: PropTypes.func,
};
