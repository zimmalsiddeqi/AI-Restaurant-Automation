/* =========================================================
   SIDDEQI PIZZAHUT
   AI RESTAURANT CHAT
   Frontend ↔ n8n AI Agent
   ========================================================= */

/* =========================================================
   CONFIGURATION
   ========================================================= */

// DEVELOPMENT / TEST WEBHOOK
const N8N_WEBHOOK_URL =
    "https://shafqataliautomation.app.n8n.cloud/webhook/restaurant-ai";

// When your n8n workflow is activated and ready for production,
// change the URL to:
//
// const N8N_WEBHOOK_URL =
//     "https://shafqataliautomation.app.n8n.cloud/webhook/restaurant-ai";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// Optional button.
// If it doesn't exist in your HTML, the code will still work.
const newOrderButton = document.getElementById("newOrderBtn");


/* =========================================================
   STATE
   ========================================================= */

let isSending = false;


/* =========================================================
   SESSION MANAGEMENT
   ========================================================= */

/*
   Every customer gets one persistent session ID.

   This is important because n8n Simple Memory uses the
   session ID to remember the conversation.
*/

function getSessionId() {

    let sessionId =
        localStorage.getItem("restaurant_session_id");

    if (!sessionId) {

        // crypto.randomUUID() is preferred.
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            sessionId =
                "customer-" + crypto.randomUUID();
        } else {

            // Fallback for older browsers.
            sessionId =
                "customer-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 10);
        }

        localStorage.setItem(
            "restaurant_session_id",
            sessionId
        );
    }

    return sessionId;
}


/*
   Start a completely new conversation/order.
*/

function startNewOrder() {

    localStorage.removeItem(
        "restaurant_session_id"
    );

    // Generate a fresh session immediately.
    getSessionId();

    // Clear chat if the container exists.
    if (chatMessages) {
        chatMessages.innerHTML = "";
    }

    // Optional welcome message.
    addBotMessage(
        "👋 Welcome to Siddeqi PizzaHut!\n\n" +
        "How can I help you today? 🍕"
    );

    if (messageInput) {
        messageInput.focus();
    }
}


/* =========================================================
   MESSAGE UI
   ========================================================= */

function addUserMessage(message) {

    if (!chatMessages) return;

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "chat-message user-message";

    messageElement.textContent = message;

    chatMessages.appendChild(
        messageElement
    );

    scrollToBottom();
}


/* =========================================================
   RICH BOT MESSAGE FORMATTERS
   ========================================================= */

function sendChatAction(actionText) {
    if (messageInput) {
        messageInput.value = actionText;
        handleSendMessage();
    }
}

function renderOrderSummary(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    let items = [];
    let subtotal = "";
    let delivery = "";
    let total = "";
    let name = "";
    let phone = "";
    let orderType = "";
    let address = "";
    let instructions = "";
    let question = "Would you like me to place this order? ✅";

    lines.forEach(line => {
        if (line.startsWith("•") || line.startsWith("-")) {
            items.push(line.replace(/^[•\-]\s*/, ""));
        } else if (/subtotal:/i.test(line)) {
            subtotal = line.replace(/.*subtotal:\s*/i, "").trim();
        } else if (/delivery:/i.test(line)) {
            delivery = line.replace(/.*delivery:\s*/i, "").trim();
        } else if (/total:/i.test(line)) {
            total = line.replace(/.*total:\s*/i, "").trim();
        } else if (/name:/i.test(line)) {
            name = line.replace(/.*name:\s*/i, "").trim();
        } else if (/phone:/i.test(line)) {
            phone = line.replace(/.*phone:\s*/i, "").trim();
        } else if (/order type:/i.test(line)) {
            orderType = line.replace(/.*order type:\s*/i, "").trim();
        } else if (/address:/i.test(line)) {
            address = line.replace(/.*address:\s*/i, "").trim();
        } else if (/instructions:/i.test(line)) {
            instructions = line.replace(/.*instructions:\s*/i, "").trim();
        } else if (/place this order/i.test(line) || /would you like/i.test(line)) {
            question = line;
        }
    });

    const itemsHTML = items.map(item => `
        <div class="summary-card-item">
            <span class="summary-item-icon">🍕</span>
            <span class="summary-item-name">${escapeHtml(item)}</span>
        </div>
    `).join("");

    return `
        <div class="order-summary-card">
            <div class="order-summary-badge-bar">
                <span class="order-summary-badge">📋 ORDER SUMMARY</span>
                <span class="order-summary-status">Review & Confirm</span>
            </div>

            ${itemsHTML ? `
                <div class="summary-items-box">
                    <div class="summary-box-label">Items Selected:</div>
                    ${itemsHTML}
                </div>
            ` : ''}

            <div class="summary-card-pricing">
                ${subtotal ? `<div class="summary-price-row"><span>Subtotal:</span><strong>${escapeHtml(subtotal)}</strong></div>` : ''}
                ${delivery ? `<div class="summary-price-row"><span>Delivery:</span><strong>${escapeHtml(delivery)}</strong></div>` : ''}
                ${total ? `<div class="summary-price-row total-row"><span>💰 TOTAL:</span><strong class="highlight-total">${escapeHtml(total)}</strong></div>` : ''}
            </div>

            <div class="summary-card-details">
                <div class="details-grid">
                    ${name ? `<div class="detail-pill"><span>👤 Name:</span> <strong>${escapeHtml(name)}</strong></div>` : ''}
                    ${phone ? `<div class="detail-pill"><span>📞 Phone:</span> <strong>${escapeHtml(phone)}</strong></div>` : ''}
                    ${orderType ? `<div class="detail-pill"><span>🚚 Order Type:</span> <strong>${escapeHtml(orderType)}</strong></div>` : ''}
                    ${address ? `<div class="detail-pill full-width"><span>📍 Address:</span> <strong>${escapeHtml(address)}</strong></div>` : ''}
                    ${instructions && instructions.toLowerCase() !== 'none' ? `<div class="detail-pill full-width"><span>📝 Instructions:</span> <em>${escapeHtml(instructions)}</em></div>` : ''}
                </div>
            </div>

            <div class="summary-card-cta">
                <p class="summary-question">${escapeHtml(question)}</p>
                <div class="summary-action-buttons">
                    <button type="button" class="btn-confirm-order-now" onclick="sendChatAction('Yes, please place this order')">
                        <span>✅ Yes, Place Order</span>
                    </button>
                    <button type="button" class="btn-modify-order-now" onclick="sendChatAction('I want to modify my order')">
                        <span>✏️ Change Details</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderMenuCard(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    let html = `<div class="chat-menu-card"><div class="chat-menu-title">🍕 SIDDEQI PIZZAHUT MENU</div>`;

    lines.forEach(line => {
        if (/^(?:🍕|🍔|🍟|🥤|🚚)\s+[A-Z\s]+$/i.test(line) || (/^[A-Z\s]{4,}$/.test(line) && !line.includes("MENU"))) {
            html += `<div class="chat-menu-cat-header">${escapeHtml(line)}</div>`;
        } else if (line.startsWith("•") || line.startsWith("-")) {
            const parts = line.replace(/^[•\-]\s*/, "").split("—");
            if (parts.length === 2) {
                html += `
                    <div class="chat-menu-item-row">
                        <span class="chat-item-name">${escapeHtml(parts[0].trim())}</span>
                        <span class="chat-item-dots"></span>
                        <strong class="chat-item-price">${escapeHtml(parts[1].trim())}</strong>
                    </div>
                `;
            } else {
                html += `<div class="chat-menu-item-row"><span>${escapeHtml(line)}</span></div>`;
            }
        } else if (line.toLowerCase().includes("delivery") || line.toLowerCase().includes("pickup")) {
            html += `<div class="chat-menu-delivery-info">${escapeHtml(line)}</div>`;
        } else if (line.includes("?") || line.includes("😊")) {
            html += `<div class="chat-menu-callout">${escapeHtml(line)}</div>`;
        }
    });

    html += `</div>`;
    return html;
}

function renderNotificationAlert(text) {
    return `
        <div class="notification-alert-card">
            <div class="alert-card-header">
                <span>⚠️ Order Received — Notice</span>
            </div>
            <p class="alert-card-text">
                ${escapeHtml(text)}
            </p>
            <div class="alert-card-action">
                <a href="tel:+923440114925" class="chat-call-btn">
                    <span>📞 Call Siddeqi PizzaHut (+92 344 0114925)</span>
                </a>
            </div>
        </div>
    `;
}

function renderSafeRichText(text) {
    let safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\n\n/g, '<div class="chat-spacer"></div>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
}

function addBotMessage(message) {

    if (!chatMessages) return;

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "chat-message bot-message";

    const text = (message || "").trim();

    if (text.toUpperCase().includes("ORDER SUMMARY")) {
        messageElement.classList.add("chat-card-container");
        messageElement.innerHTML = renderOrderSummary(text);
    } else if (text.toUpperCase().includes("SIDDEQI PIZZAHUT MENU") || (text.toUpperCase().includes("MENU") && text.includes("•"))) {
        messageElement.classList.add("chat-card-container");
        messageElement.innerHTML = renderMenuCard(text);
    } else if (text.includes("couldn't notify the restaurant") || text.includes("could not notify")) {
        messageElement.classList.add("chat-card-container");
        messageElement.innerHTML = renderNotificationAlert(text);
    } else {
        messageElement.innerHTML = renderSafeRichText(text);
    }

    chatMessages.appendChild(
        messageElement
    );

    scrollToBottom();
}


/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function showTypingIndicator() {

    if (!chatMessages) return;

    // Don't create duplicate indicators.
    if (
        document.getElementById(
            "typing-indicator"
        )
    ) {
        return;
    }

    const typingElement =
        document.createElement("div");

    typingElement.id =
        "typing-indicator";

    typingElement.className =
        "chat-message bot-message typing-message";

    typingElement.textContent =
        "Thinking...";

    chatMessages.appendChild(
        typingElement
    );

    scrollToBottom();
}


function hideTypingIndicator() {

    const typingElement =
        document.getElementById(
            "typing-indicator"
        );

    if (typingElement) {
        typingElement.remove();
    }
}


/* =========================================================
   SCROLL CHAT
   ========================================================= */

function scrollToBottom() {

    if (!chatMessages) return;

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* =========================================================
   BUTTON STATE
   ========================================================= */

function setSendingState(sending) {

    isSending = sending;

    if (sendButton) {

        sendButton.disabled =
            sending;

        if (sending) {

            sendButton.dataset.originalText =
                sendButton.textContent;

            sendButton.textContent =
                "Sending...";

        } else {

            sendButton.textContent =
                sendButton.dataset.originalText ||
                "Send";
        }
    }

    if (messageInput) {
        messageInput.disabled =
            sending;
    }
}


/* =========================================================
   SEND MESSAGE TO N8N
   ========================================================= */

async function sendMessageToN8n(message) {

    const sessionId =
        getSessionId();

    const response =
        await fetch(
            N8N_WEBHOOK_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    sessionId: sessionId,
                    message: message
                })
            }
        );

    if (!response.ok) {

        throw new Error(
            `n8n returned HTTP ${response.status}`
        );
    }

    /*
       n8n should normally return JSON.

       We still protect the frontend in case
       something unexpected is returned.
    */

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {

        return await response.json();

    } else {

        const text =
            await response.text();

        return {
            reply: text
        };
    }
}


/* =========================================================
   NORMALIZE N8N RESPONSE
   ========================================================= */

function normalizeN8nResponse(data) {

    /*
       Expected response:

       {
           reply: "...",
           orderConfirmed: false,
           customerName: "",
           phone: "",
           orderType: "",
           address: "",
           specialInstructions: "",
           items: [],
           subtotal: 0,
           deliveryFee: 0,
           total: 0
       }

       But some n8n configurations may return
       the data inside another property.

       This function tries to safely normalize it.
    */

    if (!data) {

        return {
            reply:
                "Sorry, I didn't receive a response from the restaurant assistant."
        };
    }


    // Direct structured response.
    if (
        typeof data === "object" &&
        typeof data.reply === "string"
    ) {
        return data;
    }


    // Common nested response formats.

    if (
        data.output &&
        typeof data.output === "object"
    ) {
        return data.output;
    }


    if (
        data.response &&
        typeof data.response === "object"
    ) {
        return data.response;
    }


    /*
       Sometimes AI output may be returned as
       a JSON string.
    */

    if (
        typeof data.output === "string"
    ) {

        try {

            const parsed =
                JSON.parse(data.output);

            if (
                parsed &&
                typeof parsed === "object"
            ) {
                return parsed;
            }

        } catch (error) {

            return {
                reply: data.output
            };
        }
    }


    // If n8n returned a plain string.
    if (
        typeof data === "string"
    ) {

        return {
            reply: data
        };
    }


    // Last-resort fallback.
    return {
        reply:
            "Sorry, I couldn't understand the restaurant assistant's response."
    };
}


/* =========================================================
   ORDER CONFIRMATION UI
   ========================================================= */

function showOrderConfirmation(order) {

    if (!chatMessages) return;

    const container =
        document.createElement("div");

    container.className =
        "order-confirmation";


    let itemsHTML = "";

    if (
        Array.isArray(order.items) &&
        order.items.length > 0
    ) {

        itemsHTML =
            order.items
                .map(item => {

                    const quantity =
                        Number(
                            item.quantity || 0
                        );

                    const price =
                        Number(
                            item.price || 0
                        );

                    const itemTotal =
                        quantity * price;

                    return `
                        <div class="order-item">
                            <span>
                                ${escapeHtml(
                                    item.name || "Item"
                                )}
                                × ${quantity}
                            </span>

                            <span>
                                Rs. ${itemTotal}
                            </span>
                        </div>
                    `;
                })
                .join("");

    } else {

        itemsHTML =
            `<div class="order-item">
                <span>Order received</span>
            </div>`;
    }


    const subtotal =
        Number(order.subtotal || 0);

    const deliveryFee =
        Number(order.deliveryFee || 0);

    const total =
        Number(order.total || 0);


    container.innerHTML = `
        <div class="order-confirmation-header">
            <strong>✅ ORDER CONFIRMED</strong>
        </div>

        <div class="order-confirmation-body">

            <div class="order-items">
                ${itemsHTML}
            </div>

            <div class="order-summary-row">
                <span>Subtotal</span>
                <span>Rs. ${subtotal}</span>
            </div>

            <div class="order-summary-row">
                <span>Delivery</span>
                <span>Rs. ${deliveryFee}</span>
            </div>

            <div class="order-total">
                <span>Total</span>
                <strong>Rs. ${total}</strong>
            </div>

            <div class="order-status">
                📲 Your order has been sent to Siddeqi PizzaHut.
            </div>

            <button type="button" class="new-order-receipt-btn" onclick="startNewOrder()" style="margin-top: 14px; width: 100%; padding: 11px 16px; background: var(--primary-gradient); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>🛒 Start Another Order / Clear Chat</span>
            </button>

        </div>
    `;

    chatMessages.appendChild(
        container
    );

    scrollToBottom();
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


let isOrderCompleted = false;

/* =========================================================
   MAIN SEND FUNCTION
   ========================================================= */

async function handleSendMessage() {

    if (isSending) {
        return;
    }

    if (!messageInput) {
        console.error(
            "messageInput element was not found."
        );
        return;
    }


    const message =
        messageInput.value.trim();


    // Don't send empty messages.
    if (!message) {
        return;
    }

    // Auto-session rotation:
    // If an order was previously confirmed, or if the user is asking for the menu / reset / new order,
    // rotate to a fresh session ID so n8n connects directly to the AI Agent instead of the completed-order branch!
    const lowerMsg = message.toLowerCase();
    const isMenuOrReset =
        lowerMsg.includes("menu") ||
        lowerMsg === "reset" ||
        lowerMsg === "new order" ||
        lowerMsg === "start over";

    if (
        isOrderCompleted ||
        isMenuOrReset ||
        localStorage.getItem("restaurant_last_order_confirmed") === "true"
    ) {
        localStorage.removeItem("restaurant_session_id");
        localStorage.removeItem("restaurant_last_order_confirmed");
        isOrderCompleted = false;
    }


    // Display customer message.
    addUserMessage(message);


    // Clear input.
    messageInput.value = "";


    // Disable UI.
    setSendingState(true);


    // Show AI typing indicator.
    showTypingIndicator();


    try {

        const rawResponse =
            await sendMessageToN8n(
                message
            );


        console.log(
            "n8n response:",
            rawResponse
        );


        const data =
            normalizeN8nResponse(
                rawResponse
            );


        hideTypingIndicator();


        /*
           Display AI response.
        */

        if (data.reply) {

            addBotMessage(
                data.reply
            );
        }


        /*
           IMPORTANT:

           WhatsApp is NOT handled by the website.

           n8n handles:

           orderConfirmed
                ↓
           IF
                ↓
           WhatsApp Business Cloud
        */


        if (
            data.orderConfirmed === true
        ) {

            showOrderConfirmation(
                data
            );

            // Mark order as completed and rotate the session ID for subsequent messages
            // so asking for the menu or placing another order connects to the AI Agent fresh!
            isOrderCompleted = true;
            localStorage.setItem("restaurant_last_order_confirmed", "true");
            localStorage.removeItem("restaurant_session_id");

        } else {

            localStorage.removeItem("restaurant_last_order_confirmed");
        }

    } catch (error) {

        console.error(
            "Restaurant AI error:",
            error
        );


        hideTypingIndicator();


        addBotMessage(
            "⚠️ Sorry, I couldn't connect to the restaurant assistant right now. Please try again."
        );

    } finally {

        setSendingState(false);

        if (messageInput) {
            messageInput.focus();
        }
    }
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */


/*
   Send button
*/

if (sendButton) {

    sendButton.addEventListener(
        "click",
        handleSendMessage
    );
}


/*
   Enter key
*/

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        function(event) {

            /*
               Enter sends the message.

               Shift + Enter creates a new line.
            */

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                handleSendMessage();
            }
        }
    );
}


/*
   New order button
*/

if (newOrderButton) {

    newOrderButton.addEventListener(
        "click",
        startNewOrder
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeRestaurantChat() {

    // Make sure a session exists.
    getSessionId();


    /*
       Only show the welcome message if
       the chat is currently empty.
    */

    if (
        chatMessages &&
        chatMessages.children.length === 0
    ) {

        addBotMessage(
            "👋 Welcome to Siddeqi PizzaHut!\n\n" +
            "🍕 I can help you explore our menu and place an order.\n\n" +
            "What would you like today?"
        );
    }


    if (messageInput) {
        messageInput.focus();
    }
}


/* =========================================================
   SHOPPING CART & AUTOMATED AI ORDER SYSTEM
   ========================================================= */

let cart = [];

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 1)), 0);
}

function getCartItemCount() {
    return cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
}

function addToCart(name, price, qty, image) {
    qty = parseInt(qty, 10) || 1;
    if (qty <= 0) return;

    const existing = cart.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            name: name,
            price: Number(price),
            qty: qty,
            image: image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"
        });
    }

    updateCartUI();
    showCartToast(`🛒 Added ${qty}x ${name} to cart!`);
}

function updateCartItemQty(name, delta) {
    const item = cart.find(i => i.name.toLowerCase() === name.toLowerCase());
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.name.toLowerCase() !== name.toLowerCase());
    }

    updateCartUI();
}

function removeCartItem(name) {
    cart = cart.filter(i => i.name.toLowerCase() !== name.toLowerCase());
    updateCartUI();
    showCartToast(`Removed ${name} from cart`);
}

function clearCart() {
    cart = [];
    updateCartUI();
}

function updateCartUI() {
    const navCartCount = document.getElementById("navCartCount");
    const floatingCartBar = document.getElementById("floatingCartBar");
    const floatingCartCount = document.getElementById("floatingCartCount");
    const floatingCartTotal = document.getElementById("floatingCartTotal");
    const cartItemsList = document.getElementById("cartItemsList");
    const cartSubtotal = document.getElementById("cartSubtotal");
    const cartTotalWithFee = document.getElementById("cartTotalWithFee");

    const totalCount = getCartItemCount();
    const subtotal = getCartTotal();

    // 1. Navbar badge
    if (navCartCount) {
        navCartCount.textContent = totalCount;
        if (totalCount > 0) {
            navCartCount.classList.add("has-items");
        } else {
            navCartCount.classList.remove("has-items");
        }
    }

    // 2. Floating Cart Bar
    if (floatingCartBar) {
        if (totalCount > 0) {
            floatingCartBar.classList.add("show");
            if (floatingCartCount) {
                floatingCartCount.textContent = `${totalCount} item${totalCount > 1 ? "s" : ""}`;
            }
            if (floatingCartTotal) {
                floatingCartTotal.textContent = `Rs. ${subtotal}`;
            }
        } else {
            floatingCartBar.classList.remove("show");
        }
    }

    // 3. Cart Drawer Subtotal & Total
    if (cartSubtotal) {
        cartSubtotal.textContent = `Rs. ${subtotal}`;
    }
    if (cartTotalWithFee) {
        cartTotalWithFee.textContent = `Rs. ${subtotal > 0 ? subtotal + 120 : 0}`;
    }

    // 4. Cart Items List inside Drawer
    if (cartItemsList) {
        if (cart.length === 0) {
            cartItemsList.innerHTML = `
                <div class="empty-cart-state">
                    <div class="empty-cart-icon">🛒</div>
                    <h4>Your Cart is Empty</h4>
                    <p>Select quantities and click "Add to Cart" on any delicious item from our menu!</p>
                </div>
            `;
        } else {
            cartItemsList.innerHTML = cart.map(item => `
                <div class="cart-item-row">
                    <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-thumb">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${escapeHtml(item.name)}</div>
                        <div class="cart-item-price">Rs. ${item.price} each</div>
                        <div class="cart-item-controls">
                            <button type="button" class="cart-qty-btn" onclick="updateCartItemQty('${escapeHtml(item.name)}', -1)" aria-label="Decrease quantity">−</button>
                            <span class="cart-qty-num">${item.qty}</span>
                            <button type="button" class="cart-qty-btn" onclick="updateCartItemQty('${escapeHtml(item.name)}', 1)" aria-label="Increase quantity">+</button>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="cart-item-total">Rs. ${item.price * item.qty}</div>
                        <button type="button" class="cart-item-remove" onclick="removeCartItem('${escapeHtml(item.name)}')" title="Remove item" aria-label="Remove item">✕</button>
                    </div>
                </div>
            `).join("");
        }
    }

    // Cache to localStorage
    try {
        localStorage.setItem("restaurant_cart", JSON.stringify(cart));
    } catch (e) {}
}

function loadSavedCart() {
    try {
        const saved = localStorage.getItem("restaurant_cart");
        if (saved) {
            cart = JSON.parse(saved);
            if (!Array.isArray(cart)) cart = [];
        }
    } catch (e) {
        cart = [];
    }
    updateCartUI();
}

function toggleCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("cartBackdrop");
    if (drawer && backdrop) {
        if (drawer.classList.contains("open")) {
            closeCartDrawer();
        } else {
            openCartDrawer();
        }
    }
}

function openCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("cartBackdrop");
    if (drawer && backdrop) {
        drawer.classList.add("open");
        backdrop.classList.add("open");
        document.body.style.overflow = "hidden";
    }
}

function closeCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("cartBackdrop");
    if (drawer && backdrop) {
        drawer.classList.remove("open");
        backdrop.classList.remove("open");
        document.body.style.overflow = "";
    }
}

function changeCardQty(btn, delta) {
    const parent = btn.parentElement;
    const valSpan = parent ? parent.querySelector(".qty-val") : null;
    if (!valSpan) return;

    let current = parseInt(valSpan.textContent, 10) || 1;
    current += delta;
    if (current < 1) current = 1;
    if (current > 50) current = 50;
    valSpan.textContent = current;
}

function addToCartFromCard(btn, name, price, image) {
    const card = btn.closest(".menu-card");
    const qtySpan = card ? card.querySelector(".qty-val") : null;
    const qty = qtySpan ? parseInt(qtySpan.textContent, 10) || 1 : 1;

    addToCart(name, price, qty, image);

    // Tactile button confirmation feedback
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span>Added! ✓</span>`;
    btn.classList.add("added-success");
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove("added-success");
    }, 1200);

    // Reset card counter to 1
    if (qtySpan) {
        qtySpan.textContent = "1";
    }
}

/* =========================================================
   AUTOMATED AI CHAT ORDER PLACEMENT
   ========================================================= */

async function sendAutomatedOrder(orderMessage) {
    if (!orderMessage) return;

    // Smooth scroll down to AI order section
    const aiSection = document.getElementById("ai-order");
    if (aiSection) {
        aiSection.scrollIntoView({ behavior: "smooth" });
    }

    // Set message into input
    if (messageInput) {
        messageInput.value = orderMessage;
    }

    // Short delay for scroll animation to kick in, then automatically send to webhook
    setTimeout(() => {
        handleSendMessage();
    }, 450);
}

function placeOrderWithAI() {
    if (!cart || cart.length === 0) {
        showCartToast("⚠️ Your cart is empty! Please add some delicious food.");
        return;
    }

    // Format clear, conversational prompt that n8n extracts effortlessly
    const itemsSummary = cart
        .map(item => `${item.qty}x ${item.name} (Rs. ${item.price} each)`)
        .join(", ");
    const subtotal = getCartTotal();

    const orderText = `Hello! I would like to place an order: ${itemsSummary}. Total: Rs. ${subtotal}. Please proceed with my order.`;

    // Close drawer
    closeCartDrawer();

    // Clear cart so duplicate orders aren't accidentally placed
    clearCart();

    // Send request automatically to AI chatbot
    sendAutomatedOrder(orderText);

    showCartToast("🚀 Order sent to AI Assistant! Processing below...");
}

function instantOrderFromCard(btn, name, price) {
    const card = btn.closest(".menu-card");
    const qtySpan = card ? card.querySelector(".qty-val") : null;
    const qty = qtySpan ? parseInt(qtySpan.textContent, 10) || 1 : 1;
    const itemTotal = price * qty;

    const orderText = `Hello! I would like to order: ${qty}x ${name} (Rs. ${price} each). Total: Rs. ${itemTotal}. Please proceed with my order.`;

    if (qtySpan) {
        qtySpan.textContent = "1";
    }

    sendAutomatedOrder(orderText);
    showCartToast(`🚀 Ordering ${qty}x ${name} with AI!`);
}

function showCartToast(message) {
    let toast = document.getElementById("cartToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "cartToast";
        toast.className = "cart-toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("visible");

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove("visible");
    }, 3000);
}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeRestaurantChat();
    loadSavedCart();
});