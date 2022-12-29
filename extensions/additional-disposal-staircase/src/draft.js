import {
  extend,
  TextField,
  BlockStack,
  BlockLayout,
  ChoiceList,
  Choice,
  InlineStack,
  Checkbox,
} from "@shopify/checkout-ui-extensions";

// Set the entry point for the extension
extend("Checkout::Dynamic::Render", (root, api) => {
  // Keep track of the UI state
  const state = {
    metafields: api.metafields.current,
    showDeliveryInstructions: false,
    disposalValue: "",
    furnitureDisposal: false,
    staircaseFee: false,
  };

  // Render the initial extension UI
  renderUI({ root, api, state });

  // Keep track if metafields change. If they do, then re-render.
  api.metafields.subscribe((newMetafields) => {
    state.metafields = newMetafields;
    renderUI({ root, api, state });
  });
});

function renderUI({ root, api, state }) {
  const { applyMetafieldChange } = api;

  // In case this is a re-render, then remove all previous children
  for (const child of root.children) {
    root.removeChild(child);
  }

  // Define the metafield namespace and key
  const metafieldNamespace = "yourAppNamespace";
  const metafieldKey = "deliveryInstructions";

  // Get a reference to the metafield
  const deliveryInstructions = state.metafields?.find(
    (field) =>
      field.namespace === metafieldNamespace && field.key === metafieldKey
  );

  // Create the Additional Delivery Options component
  const disposal = root.createComponent(BlockStack, {}, [
    "Do you need furiniture disposal?",
    root.createComponent(
      ChoiceList,
      {
        name: "disposal-choice",
        value: state.disposalValue,
        onChange: (value) => {
          state.disposalValue = value;
          if (value === "yes-disposal") {
            state.furnitureDisposal = true;
          } else {
            state.furnitureDisposal = false;
          }
          console.log(
            `onChange event with value: ${value}, ${state.furnitureDisposal}`
          );
          renderUI({ root, api, state });
        },
      },
      [
        root.createComponent(InlineStack, undefined, [
          root.createComponent(Choice, { id: "yes-disposal" }, "Yes"),
          root.createComponent(Choice, { id: "no-disposal" }, "No"),
        ]),
      ]
    ),
  ]);
  // If the Furniture disposal choice is true
  if (state.furnitureDisposal) {
    disposal.appendChild(
      root.createComponent(TextField, {
        multiline: 3,
        label: "Delivery instructions",
        onChange: (value) => {
          // Apply the change to the metafield
          applyMetafieldChange({
            type: "updateMetafield",
            namespace: metafieldNamespace,
            key: metafieldKey,
            valueType: "string",
            value,
          });
        },
        value: deliveryInstructions?.value,
      })
    );
  }

  const staircase = root.createComponent(BlockStack, {}, [
    "Does your furniture needs to be carried up via staircase?",
    root.createComponent(
      ChoiceList,
      {
        name: "staircase-choice",
        value: "no-staircase",
        onChange: (value) => {
          state.staircaseFee = !state.staircaseFee;
          console.log(`onChange event with value: ${value}`);
        },
      },
      [
        root.createComponent(InlineStack, undefined, [
          root.createComponent(Choice, { id: "yes-staircase" }, "Yes"),
          root.createComponent(Choice, { id: "no-staircase" }, "No"),
        ]),
      ]
    ),
  ]);

  // If the Checkbox component is selected, then create a TextField component
  if (state.staircaseFee) {
    staircase.appendChild(
      root.createComponent(TextField, {
        multiline: 3,
        label: "Delivery instructions",
        onChange: (value) => {
          // Apply the change to the metafield
          applyMetafieldChange({
            type: "updateMetafield",
            namespace: metafieldNamespace,
            key: metafieldKey,
            valueType: "string",
            value,
          });
        },
        value: deliveryInstructions?.value,
      })
    );
  }

  const layout = root.createComponent(BlockStack, undefined, [
    disposal,
    staircase,
  ]);
  // Render the extension components
  root.appendChild(disposal);
}
