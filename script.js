// L'Oréal Routine Builder - Main JavaScript File
// This file contains all the functionality for the beauty advisor app

// Sample product data (in a real app, this would come from a database or API)
const productsData = [
  {
    id: 1,
    name: "Revitalift Anti-Wrinkle Cream",
    category: "moisturizer",
    description:
      "Advanced anti-aging moisturizer with Pro-Retinol to reduce wrinkles and firm skin.",
    image: "https://via.placeholder.com/80x80/ff003b/white?text=RAC",
    price: "$24.99",
  },
  {
    id: 2,
    name: "Pure Clay Detox Mask",
    category: "cleanser",
    description:
      "Deep-cleansing clay mask with charcoal to purify pores and remove impurities.",
    image: "https://via.placeholder.com/80x80/ff003b/white?text=PCM",
    price: "$12.99",
  },
  {
    id: 3,
    name: "Elvive Total Repair Shampoo",
    category: "haircare",
    description:
      "Repairing shampoo with protein to strengthen damaged hair and restore shine.",
    image: "https://via.placeholder.com/80x80/ff003b/white?text=ETS",
    price: "$6.99",
  },
  {
    id: 4,
    name: "Rouge Signature Lipstick",
    category: "makeup",
    description:
      "Lightweight liquid lipstick with intense color and all-day comfort.",
    image: "https://via.placeholder.com/80x80/ff003b/white?text=RSL",
    price: "$15.99",
  },
  {
    id: 5,
    name: "Excellence Hair Color",
    category: "hair color",
    description:
      "Triple-care formula hair color that covers grays while protecting hair.",
    image: "https://via.placeholder.com/80x80/ff003b/white?text=EHC",
    price: "$9.99",
  },
];

// Global variables to store app state
let selectedProducts = [];
let conversationHistory = [];

// DOM elements
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedList = document.getElementById("selectedList");
const generateButton = document.getElementById("generateRoutine");
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 L'Oréal Routine Builder initialized");

  // Load saved products from localStorage
  loadSelectedProducts();

  // Display all products
  displayProducts(productsData);

  // Update the selected products list
  updateSelectedProductsList();

  // Event listeners
  categoryFilter.addEventListener("change", filterByCategory);
  generateButton.addEventListener("click", handleGenerateRoutine);
  chatForm.addEventListener("submit", handleChatSubmit);

  // Add search functionality
  addSearchBar();

  // Show welcome message in chat
  displayChatMessage(
    "assistant",
    "Welcome to your L'Oréal Beauty Advisor! 🌟\n\nSelect products above and click 'Generate Routine' or ask me any beauty questions!"
  );
});

/* Function to display products on the page */
function displayProducts(products) {
  console.log(`📦 Showing ${products.length} products`);

  // Clear any existing products
  productsContainer.innerHTML = "";

  // Create a card for each product
  products.forEach((product) => {
    // Create the main product card element
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.setAttribute("data-product-id", product.id);

    // Check if this product is already selected
    const isSelected = selectedProducts.some((p) => p.id === product.id);
    if (isSelected) {
      productCard.classList.add("selected");
    }

    // Create the HTML content for the card
    productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">${product.price}</p>
            <div class="product-description" style="display: none;">
                <p>${product.description}</p>
            </div>
            <button class="toggle-description" onclick="toggleDescription(${product.id})">
                Show Details
            </button>
        `;

    // Add click event to select/unselect product
    productCard.addEventListener("click", function (event) {
      // Don't select if user clicked the details button
      if (!event.target.classList.contains("toggle-description")) {
        toggleProductSelection(product);
      }
    });

    // Add the card to the products container
    productsContainer.appendChild(productCard);
  });
}

/* Function to select or unselect a product */
function toggleProductSelection(product) {
  console.log(`🎯 Toggling selection for: ${product.name}`);

  // Check if product is already in selected list
  const existingIndex = selectedProducts.findIndex((p) => p.id === product.id);
  const productCard = document.querySelector(
    `[data-product-id="${product.id}"]`
  );

  if (existingIndex >= 0) {
    // Product is selected, so remove it
    selectedProducts.splice(existingIndex, 1);
    productCard.classList.remove("selected");
    console.log("➖ Removed from selection");
  } else {
    // Product is not selected, so add it
    selectedProducts.push(product);
    productCard.classList.add("selected");
    console.log("➕ Added to selection");
  }

  // Update the display and save to browser storage
  updateSelectedProductsList();
  saveSelectedProducts();
}

/* Function to update the selected products list */
function updateSelectedProductsList() {
  console.log(`📝 Updating selected list: ${selectedProducts.length} products`);

  // Clear the current list
  selectedList.innerHTML = "";

  // Add each selected product to the list
  selectedProducts.forEach((product) => {
    const selectedItem = document.createElement("div");
    selectedItem.className = "selected-item";
    selectedItem.innerHTML = `
            ${product.name}
            <button onclick="removeProduct(${product.id})" title="Remove product">×</button>
        `;
    selectedList.appendChild(selectedItem);
  });

  // Enable or disable the generate button based on selection
  generateButton.disabled = selectedProducts.length === 0;
}

/* Function to remove a product from selection */
function removeProduct(productId) {
  console.log(`🗑️ Removing product with ID: ${productId}`);

  // Remove from selected products array
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);

  // Remove visual selection from product card
  const productCard = document.querySelector(
    `[data-product-id="${productId}"]`
  );
  if (productCard) {
    productCard.classList.remove("selected");
  }

  // Update display and save
  updateSelectedProductsList();
  saveSelectedProducts();
}

/* Function to filter products by category */
function filterByCategory() {
  const category = categoryFilter.value;
  const filteredProducts = category
    ? productsData.filter((product) => product.category === category)
    : productsData;

  displayProducts(filteredProducts);
}

/* Function to show/hide product description */
function toggleDescription(productId) {
  console.log(`📖 Toggling description for product ID: ${productId}`);

  const productCard = document.querySelector(
    `[data-product-id="${productId}"]`
  );
  const description = productCard.querySelector(".product-description");
  const button = productCard.querySelector(".toggle-description");

  if (description.style.display === "none") {
    description.style.display = "block";
    button.textContent = "Hide Details";
  } else {
    description.style.display = "none";
    button.textContent = "Show Details";
  }
}

/* Function to generate routine */
async function handleGenerateRoutine() {
  console.log(`✨ Generating routine for ${selectedProducts.length} products`);

  // Check if user has selected any products
  if (selectedProducts.length === 0) {
    displayChatMessage(
      "assistant",
      "Please select some products first to generate a routine! ✨"
    );
    return;
  }

  // Check if API key is set up
  if (
    !window.OPENAI_API_KEY ||
    window.OPENAI_API_KEY === "your-openai-api-key-here"
  ) {
    displayChatMessage(
      "assistant",
      "❌ OpenAI API key not found!\n\nPlease:\n1. Open secrets.js file\n2. Replace 'your-openai-api-key-here' with your actual API key\n3. Save and refresh the page\n\nGet your key from: https://platform.openai.com/api-keys"
    );
    return;
  }

  // Show user's request in chat
  const productNames = selectedProducts.map((p) => p.name).join(", ");
  displayChatMessage("user", `Generate routine for: ${productNames}`);

  // Show loading message
  displayChatMessage("assistant", "Creating your personalized routine... ✨");

  try {
    // Create detailed prompt for OpenAI
    const productDetails = selectedProducts
      .map((p) => `${p.name} (${p.category}): ${p.description}`)
      .join("\n\n");

    const prompt = `Create a detailed beauty routine using these L'Oréal products:\n\n${productDetails}\n\nPlease provide:\n1. Step-by-step morning routine\n2. Step-by-step evening routine\n3. How to use each product effectively\n4. Tips for best results\n5. Application order and timing`;

    // Call OpenAI API
    const response = await callOpenAI(prompt);

    // Remove loading message and show result
    removeLastMessage();
    displayChatMessage("assistant", response);

    console.log("✅ Routine generated successfully");
  } catch (error) {
    console.error("❌ Error generating routine:", error);
    removeLastMessage();
    displayChatMessage(
      "assistant",
      `❌ Sorry, there was an error generating your routine.\n\nError: ${error.message}\n\nPlease check:\n• Your internet connection\n• Your API key is correct\n• You have credits in your OpenAI account`
    );
  }
}

/* Function to handle chat form submission */
async function handleChatSubmit(event) {
  event.preventDefault(); // Prevent form from refreshing page

  const userMessage = chatInput.value.trim();
  if (!userMessage) return; // Don't send empty messages

  console.log(`💬 User message: ${userMessage}`);

  // Display user's message
  displayChatMessage("user", userMessage);

  // Clear input field
  chatInput.value = "";

  // Check if API key is set up
  if (
    !window.OPENAI_API_KEY ||
    window.OPENAI_API_KEY === "your-openai-api-key-here"
  ) {
    displayChatMessage(
      "assistant",
      "❌ API key not set up. Please check secrets.js file."
    );
    return;
  }

  // Show loading message
  displayChatMessage("assistant", "Thinking... 💭");

  try {
    // Get AI response
    const response = await callOpenAI(userMessage);

    // Remove loading message and show response
    removeLastMessage();
    displayChatMessage("assistant", response);

    console.log("✅ Chat response received");
  } catch (error) {
    console.error("❌ Chat error:", error);
    removeLastMessage();
    displayChatMessage(
      "assistant",
      `❌ Sorry, I had trouble processing your message.\n\nError: ${error.message}`
    );
  }
}

/* Function to call OpenAI API */
async function callOpenAI(userMessage) {
  console.log("🤖 Calling OpenAI API...");

  // Prepare messages array for the API
  // This includes system instructions and conversation history
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful L'Oréal beauty advisor. Provide detailed, practical beauty advice and create step-by-step routines. Be friendly and professional. Focus on skincare, haircare, makeup, and beauty routines.",
    },
    // Add recent conversation history for context
    ...conversationHistory.slice(-10), // Keep last 10 messages
    {
      role: "user",
      content: userMessage,
    },
  ];

  // Make the API request
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o", // Use gpt-4o model as specified
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  // Check if request was successful
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  // Parse the response
  const data = await response.json();

  // Check if response has expected format
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenAI");
  }

  console.log("✅ OpenAI API response received");
  return data.choices[0].message.content;
}

/* Function to display messages in chat window */
function displayChatMessage(sender, message) {
  console.log(`💬 Adding message from: ${sender}`);

  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${sender}`;

  // Format message (replace \n with <br> for line breaks)
  const formattedMessage = message.replace(/\n/g, "<br>");

  // Set message content
  messageDiv.innerHTML = `
        <strong>${sender === "user" ? "You" : "L'Oréal Advisor"}:</strong>
        <div class="message-content">${formattedMessage}</div>
    `;

  // Add to chat window
  chatWindow.appendChild(messageDiv);

  // Scroll to bottom to show latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Add to conversation history for context
  conversationHistory.push({
    role: sender === "user" ? "user" : "assistant",
    content: message,
  });

  // Keep only recent messages to avoid token limits
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }
}

/* Function to remove last message (for loading messages) */
function removeLastMessage() {
  const messages = chatWindow.querySelectorAll(".chat-message");
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    const text = lastMessage.textContent;
    if (
      text.includes("Creating your personalized routine...") ||
      text.includes("Thinking...")
    ) {
      lastMessage.remove();
    }
  }
}

/* Function to save selected products to browser storage */
function saveSelectedProducts() {
  try {
    localStorage.setItem(
      "lorealSelectedProducts",
      JSON.stringify(selectedProducts)
    );
    console.log("💾 Products saved to browser storage");
  } catch (error) {
    console.error("❌ Error saving products:", error);
  }
}

/* Function to load selected products from browser storage */
function loadSelectedProducts() {
  try {
    const saved = localStorage.getItem("lorealSelectedProducts");
    if (saved) {
      selectedProducts = JSON.parse(saved);
      console.log(`📂 Loaded ${selectedProducts.length} saved products`);
    }
  } catch (error) {
    console.error("❌ Error loading saved products:", error);
    selectedProducts = [];
  }
}

/* Function to add search functionality */
function addSearchBar() {
  // Create search input element
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search products...";
  searchInput.id = "productSearch";

  // Add to search bar (before category filter)
  const searchBar = document.querySelector(".search-bar");
  searchBar.insertBefore(searchInput, categoryFilter);

  // Add search functionality
  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const categoryValue = categoryFilter.value;

    let filtered = productsData;

    // Apply category filter first if selected
    if (categoryValue) {
      filtered = filtered.filter(
        (product) => product.category === categoryValue
      );
    }

    // Apply search filter if there's a search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Display filtered products
    displayProducts(filtered);
  });

  console.log("🔍 Search functionality added");
}

// Make functions available globally for onclick handlers in HTML
window.removeProduct = removeProduct;
window.toggleDescription = toggleDescription;

console.log("🎉 Script loaded successfully!");
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Display filtered products
    displayProducts(filtered);
  });

  console.log("🔍 Search functionality added");
}

// Make functions available globally for onclick handlers in HTML
window.removeProduct = removeProduct;
window.toggleDescription = toggleDescription;

console.log("🎉 Script loaded successfully!");
