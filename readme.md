# React OAuth2 Auth Code Flow

> Simplifying authorization via OAuth2's Authorization Code Flow (and PKCE) via React Components

## What

`react-oauth2-auth-code-flow` is a library of components to simplify the use of [OAuth2's Authorization Code Grant][auth code grant] specifically within [react]
applications in the context of Innoactive's Portal services.

This package builds upon the excellent [react-oauth2-auth-code-flow] components to:

1. generate the necessary link to send users to the correct location to grant authorization
1. obtain an access token once the user is back on your site

and uses [client-oauth2] under the hood, thereby combining two very well-designed libraries.

This library also supports the [PKCE extension][oauth2-pkce], which is recommended for SPAs, out of the box.

## Installation

**using `npm`:**

```sh
npm install --save react-oauth2-auth-code-flow
```

**using `yarn`:**

```sh
yarn add react-oauth2-auth-code-flow
```

This package currently depends on having a module bundler in place, i.e. there's no browser compatible version (umd) available.

## Usage

`react-oauth2-auth-code-flow` exports two Components:

- [`RequestAuthorizationCode`](#requestauthorizationcode-)
- [`AuthorizationCodeCallback`](#authorizationcodecallback-)

### `<RequestAuthorizationCode />`

```js
import React, { Component } from "react";
import { RequestAuthorizationCode } from "react-oauth2-auth-code-flow";
import ClientOAuth2 from "client-oauth2";

const oauthClient = new ClientOAuth2({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  accessTokenUri: `${apiRoot}/oauth/token/`,
  authorizationUri: "https://www.dropbox.com/oauth2/authorize",
  redirectUri: "https://www.yourapp.com/auth/dropbox",
  scopes: ["read"],
});

export default class SendToDropbox extends Component {
  render() {
    return (
      <RequestAuthorizationCode
        oauthClient={oauthClient}
        state={{ from: "/settings" }}
        render={({ url }) => <a href={url}>Connect to Dropbox</a>}
      />
    );
  }
}
```

Use `<RequestAuthorizationCode />` to send your users to the correct endpoints at your OAuth2
service.

#### Props

| Prop          | Type           | Required | Default | Description                                                                                                         |
| :------------ | :------------- | :------- | :------ | :------------------------------------------------------------------------------------------------------------------ |
| `oauthClient` | `ClientOAuth2` | yes      | -       | An instance of the [ClientOAuth2][client-oauth2] library                                                            |
| `state`       | `object`       | no       | -       | Additional state to get back from the service provider [(read more below)](#state)                                  |
| `args`        | `object`       | no       | -       | Additional args to send to service provider, e.g. `scope`. Will be serialized by [qs](https://github.com/ljharb/qs) |

#### Render

`<RequestAuthorizationCode />` can be used in two ways, either by a render-prop,
or component-prop. In either way they will recieve the generated `url` as a prop/arg.

```js
const RenderProp = (props) => (
  <RequestAuthorizationCode
    {...props}
    render={({ url }) => <a href={url}>Connect</a>}
  />
);

const Link = ({ url }) => <a href={url}>Connect</a>;
const ComponentProp = (props) => (
  <RequestAuthorizationCode {...props} component={Link} />
);
```

#### State

You can pass some state along with the auth process. This state will be sent
back by the OAuth-provider once the process is done. This state can for example
then be used to redirect the user back to where they started the auth process.

### `<AuthorizationCodeCallback />`

```js
import React, { Component } from "react";
import { AuthorizationCodeCallback } from "react-oauth2-auth-code-flow";
import ClientOAuth2 from "client-oauth2";

const oauthClient = new ClientOAuth2({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  accessTokenUri: `${apiRoot}/oauth/token/`,
  authorizationUri: "https://www.dropbox.com/oauth2/authorize",
  redirectUri: "https://www.yourapp.com/auth/dropbox",
  scopes: ["read"],
});

export default class ReceiveFromDropbox extends Component {
  handleSuccess = async (accessToken, { response, state }) => {
    console.log("Successfully authorized");
    await setProfileFromDropbox(accessToken);
    await redirect(state.from);
  };

  handleError = (error) => {
    console.error("An error occurred");
    console.error(error.message);
  };

  render() {
    return (
      <AuthorizationCodeCallback
        oauthClient={oauthClient}
        onAuthSuccess={this.handleSuccess}
        onAuthError={this.handleError}
        render={({ processing, state, error }) => (
          <div>
            {processing && <p>Authorizing now...</p>}
            {error && (
              <p className="error">An error occurred: {error.message}</p>
            )}
          </div>
        )}
      />
    );
  }
}
```

Use `<AuthorizationCodeCallback />` to handle authorization when the user is being
redirected from the OAuth2-provider.

#### Props

| Prop             | Type                 | Required | Default | Description                                                                             |
| :--------------- | :------------------- | :------- | :------ | :-------------------------------------------------------------------------------------- |
| `oauthClient`    | `ClientOAuth2`       | yes      | -       | An instance of the [ClientOAuth2][client-oauth2] library                                |
| `args`           | `object`             | no       | -       | Args will be attatched to the request to the token endpoint. Will be serialized by `qz` |
| `location`       | `{ search: string }` | no       | -       | Used to extract info from querystring [(read more below)](#location-and-querystring)    |
| `querystring`    | `string`             | no       | -       | Used to extract info from querystring [(read more below)](#location-and-querystring)    |
| `tokenFetchArgs` | `object`             | no       | `{}`    | Used to fetch the token endpoint [(read more below)](#tokenfetchargs)                   |
| `tokenFn`        | `func`               | no       | `null`  | Used to bypass default fetch function to fetch the token [(read more below)](#tokenfn)  |

#### Events

- `onAuthSuccess(accessToken, result)`

| Arg               | Type     | Description                                                  |
| :---------------- | :------- | :----------------------------------------------------------- |
| `accessToken`     | `string` | Access token recieved from OAuth2 provider                   |
| `result`          | `object` |                                                              |
| `result.response` | `object` | The full token response from the call to the token-endpoint  |
| `result.state`    | `object` | The state recieved from provider, if it was provided earlier |

- `onAuthError(error)`

| Arg     | Type    | Description                                        |
| :------ | :------ | :------------------------------------------------- |
| `error` | `Error` | Error with message as description of what happened |

#### Render

`<AuthorizationCodeCallback />` can be used in two ways, either by a render-prop or component-prop.
Either way they will recieve three props/args:

- `processing: boolean`: True if authorization is in progress
- `state: object`: The state received from provider (might be null)
- `error: Error`: An error object if an error occurred

```js
const RenderProp = (props) => (
  <AuthorizationCodeCallback
    {...props}
    render={({ processing, state, error }) => (
      <div>
        {processing && <p>Authorization in progress</p>}
        {state && <p>Will redirect you to {state.from}</p>}
        {error && <p className="error">Error: {error.message}</p>}
      </div>
    )}
  />
);

const View = ({ processing, state, error }) => (
  <div>
    {processing && <p>Authorization in progress</p>}
    {state && <p>Will redirect you to {state.from}</p>}
    {error && <p className="error">Error: {error.message}</p>}
  </div>
);
const ComponentProp = (props) => (
  <AuthorizationCodeCallback {...props} component={View} />
);
```

#### `location` and `querystring`

--> see [`react-oauth-flow` docs](https://github.com/adambrgmn/react-oauth-flow#location-and-querystring)

#### `tokenFetchArgs`

--> see [`react-oauth-flow` docs](https://github.com/adambrgmn/react-oauth-flow#tokenfetchargs)

#### `tokenFn`

--> see [`react-oauth-flow` docs](https://github.com/adambrgmn/react-oauth-flow#tokenfn)

## Acknowledgements

- [client-oauth2] for an excellent oauth2 base client implementation
- [react-oauth2-auth-code-flow] for inspriation how to support OAuth2's Authorization Code Flow with components

[client-oauth2]: https://github.com/mulesoft/js-client-oauth2
[react-oauth2-auth-code-flow]: https://github.com/adambrgmn/react-oauth2-auth-code-flow
[auth code grant]: https://tools.ietf.org/html/rfc6749#section-4.1
[oauth2-pkce]: https://tools.ietf.org/html/rfc7636
