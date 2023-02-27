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
  Select,
  SkeletonImage,
  SkeletonText,
  Stepper,
  View
} from "@shopify/checkout-ui-extensions";

const PRODUCT_VARIANTS_DATA = [
  {
    id: "gid://shopify/ProductVariant/40704560496755",
    img: "https://cdn.shopify.com/s/files/1/1805/8667/products/large-item-disposal-service-disposal-1_720x.jpg?v=1657013689",
    title: "Large Item Disposal",
    description:
      "Sofa, Bedframe, Mattress, Dining Table, Study Desk, 4-6 Chairs, Tv Console, Sideboard, Shelves & Cabinet",
    price: 50.0,
  },
  {
    id: "gid://shopify/ProductVariant/40704561774707",
    img: "https://cdn.shopify.com/s/files/1/1805/8667/products/medium-item-disposal-service-disposal-1_720x.jpg?v=1657014415",
    title: "Medium Item Disposal",
    description:
      "Dining Chair, Bench, Stool/Barstool, Bean Bag, Lounge/Arm Chair, Office Chair, Coffee Table, Side Table, Bedside Table",
    price: 20.0,
  },
];
const PRODUCT_STAIRCASE_DATA = [
  {
    id: "gid://shopify/ProductVariant/40671397412979",
    img: "https://via.placeholder.com/100/F1F1F1?text=S1",
    title: "Non-Wardrobe Item",
    price: 10.0,
  },
  {
    id: "gid://shopify/ProductVariant/40671397281907",
    img: "https://via.placeholder.com/100/F1F1F1?text=S1",
    title: "Wardrobe Item",
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
    let disposalItemValue= "";
    let furnitureDisposal= false;
    let stairValue = "";
    let staircaseFee = false;
    let staircaseFloor = 0;
    let wardrobeItems = 0;
    let disposalLQty = 0;
    let disposalMQty = 0;
    let nonwardrobeItems = 0;
    let electronicItems = 0;
    let totalStaircaseFee = 0;
    let itemDesc = false;
    let itemMediumDesc = false;
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
    const itemDescription = root.createText("");
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
    const itemMediumDescription = root.createText("");
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
    const wardrobeStaircase = { id: "" };
    const staircasePrice = root.createText("");
    const wardrobePrice = root.createText("");
    const nonwardrobePrice = root.createText("");
    const electronicPrice = root.createText("");

    // Defines the "Add" Button component used in the app
    const addButtonComponent = root.createComponent(
      BlockStack,
      { inlineSize: "fill", padding: "none" },
      [
        root.createComponent(Stepper, {
          label: "Quantity",
          value: 0,
          onChange: (value) => {
            disposalLQty = value;
            renderApp();
          },
        }),
        root.createComponent(
          Button,
          {
            kind: "secondary",
            loading: false,
            inlineSize: "fill",
            onPress: async () => {
              addButtonComponent.updateProps({ loading: true });
              // Apply the cart lines change
              const result = await applyCartLinesChange({
                type: "addCartLine", 
                merchandiseId: merchandise.id,
                quantity: disposalLQty,
              });

              addButtonComponent.updateProps({ loading: false });

              if (result.type === "error") {
                // An error occurred adding the cart line
                // Verify that you're using a valid product variant ID
                // For example, 'gid://shopify/ProductVariant/123'
                // console.error(result.message);
                const errorComponent = root.createComponent(
                  Banner,
                  { status: "critical" },
                  ["There was an issue adding this product. Please try again."]
                );
                // Render an error Banner as a child of the top-level app component for three seconds, then remove it
                const topLevelComponent = root.children[0];
                disposalComponent.appendChild(errorComponent);
                setTimeout(
                  () => disposalComponent.removeChild(errorComponent),
                  5000
                );
              } else if (result.type === "success") {
                console.error(result.message);
                const successComponent = root.createComponent(
                  Banner,
                  { status: "success" },
                  ["Successfully added item to cart!"]
                );
                // Render an error Banner as a child of the top-level app component for three seconds, then remove it\
                disposalComponent.appendChild(successComponent);
                setTimeout(
                  () => disposalComponent.removeChild(successComponent),
                  5000
                );
              }
            },
          },
          ["Add"]
        )
    ]);
    const addButtonComponentMediumDisposal = root.createComponent(
      BlockStack,
      { inlineSize: "fill", padding: "none" },
      [
        root.createComponent(Stepper, {
          label: "Quantity",
          value: 0,
          onChange: (value) => {
            disposalMQty = value;
            renderApp();
          },
        }),
        root.createComponent(
          Button,
          {
            kind: "secondary",
            loading: false,
            inlineSize: "fill",
            onPress: async () => {
              // addButtonComponentMediumDisposal.updateProps({ loading: true });

              // Apply the cart lines change
              const result = await applyCartLinesChange({
                type: "addCartLine",
                merchandiseId: merchandiseMD.id,
                quantity: disposalMQty,
              });

              // addButtonComponentMediumDisposal.updateProps({ loading: false });

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
                disposalComponent.appendChild(errorComponent);
                setTimeout(
                  () => disposalComponent.removeChild(errorComponent),
                  5000
                );
              } else if (result.type === "success") {
                console.error(result.message);
                const successComponent = root.createComponent(
                  Banner,
                  { status: "success" },
                  ["Successfully added item to cart!"]
                );
                disposalComponent.appendChild(successComponent);
                setTimeout(
                  () => disposalComponent.removeChild(successComponent),
                  5000
                );
              }
            },
          },
          ["Add"]
        ),
      ]
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
            quantity: nonwardrobeItems * staircaseFloor,
          });

          applyCartLinesChange({
            type: "addCartLine",
            merchandiseId: wardrobeStaircase.id,
            quantity: wardrobeItems * staircaseFloor,
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
          }
          if (result.type === "success") {
            // An error occurred adding the cart line
            // Verify that you're using a valid product variant ID
            // For example, 'gid://shopify/ProductVariant/123'
            console.error(result.message);
            const successComponent = root.createComponent(
              Banner,
              { status: "success" },
              ["Additional staircase fee successfully added to cart!"]
            );
            // Render an error Banner as a child of the top-level app component for three seconds, then remove it
            const topLevelComponent = root.children[0];
            topLevelComponent.appendChild(successComponent);
            setTimeout(
              () => topLevelComponent.removeChild(successComponent),
              3000
            );
          }
        },
      },
      ["Add"]
    );
    const selectDisposal = root.createComponent(Select, {
      label: "Disposal Item Size",
      value: disposalItemValue,
      options: [
        {
          value: "1",
          label: "Large Item",
        },
        {
          value: "2",
          label: "Medium Item",
        },
      ],
      onChange: (value) => {
        disposalItemValue = value;
        if (value === "1") {
          disposalChoice.appendChild(addDisposal);
          // disposalChoice.removeChild(addDisposalMedium);
        } else if (value === "2") {
          disposalChoice.appendChild(addDisposalMedium);
          // disposalChoice.removeChild(addDisposal);
        }
      },
    });
    const disposalComponent = root.createComponent(BlockStack, { spacing: "loose" }, [
    // Create the Additional Delivery Options component
        root.createComponent(BlockStack, {}, [
          "Do you need furniture disposal?",
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
                  disposalComponent.removeChild(disposalChoice); 
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
    const itemText = root.createComponent(BlockStack, { spacing: "none" }, [
      root.createComponent(Text, { size: "medium", emphasis: "strong" }, [
        titleMarkup,
      ]),
      root.createComponent(Text, { appearance: "subdued" }, [priceMarkup]),
      root.createComponent(Button, {
        kind: 'plain',
        inlineAlignment: 'start',
        appearance: 'monochrome',
        onPress: () => showDesc()
      }, "Description")
    ])
    const addDisposal = root.createComponent(
      BlockStack,
      {
        spacing: "base",
        maxInlineSize: 200,
      },
      [
        root.createComponent(View, { inlineSize: "fill", padding: "none" }, [
          imageComponent,
          itemText,
        ]),
        root.createComponent(View, { inlineSize: "fill", padding: "none" }, [
          addButtonComponent,
        ]),
      ]
    );
    const itemMediumText = root.createComponent(
      BlockStack,
      {
        spacing: "none"
      },
      [
        root.createComponent(Text, { size: "medium", emphasis: "strong" }, [
          titleMediumMarkup,
        ]),
        root.createComponent(Text, { appearance: "subdued" }, [
          priceMediumMarkup,
        ]),
        root.createComponent(
          Button,
          {
            kind: "plain",
            inlineAlignment: "start",
            appearance: "monochrome",
            onPress: () => showMediumDesc()
          },
          "Description"
        ),
      ]
    );
    function largeDis() {
      {
        if (disposalItemValue === "large-disposal") {
          disposalValue = true;
          if (disposalStack.children[0]) {
            disposalStack.removeChild(disposalStack.children[0]);
          }
          disposalStack.appendChild(addDisposal);
        } else if (disposalItemValue === "medium-disposal") {
          if (disposalStack.children[0]) {
            disposalStack.removeChild(disposalStack.children[0]);
          }
          disposalStack.appendChild(addDisposalMedium);
        }
      }
    };
    function showDesc() {
      {
        itemDesc = !itemDesc;
        const itemDescBlock = root.createComponent(Text, { size: "small", padding: 'base' }, [itemDescription])
        if (itemDesc) {
          itemText.appendChild(itemDescBlock);
        } else {
          itemText.removeChild(itemDescBlock);
        }
      }
    };

    function showMediumDesc() {
      {
        itemMediumDesc = !itemMediumDesc;
        const mediumDescBlock = root.createComponent(Text, { size: "small", padding: 'base' }, [itemDescription])
        if (itemMediumDesc) {
          itemMediumText.appendChild(mediumDescBlock);
        } else {
          itemMediumText.removeChild(mediumDescBlock);
        }
      }
    };
    const addDisposalMedium = root.createComponent(
      BlockStack,
      {
        spacing: "base",
        maxInlineSize: 200,
      },
      [
        root.createComponent(View, { inlineSize: "fill", padding: "none" }, [
          imageMediumComponent,
          itemMediumText,
        ]),
        root.createComponent(View, { inlineSize: "fill", padding: "none" }, [
          addButtonComponentMediumDisposal,
        ]),
      ]
    );
    const disposalStack = root.createComponent(BlockStack, undefined, [])
    const disposalChoice = root.createComponent(BlockStack, undefined, [
      root.createComponent(
        ChoiceList,
        {
          name: "disposal-choice",
          value: disposalItemValue,
          onChange: (value) => {
            disposalItemValue = value;
            largeDis();
            renderApp();
          },
        },
        [
          root.createComponent(BlockStack, undefined, [
            "What size are your items?",
            root.createComponent(InlineStack, undefined, [
            root.createComponent(Choice, { id: "large-disposal" }, "Large Item"),
            root.createComponent(Choice, { id: "medium-disposal" }, "Medium Item"),
            ])]),
          disposalStack
        ]
      ),
      // selectDisposal
    ]);
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
    const wardrobeInput = root.createComponent(InlineLayout, {columns: ['30%', '30%']}, [
      root.createComponent(
        TextBlock,
        undefined,
        `Wardrobe Items:`
      ),
      root.createComponent(Stepper, {
        label: 'Quantity',
        value: 0,
        onChange: (value) => {
          wardrobeItems = value
          renderApp();
        }
      })
    ]);
    const nonwardrobeInput = root.createComponent(InlineLayout, {columns: ['30%', '30%']}, [
      root.createComponent(
        TextBlock,
        undefined,
        `Non-Wardrobe Items:`
      ),
      root.createComponent(Stepper, {
        label: 'Quantity',
        value: 0,
        onChange: (value) => {
          nonwardrobeItems = value
          renderApp();
        }
      })
    ]);
    const electronicsInput = root.createComponent(InlineLayout, {columns: ['30%', '30%']}, [
      root.createComponent(
        TextBlock,
        undefined,
        `Electronic Items:`
      ),
      root.createComponent(Stepper, {
        label: 'Quantity',
        value: 0,
        onChange: (value) => {
          electronicItems = value
          renderApp();
        }
      })
    ]);
    const stepperFloor = root.createComponent(InlineLayout, {columns: ['30%', '30%']}, [
      root.createComponent(TextBlock, undefined, `Amount of Floors:`),
      root.createComponent(Stepper, {
        label: "Floors",
        value: 0,
        onChange: (value) => {
          staircaseFloor = value
          renderApp();
        }
      }),
    ]);
    const floorDescription = root.createComponent(BlockStack, undefined, [
      root.createComponent(BlockStack, undefined, [
        root.createComponent(InlineStack, undefined, [
          root.createComponent(Text, {}, "Wardrobe items charge:"),
          root.createComponent(Text, {}, [wardrobePrice]),
        ]),
        root.createComponent(InlineStack, undefined, [
          root.createComponent(Text, {}, "Non-Wardrobe items charge:"),
          root.createComponent(Text, {}, [nonwardrobePrice]),
        ]),
      ]),
      root.createComponent(InlineStack, undefined, [
        root.createComponent(Text, { appearance: "accent" }, "Total staircase charge:"),
        root.createComponent(Text, { appearance: "accent" }, [staircasePrice]),
      ]),
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
      [wardrobeInput, nonwardrobeInput, stepperFloor, floorDescription, addButtonComponentStair]
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
      const { id, img, title, description, price } = productsOnOffer[0] || products[0];
      // Localize the currency for international merchants and customers
      const renderPrice = i18n.formatCurrency(products[0].price);
      const renderPriceMedium = i18n.formatCurrency(products[1].price);
      const renderPriceStaircase = i18n.formatCurrency(productsStaircase[0].price);

      // Bind data to the components
      imageComponent.updateProps({ source: products[0].img });
      titleMarkup.updateText(products[0].title);
      itemDescription.updateText(products[0].description);
      addButtonComponent.updateProps({
        accessibilityLabel: `Add ${products[0].title} to cart`,
      });
      priceMarkup.updateText(renderPrice);
      merchandise.id = products[0].id;

      imageMediumComponent.updateProps({ source: products[1].img });
      titleMediumMarkup.updateText(products[1].title);
      itemMediumDescription.updateText(products[1].description);
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
      wardrobeStaircase.id = productsStaircase[1].id;
      
      let wardrobeCharge = wardrobeItems * staircaseFloor * productsStaircase[1].price;
      let wardrobeFee = wardrobeItems * staircaseFloor;
      const renderWardrobeCharge = i18n.formatCurrency(wardrobeCharge);
      let nonwardrobeCharge = nonwardrobeItems * staircaseFloor * productsStaircase[0].price;
      let nonwardrobeFee = nonwardrobeItems * staircaseFloor;
      const renderNonwardrobeCharge = i18n.formatCurrency(nonwardrobeCharge);
      let electronicCharge = 2 * electronicItems * staircaseFloor * productsStaircase[0].price;
      let electronicFee = 2 * electronicItems * staircaseFloor;
      const renderElectronicCharge = i18n.formatCurrency(electronicCharge);
      let staircaseCharge = wardrobeCharge + nonwardrobeCharge;
      const renderStaircaseCharge = i18n.formatCurrency(staircaseCharge);
      wardrobePrice.updateText(renderWardrobeCharge);
      nonwardrobePrice.updateText(renderNonwardrobeCharge);
      staircasePrice.updateText(renderStaircaseCharge);

      totalStaircaseFee = wardrobeFee + nonwardrobeFee
      
      if (furnitureDisposal) {
        disposalComponent.appendChild(disposalChoice);
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
