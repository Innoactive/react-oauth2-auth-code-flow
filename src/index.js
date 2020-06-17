// inpspired by https://github.com/adambrgmn/react-oauth-flow but using the popular
// client-oauth2 library: https://github.com/mulesoft/js-client-oauth2/ and added
// pkce functionality + some sensible defaults for Innoactive's projects

import PropTypes from "prop-types";
import React, { Component } from "react";
import { OauthSender, OauthReceiver } from "react-oauth-flow";

import { generateCodeChallenge, getCodeVerifier } from "./pkce";

class BaseOAuthClientComponent extends Component {}

const basePropTypes = {
  oauthClient: PropTypes.shape({
    options: PropTypes.shape({
      clientId: PropTypes.string.isRequired,
      clientSecret: PropTypes.string.isRequired,
      redirectUri: PropTypes.string.isRequired,
      authorizationUri: PropTypes.string.isRequired,
      accessTokenUri: PropTypes.string.isRequired,
    }),
    code: PropTypes.shape({
      getToken: PropTypes.func.isRequired,
    }),
  }),
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
    const { oauthClient, args = {}, ...props } = this.props;

    // obtain required options for OauthSender
    const options = {
      ...props,
      // use oauth client's options if available
      clientId: oauthClient.options.clientId,
      authorizeUrl: oauthClient.options.authorizationUri,
      redirectUri: oauthClient.options.redirectUri,
      args: {
        // add PKCE params to existing args
        code_challenge: this.state.code_challenge,
        code_challenge_method: "S256",
        ...args,
      },
    };

    return <OauthSender {...options} />;
  }
}

delete OauthSender.propTypes.authorizeUrl;
delete OauthSender.propTypes.clientId;
delete OauthSender.propTypes.redirectUri;

RequestAuthorizationCode.propTypes = {
  ...basePropTypes,
  ...OauthSender.propTypes,
};

RequestAuthorizationCode.defaultProps = {
  ...OauthSender.defaultProps,
};

export class AuthorizationCodeCallback extends BaseOAuthClientComponent {
  render() {
    const { oauthClient, ...props } = this.props;

    // Obtain the generated and stored code verifier for PKCE
    const codeVerifier = getCodeVerifier();

    // obtain required options for OauthReceiver
    const options = {
      ...props,
      // use oauth client's options if available
      clientId: oauthClient.options.clientId,
      clientSecret: oauthClient.options.clientSecret,
      tokenUrl: oauthClient.options.accessTokenUri,
      redirectUri: oauthClient.options.redirectUri,
      tokenFn:
        props.tokenFn ||
        function () {
          return oauthClient.code
            .getToken(document.location.href, {
              body: { code_verifier: codeVerifier },
            })
            .then((token) => {
              // react-oauth-flow expects the `access_token` attribute to exist
              token.access_token = token;
              return token;
            });
        },
    };

    return <OauthReceiver {...options} />;
  }
}

delete OauthReceiver.propTypes.tokenUrl;
delete OauthReceiver.propTypes.redirectUri;
delete OauthReceiver.propTypes.clientId;
delete OauthReceiver.propTypes.clientSecret;

AuthorizationCodeCallback.propTypes = {
  ...basePropTypes,
  ...OauthReceiver.propTypes,
};

AuthorizationCodeCallback.defaultProps = {
  ...OauthReceiver.defaultProps,
};
