 /* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const rtlToggle = document.getElementById("rtlToggle");
const descModalContainer = document.getElementById("descModalContainer");
const clearAllBtn = document.getElementById("clearAllBtn");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

// Store selected product IDs (persisted in localStorage)
let selectedProductIds = [];

// Store chat history for conversation context
let chatHistory = [];

/* RTL toggle support */
rtlToggle.addEventListener("click", function () {
  // Toggle RTL class on body
  document.body.classList.toggle("rtl");
  // Save preference in localStorage
  if (document.body.classList.contains("rtl")) {
    localStorage.setItem("rtlMode", "true");
  } else {
    localStorage.removeItem("rtlMode");
  }
});

// On page load, restore RTL mode if set
if (localStorage.getItem("rtlMode") === "true") {
  document.body.classList.add("rtl");
}

// Helper: Save/load selected products from localStorage
function saveSelectedProducts() {
  // Always save as strings
  localStorage.setItem(
    "selectedProductIds",
    JSON.stringify(selectedProductIds.map(String))
  );
}
function loadSelectedProducts() {
  const saved = localStorage.getItem("selectedProductIds");
  if (saved) selectedProductIds = JSON.parse(saved).map(String);
}

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card${
      selectedProductIds.includes(String(product.id)) ? " selected" : ""
    }" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <button class="desc-btn" title="Show description"><i class="fa fa-info"></i></button>
      <div class="product-desc-overlay">
        <div>${product.description}</div>
        <button type="button" class="close-desc-btn">Close</button>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event to each card for selection and description
  document.querySelectorAll(".product-card").forEach((card) => {
    const id = card.getAttribute("data-id");
    // Card click toggles selection
    card.onclick = (e) => {
      // Prevent toggling when clicking description button or overlay
      if (
        e.target.classList.contains("desc-btn") ||
        e.target.classList.contains("close-desc-btn") ||
        e.target.closest(".product-desc-overlay")
      ) {
        return;
      }
      toggleProductSelection(id, products);
    };
    // Description button shows overlay
    card.querySelector(".desc-btn").onclick = (e) => {
      e.stopPropagation();
      card.classList.add("show-desc");
    };
    // Close button hides overlay
    card.querySelector(".close-desc-btn").onclick = (e) => {
      e.stopPropagation();
      card.classList.remove("show-desc");
    };
  });
}

// Render selected products in the container
function renderSelectedProducts(products) {
  selectedProductsList.innerHTML = "";
  if (selectedProductIds.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message" style="padding:18px;">No products selected.</div>`;
    clearAllBtn.style.display = "none";
    return;
  }
  clearAllBtn.style.display = "inline-block";
  selectedProductIds.forEach((id) => {
    // Always compare as strings
    const product = products.find((p) => String(p.id) === String(id));
    if (!product) return;
    const item = document.createElement("div");
    item.className = "selected-product-item";
    item.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <span style="flex:1;min-width:0;">${product.name}</span>
      <button class="remove-btn" title="Remove" aria-label="Remove">&times;</button>
    `;
    item.querySelector(".remove-btn").onclick = () => {
      toggleProductSelection(String(product.id), products);
    };
    selectedProductsList.appendChild(item);
  });
}

// Toggle product selection and update UI
function toggleProductSelection(productId, products) {
  // Always use string for productId
  const idStr = String(productId);
  const idx = selectedProductIds.indexOf(idStr);
  if (idx === -1) {
    selectedProductIds.push(idStr);
  } else {
    selectedProductIds.splice(idx, 1);
  }
  saveSelectedProducts();
  displayProducts(products); // re-render grid to update border
  renderSelectedProducts(products);
}

// Use your Cloudflare Worker endpoint for all chatbot questions

const WORKER_URL = "https://loreralchatbot.miguel-romero03.workers.dev/";

// Helper: auto-link URLs in text
function autoLink(text) {
  // Regex to match URLs (http/https)
  return text.replace(/(https?:\/\/[^\s]+)/g, function (url) {
    return `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
  });
}

// Add event listener for Generate Routine button
const generateRoutineBtn = document.getElementById("generateRoutine");
generateRoutineBtn.addEventListener("click", async function () {
  // Load all products
  const products = await loadProducts();
  // Get selected products as objects
  const selectedProducts = selectedProductIds
    .map((id) => products.find((p) => String(p.id) === String(id)))
    .filter(Boolean);

  // If no products selected, show a message in chat
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<div class="chat-message ai">Please select some products first!</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  // Build a simple message for the AI
  const productList = selectedProducts
    .map((p, i) => `${i + 1}. ${p.name} (${p.brand})`)
    .join("\n");
  const routinePrompt = `I have selected these products:\n${productList}\n\nPlease create a skincare or haircare routine using only these products. Explain the order and how to use each one. Be clear and beginner-friendly.`;

  // Add user's action to chat and chatHistory
  chatWindow.innerHTML += `<div class="chat-message user">Generate a routine for my selected products.</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
  chatHistory.push({ role: "user", content: routinePrompt });

  // Show loading message
  chatWindow.innerHTML += `<div class="chat-message ai">Thinking...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Send to Cloudflare Worker with full chatHistory
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: chatHistory,
        tools: ["browser"], // Request web context
      }),
    });
    const data = await response.json();

    // Remove the loading message
    const aiMsgs = chatWindow.querySelectorAll(".chat-message.ai");
    if (aiMsgs.length > 0) {
      aiMsgs[aiMsgs.length - 1].remove();
    }

    // Show the AI's response and add to chatHistory
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      let aiContent = autoLink(data.choices[0].message.content);
      // If there are tool_calls or citations, show them
      if (
        data.choices[0].message.tool_calls &&
        data.choices[0].message.tool_calls.length > 0
      ) {
        aiContent += '<div class="ai-citations"><strong>Sources:</strong><ul>';
        data.choices[0].message.tool_calls.forEach((tc) => {
          if (tc.function && tc.function.arguments) {
            try {
              const args = JSON.parse(tc.function.arguments);
              if (args.url) {
                aiContent += `<li><a href="${args.url}" target="_blank" rel="noopener">${args.url}</a></li>`;
              }
            } catch (e) {}
          }
        });
        aiContent += "</ul></div>";
      }
      chatWindow.innerHTML += `<div class="chat-message ai">${aiContent}</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
    } else {
      chatWindow.innerHTML += `<div class="chat-message ai">Sorry, I couldn't generate a routine. Please try again.</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  } catch (err) {
    // Remove the loading message
    const aiMsgs = chatWindow.querySelectorAll(".chat-message.ai");
    if (aiMsgs.length > 0) {
      aiMsgs[aiMsgs.length - 1].remove();
    }
    chatWindow.innerHTML += `<div class="chat-message ai">There was an error connecting to the AI. Please try again.</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});

// Helper: filter products by category and search
async function filterAndDisplayProducts() {
  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;
  const searchValue = productSearch.value.trim().toLowerCase();
  let filtered = products;
  if (selectedCategory) {
    filtered = filtered.filter(
      (product) => product.category === selectedCategory
    );
  }
  if (searchValue) {
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(searchValue) ||
        product.brand.toLowerCase().includes(searchValue)
    );
  }
  displayProducts(filtered);
  renderSelectedProducts(filtered);
}

// Listen for category changes
categoryFilter.addEventListener("change", filterAndDisplayProducts);

// Listen for product search input
const productSearch = document.getElementById("productSearch");
productSearch.addEventListener("input", filterAndDisplayProducts);

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's question
  const userMessage = document.getElementById("userInput").value.trim();
  if (!userMessage) return;

  // Show user's message in the chat window
  chatWindow.innerHTML += `<div class="chat-message user">${userMessage}</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
  chatHistory.push({ role: "user", content: userMessage });

  // Show loading message
  chatWindow.innerHTML += `<div class="chat-message ai">Thinking...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Send the full chatHistory to the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: chatHistory,
        tools: ["browser"], // Request web context
      }),
    });
    const data = await response.json();

    // Remove the loading message
    const aiMsgs = chatWindow.querySelectorAll(".chat-message.ai");
    if (aiMsgs.length > 0) {
      aiMsgs[aiMsgs.length - 1].remove();
    }

    // Show the AI's response and add to chatHistory
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      let aiContent = autoLink(data.choices[0].message.content);
      // If there are tool_calls or citations, show them
      if (
        data.choices[0].message.tool_calls &&
        data.choices[0].message.tool_calls.length > 0
      ) {
        aiContent += '<div class="ai-citations"><strong>Sources:</strong><ul>';
        data.choices[0].message.tool_calls.forEach((tc) => {
          if (tc.function && tc.function.arguments) {
            try {
              const args = JSON.parse(tc.function.arguments);
              if (args.url) {
                aiContent += `<li><a href="${args.url}" target="_blank" rel="noopener">${args.url}</a></li>`;
              }
            } catch (e) {}
          }
        });
        aiContent += "</ul></div>";
      }
      chatWindow.innerHTML += `<div class="chat-message ai">${aiContent}</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
    } else {
      chatWindow.innerHTML += `<div class="chat-message ai">Sorry, I couldn't answer that. Please try again.</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  } catch (err) {
    // Remove the loading message
    const aiMsgs = chatWindow.querySelectorAll(".chat-message.ai");
    if (aiMsgs.length > 0) {
      aiMsgs[aiMsgs.length - 1].remove();
    }
    chatWindow.innerHTML += `<div class="chat-message ai">There was an error connecting to the AI. Please try again.</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Clear the input
  document.getElementById("userInput").value = "";
});

// On page load, restore selected products and update UI if needed
window.onload = async function () {
  loadSelectedProducts(); // <-- Load from localStorage
  const products = await loadProducts();
  // Optionally, show all or wait for category selection
  renderSelectedProducts(products);

  // If a category is already selected, show products and keep selections
  if (categoryFilter.value) {
    const filteredProducts = products.filter(
      (product) => product.category === categoryFilter.value
    );
    displayProducts(filteredProducts);
    renderSelectedProducts(filteredProducts);
  }
};
