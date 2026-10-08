# 🍕 Siddeqi PizzaHut - AI Restaurant Automation

An intelligent, modern, and fully responsive restaurant website and AI ordering system. Built with modern HTML5, CSS3, JavaScript, and powered by an **n8n AI Workflow** for seamless order processing and automated WhatsApp alerts.

---

## 🌟 Key Features

- **🎨 Modern & Responsive UI**: Clean aesthetic with fluid glassmorphism, responsive grid layouts, and smooth CSS keyframe animations.
- **🛒 Interactive Shopping Cart**:
  - Live quantity adjustment & real-time pricing calculation.
  - Slide-out cart drawer and floating order bar.
  - One-click transfer from cart into AI assistant.
- **🤖 AI-Powered Assistant**:
  - Embedded conversational chat powered by an n8n webhook.
  - Interactive **Order Summary** review cards with one-click confirmation (`✅ Yes, Place Order` / `✏️ Change Details`).
  - Formatted digital receipts and smart session management.
- **📲 Automated WhatsApp Notifications**:
  - Seamless integration with Meta WhatsApp Business Cloud API via n8n to send real-time order alerts to restaurant management.

---

## 📂 Project Structure

```text
├── index.html        # Main landing page, menu sections, cart modal, & chat interface
├── style.css         # Modern styling, responsive design, animations, & card layouts
├── script.js         # Core logic, shopping cart state, session management, & n8n webhook integration
└── README.md         # Documentation
```

---

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zimmalsiddeqi/AI-Restaurant-Automation.git
   ```
2. **Open `index.html`**:
   Simply open `index.html` in any modern web browser or serve via a local server (e.g., Live Server in VS Code).

---

## ⚙️ Configuration

- **Webhook URL**: Configured in `script.js` under `N8N_WEBHOOK_URL` to route order chat messages to your n8n AI webhook.
- **Phone Number Format for WhatsApp API**: Make sure phone numbers sent to Meta WhatsApp Cloud API are in international digit-only format (`923440114925`).

---

## 📄 License

This project is licensed under the MIT License.
