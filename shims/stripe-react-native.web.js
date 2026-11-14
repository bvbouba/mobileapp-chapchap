const React = require("react");

/**
 * Web stand-in for @stripe/stripe-react-native.
 * The native package imports codegenNativeCommands, which Metro cannot bundle for web.
 * Checkout still renders; card collection stays on iOS and Android.
 */
function StripeProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

module.exports = { StripeProvider };
