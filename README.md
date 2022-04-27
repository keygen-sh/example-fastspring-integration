# Example Keygen + FastSpring integration
The following web app is written in Node.js and shows how to integrate
[Keygen](https://keygen.sh) and [FastSpring](https://fastspring.com) together
using a Popup Storefront embed.

> **This example application may not be 100% production-ready**, but it should
> get you 90% of the way there. You may need to add additional logging,
> error handling, validation, features, etc.

🚨 Don't want to host your own webhook server? Check out [our Zapier integration](https://keygen.sh/integrate/zapier/).

## Running the app locally

First up, configure a few environment variables:
```bash
# Your FastSpring API credentials (available under Integrations->API Credentials)
export FASTSPRING_API_USERNAME="YOUR_FASTSPRING_API_USERNAME"
export FASTSPRING_API_PASSWORD="YOUR_FASTSPRING_API_PASSWORD"

# Keygen product token (don't share this!)
export KEYGEN_PRODUCT_TOKEN="YOUR_KEYGEN_PRODUCT_TOKEN"

# Your Keygen account ID
export KEYGEN_ACCOUNT_ID="YOUR_KEYGEN_ACCOUNT_ID"

# The Keygen policy to use when creating licenses for new customers
# after they successfully purchase your product
export KEYGEN_POLICY_ID="YOUR_KEYGEN_POLICY_ID"
```

You can either run each line above within your terminal session before
starting the app, or you can add the above contents to your `~/.bashrc`
file and then run `source ~/.bashrc` after saving the file.

Next, install dependencies with [`yarn`](https://yarnpkg.comg):
```
yarn
```

Then start the app:
```
yarn start
```

## Testing the integration locally

For local development, create an [`ngrok`](https://ngrok.com) tunnel:
```
ngrok http 8080
```

## Creating a FastSpring Popup Storefront

In order to utilize this integration, you'll need to create a FastSpring Popup
Storefront. Then you'll need to edit the `/views/index.ejs` file and update the
FastSpring embed code with your own embed code provided by FastSpring.

**Be sure to add `data-popup-closed="onFSPopupClosed"` attribute to your embed
script tag or else your integration will not work.** You will also need to update
the `data-fsc-item-path-value` attribute for the "Buy Now" button.

## Testing the integration

Visit the following url: http://localhost:8080 and fill out the purchase form.

## Questions?

Reach out at [support@keygen.sh](mailto:support@keygen.sh) if you have any
questions or concerns!
