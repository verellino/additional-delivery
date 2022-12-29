import {
  extend,
  TextField,
  BlockStack,
  BlockLayout,
  ChoiceList,
  Choice,
  InlineStack,
  InlineLayout,
  Text,
  TextBlock,
  Divider,
  Image,
  Banner,
  Heading,
  Button,
  SkeletonImage,
  SkeletonText,
  Stepper
} from "@shopify/checkout-ui-extensions";

const PRODUCT_VARIANTS_DATA = [
  {
    id: "gid://shopify/ProductVariant/44234170269986",
    img: "https://via.placeholder.com/100/F1F1F1?text=L1",
    title: "Large Item Disposal",
    price: 50.0,
  },
  {
    id: "gid://shopify/ProductVariant/44234170302754",
    img: "https://via.placeholder.com/100/F1F1F1?text=M1",
    title: "Medium Item Disposal",
    price: 20.0,
  },
];
const PRODUCT_STAIRCASE_DATA = [
  {
    id: "gid://shopify/ProductVariant/44234532159778",
    img: "https://via.placeholder.com/100/F1F1F1?text=S1",
    title: "Staircase Charge",
    price: 10.0,
  },
  {
    id: "gid://shopify/ProductVariant/44234532192546",
    img: "https://via.placeholder.com/100/F1F1F1?text=S1",
    title: "Staircase Charge",
    price: 20.0,
  },
];

// Set up the entry point for the extension
extend(
  "Checkout::Dynamic::Render",
  (root, { lines, applyCartLinesChange, i18n, metafields }) => {
    // Set up the states
    let products = [];
    let productsStaircase = PRODUCT_STAIRCASE_DATA;
    let loading = true;
    let appRendered = false;
    let disposalValue= "";
    let furnitureDisposal= false;
    let stairValue = "";
    let staircaseFee = false;
    let staircaseFloor = 0;
    let state = {
      metafields: metafields.current,
      showDeliveryInstructions: false,
    };

    // On initial load, fetch the product variants
    // If you're making a network request, then replace the following code with the HTTP call
    // If you don't need to make a network request, then you can call `renderApp()`
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(PRODUCT_VARIANTS_DATA);
      }, 800);
    })
      .then((result) => {
        // Set the product variants
        products = result;
      })
      .catch((err) => console.error(err))
      .finally(() => {
        loading = false;
        // Call the `renderApp()` helper to filter, data-bind, and render the products on offer
        renderApp();
      });

    // Manually subscribe to changes to cart lines. This calls the `renderApp` helper function when the cart lines have changed
    lines.subscribe(() => renderApp());

    // Show a loading UI if you're waiting for product variant data
    // Use Skeleton components to keep placement from shifting when content loads
    const loadingState = root.createComponent(
      BlockStack,
      { spacing: "loose" },
      [
        root.createComponent(Divider),
        root.createComponent(Heading, { level: 2 }, ["Additional Delivery options"]),
        root.createComponent(BlockStack, { spacing: "loose" }, [
          root.createComponent(
            InlineLayout,
            {
              spacing: "base",
              columns: [64, "fill", "auto"],
              blockAlignment: "center",
            },
            [
              root.createComponent(SkeletonImage, { aspectRatio: 1 }),
              root.createComponent(BlockStack, { spacing: "none" }, [
                root.createComponent(SkeletonText, { inlineSize: "large" }),
                root.createComponent(SkeletonText, { inlineSize: "small" }),
              ]),
              root.createComponent(
                Button,
                { kind: "secondary", disabled: true },
                [root.createText("Add")]
              ),
            ]
          ),
        ]),
      ]
    );

    // Render the loading state
    if (loading) {
      root.appendChild(loadingState);
    }

    // Initialize the components to render for the product offer
    // You'll need to manually bind data to them, this happens within the `renderApp` helper
    const imageComponent = root.createComponent(Image, {
      border: "base",
      borderWidth: "base",
      borderRadius: "loose",
      aspectRatio: 1,
      source: "",
    });
    const titleMarkup = root.createText("");
    const priceMarkup = root.createText("");
    const merchandise = { id: "" };
    const imageMediumComponent = root.createComponent(Image, {
      border: "base",
      borderWidth: "base",
      borderRadius: "loose",
      aspectRatio: 1,
      source: "",
    });
    const titleMediumMarkup = root.createText("");
    const priceMediumMarkup = root.createText("");
    const merchandiseMD = { id: "" };
    const imageStaircaseComponent = root.createComponent(Image, {
      border: "base",
      borderWidth: "base",
      borderRadius: "loose",
      aspectRatio: 1,
      source: "",
    });
    const titleStaircaseMarkup = root.createText("");
    const priceStaircaseMarkup = root.createText("");
    const merchandiseStaircase = { id: "" };
    const staircasePrice = root.createText("");

    // Defines the "Add" Button component used in the app
    const addButtonComponent = root.createComponent(
      Button,
      {
        kind: "secondary",
        loading: false,
        onPress: async () => {
          addButtonComponent.updateProps({ loading: true });

          // Apply the cart lines change
          const result = await applyCartLinesChange({
            type: "addCartLine",
            merchandiseId: merchandise.id,
            quantity: 1,
          });

          addButtonComponent.updateProps({ loading: false });

          if (result.type === "error") {
            // An error occurred adding the cart line
            // Verify that you're using a valid product variant ID
            // For example, 'gid://shopify/ProductVariant/123'
            console.error(result.message);
            const errorComponent = root.createComponent(
              Banner,
              { status: "critical" },
              ["There was an issue adding this product. Please try again."]
            );
            // Render an error Banner as a child of the top-level app component for three seconds, then remove it
            const topLevelComponent = root.children[0];
            topLevelComponent.appendChild(errorComponent);
            setTimeout(
              () => topLevelComponent.removeChild(errorComponent),
              3000
            );
          }
        },
      },
      ["Add"]
    );
    const addButtonComponentMediumDisposal = root.createComponent(
      Button,
      {
        kind: "secondary",
        loading: false,
        onPress: async () => {
          addButtonComponentMediumDisposal.updateProps({ loading: true });

          // Apply the cart lines change
          const result = await applyCartLinesChange({
            type: "addCartLine",
            merchandiseId: merchandiseMD.id,
            quantity: 1,
          });

          addButtonComponentMediumDisposal.updateProps({ loading: false });

          if (result.type === "error") {
            // An error occurred adding the cart line
            // Verify that you're using a valid product variant ID
            // For example, 'gid://shopify/ProductVariant/123'
            console.error(result.message);
            const errorComponent = root.createComponent(
              Banner,
              { status: "critical" },
              ["There was an issue adding this product. Please try again."]
            );
            // Render an error Banner as a child of the top-level app component for three seconds, then remove it
            const topLevelComponent = root.children[0];
            topLevelComponent.appendChild(errorComponent);
            setTimeout(
              () => topLevelComponent.removeChild(errorComponent),
              3000
            );
          }
        },
      },
      ["Add"]
    );
    const addButtonComponentStair = root.createComponent(
      Button,
      {
        kind: "secondary",
        loading: false,
        onPress: async () => {
          addButtonComponentStair.updateProps({ loading: true });

          // Apply the cart lines change
          const result = await applyCartLinesChange({
            type: "addCartLine",
            merchandiseId: merchandiseStaircase.id,
            quantity: staircaseFloor,
          });

          addButtonComponentStair.updateProps({ loading: false });

          if (result.type === "error") {
            // An error occurred adding the cart line
            // Verify that you're using a valid product variant ID
            // For example, 'gid://shopify/ProductVariant/123'
            console.error(result.message);
            const errorComponent = root.createComponent(
              Banner,
              { status: "critical" },
              ["There was an issue adding this product. Please try again."]
            );
            // Render an error Banner as a child of the top-level app component for three seconds, then remove it
            const topLevelComponent = root.children[0];
            topLevelComponent.appendChild(errorComponent);
            setTimeout(
              () => topLevelComponent.removeChild(errorComponent),
              3000
            );
          }
        },
      },
      ["Add"]
    );

    const disposalComponent = root.createComponent(BlockStack, { spacing: "loose" }, [
    // Create the Additional Delivery Options component
        root.createComponent(BlockStack, {}, [
          "Do you need furiniture disposal?",
          root.createComponent(
            ChoiceList,
            {
              name: "disposal-choice",
              value: disposalValue,
              onChange: (value) => {
                disposalValue = value;
                if (value === "yes-disposal") {
                  furnitureDisposal = true;
                } else {
                  furnitureDisposal = false;
                  disposalComponent.removeChild(disposalBlock); 
                }
                renderApp();
              },
            },
            [
              root.createComponent(InlineStack, undefined, [
                root.createComponent(Choice, { id: "yes-disposal" }, "Yes"),
                root.createComponent(Choice, { id: "no-disposal" }, "No"),
              ]),
            ]
          ),
        ])
    ])
    const addDisposal = root.createComponent(
      BlockStack,
      {
        spacing: "base",
      },
      [
        imageComponent,
        root.createComponent(BlockStack, { spacing: "none" }, [
          root.createComponent(Text, { size: "medium", emphasis: "strong" }, [
            titleMarkup,
          ]),
          root.createComponent(Text, { appearance: "subdued" }, [priceMarkup]),
        ]),
        addButtonComponent,
      ]
    );
    const addDisposalMedium = root.createComponent(
      BlockStack,
      {
        spacing: "base",
      },
      [
        imageMediumComponent,
        root.createComponent(BlockStack, { spacing: "none" }, [
          root.createComponent(Text, { size: "medium", emphasis: "strong" }, [
            titleMediumMarkup,
          ]),
          root.createComponent(Text, { appearance: "subdued" }, [priceMediumMarkup]),
        ]),
        addButtonComponentMediumDisposal,
      ]
    );
    const disposalBlock = root.createComponent(
      InlineLayout,
      {
        spacing: "loose",
        columns: ["33%", "33%", "fill"],
      },
      [addDisposal, addDisposalMedium]
    );

    const staircaseComponent = root.createComponent(BlockStack,{ spacing: "loose" },[
        // Staircase Components
        root.createComponent(BlockStack, {}, [
          "Does your furniture needs to be carried up via staircase?",
          root.createComponent(
            ChoiceList,
            {
              name: "staircase-choice",
              value: stairValue,
              onChange: (value) => {
                stairValue = value;
                if (value === "yes-staircase") {
                  staircaseFee = true;
                } else {
                  staircaseFee = false;
                  staircaseComponent.removeChild(staircaseBlock);
                }
                renderApp();
              },
            },
            [
              root.createComponent(InlineStack, undefined, [
                root.createComponent(Choice, { id: "yes-staircase" }, "Yes"),
                root.createComponent(Choice, { id: "no-staircase" }, "No"),
              ]),
            ]
          ),
        ])
      ]
    );
    const stepperFloor = root.createComponent(Stepper, {
      label: "Floors",
      value: 0,
      onChange: (value) => {
        staircaseFloor = value
        renderApp();
      }
    });
    const floorDescription = root.createComponent(InlineStack, undefined, [
      root.createComponent(
        TextBlock,
        undefined,
        `Total cost for your staircase delivery:`
      ),
      root.createComponent(Text, { appearance: "accent" }, [staircasePrice]),
    ]);
    const addStaricase = root.createComponent(
      InlineLayout,
      {
        spacing: "base",
        // Use the `columns` property to set the width of the columns
        // Image: column should be 64px wide
        // BlockStack: column, which contains the title and price, should "fill" all available space
        // Button: column should "auto" size based on the intrinsic width of the elements
        columns: [64, "fill", "auto"],
        blockAlignment: "center",
      },
      [
        imageStaircaseComponent,
        root.createComponent(BlockStack, { spacing: "none" }, [
          root.createComponent(
            Text,
            { size: "medium", emphasis: "strong" },
            [titleStaircaseMarkup]
          ),
          root.createComponent(Text, { appearance: "subdued" }, [
            priceStaircaseMarkup,
          ]),
        ]),
        addButtonComponentStair,
      ]
    );
    const staircaseBlock = root.createComponent(
      BlockStack,
      { spacing: "loose" },
      [stepperFloor, floorDescription, addButtonComponentStair]
    );

    // Defines the main app responsible for rendering a product offer
    const app = root.createComponent(BlockStack, { spacing: "loose" }, [
      root.createComponent(Divider),
      root.createComponent(Heading, {}, "Additional delivery options"),
      root.createComponent(BlockStack, { spacing: "loose" }, [
        disposalComponent,
        staircaseComponent
      ]),
    ]);

    // This function will be called once the product variants are initially loaded or the cart lines have changed
    function renderApp() {
      if (loading) {
        // If still loading, then do nothing
        return;
      }

      if (!loading && products.length === 0) {
        // If loading is complete, but there are no product variants, then remove the loading state and don't render anything
        root.removeChild(loadingState);
        return;
      }

      // Filter out any product variants on offer that are already current cart lines
      const productsOnOffer = products.filter(
        (product) =>
          !lines.current.map((item) => item.merchandise.id).includes(product.id)
      );
      const productsOnOfferStaircase = productsStaircase.filter(
        (product) =>
          !lines.current.map((item) => item.merchandise.id).includes(product.id)
      );
      // Choose the first available product variant on offer or display the default fallback product
      const { id, img, title, price } = productsOnOffer[0] || products[0];
      // Localize the currency for international merchants and customers
      const renderPrice = i18n.formatCurrency(price);
      const renderPriceMedium = i18n.formatCurrency(products[1].price);
      const renderPriceStaircase = i18n.formatCurrency(productsStaircase[0].price);

      // Bind data to the components
      imageComponent.updateProps({ source: img });
      titleMarkup.updateText(title);
      addButtonComponent.updateProps({
        accessibilityLabel: `Add ${title} to cart`,
      });
      priceMarkup.updateText(renderPrice);
      merchandise.id = id;

      imageMediumComponent.updateProps({ source: products[1].img });
      titleMediumMarkup.updateText(products[1].title);
      addButtonComponentMediumDisposal.updateProps({
        accessibilityLabel: `Add ${products[1].title} to cart`,
      });
      priceMediumMarkup.updateText(renderPriceMedium);
      merchandiseMD.id = products[1].id;

      imageStaircaseComponent.updateProps({ source: productsStaircase[0].img });
      titleStaircaseMarkup.updateText(productsStaircase[0].title);
      addButtonComponentStair.updateProps({
        accessibilityLabel: `Add ${productsStaircase[0].title} to cart`,
      });
      priceStaircaseMarkup.updateText(renderPriceStaircase);
      merchandiseStaircase.id = productsStaircase[0].id;
      
      let staircaseCharge = staircaseFloor * productsStaircase[0].price;
      const renderStaircaseCharge = i18n.formatCurrency(staircaseCharge);
      staircasePrice.updateText(renderStaircaseCharge);
      
      if (furnitureDisposal) {
        disposalComponent.appendChild(disposalBlock);
      }
      if (staircaseFee) {
        staircaseComponent.appendChild(staircaseBlock);
      }

      // Prevent against unnecessary re-renders
      if (!appRendered) {
        // Remove the loading state
        root.removeChild(loadingState);
        // Render the product offer app with the product data
        root.appendChild(app);
        appRendered = true;
      }
    }
  }
);
