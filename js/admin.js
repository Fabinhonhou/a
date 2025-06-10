document.addEventListener("DOMContentLoaded", () => {
  // Check admin authentication
  if (!isAdminLoggedIn()) {
    showAdminLogin()
    return
  }

  // Initialize admin dashboard
  initializeAdminDashboard()
})

function isAdminLoggedIn() {
  // Simple admin check - in production, use proper authentication
  const adminSession = localStorage.getItem("adminSession")
  return adminSession === "true"
}

function showAdminLogin() {
  const password = prompt("Enter admin password:")
  if (password === "admin123") {
    // In production, use proper authentication
    localStorage.setItem("adminSession", "true")
    initializeAdminDashboard()
  } else {
    alert("Invalid password")
    window.location.href = "index.html"
  }
}

function initializeAdminDashboard() {
  // Load dashboard data
  loadDashboardStats()
  loadReservations()
  loadInventory()
  loadMenuItems()

  // Setup tab navigation
  setupTabNavigation()

  // Setup event listeners
  setupEventListeners()

  // Setup logout
  document.getElementById("adminLogoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault()
    localStorage.removeItem("adminSession")
    window.location.href = "index.html"
  })
}

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab")

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      // Add active class to clicked button and corresponding content
      button.classList.add("active")
      document.getElementById(`${targetTab}-tab`).classList.add("active")
    })
  })
}

function setupEventListeners() {
  // Filter controls
  document.getElementById("dateFilter")?.addEventListener("change", loadReservations)
  document.getElementById("statusFilter")?.addEventListener("change", loadReservations)

  // Modal controls
  setupModalControls()

  // Add buttons
  document.getElementById("addInventoryBtn")?.addEventListener("click", () => openInventoryModal())
  document.getElementById("addMenuItemBtn")?.addEventListener("click", () => openMenuModal())
}

function setupModalControls() {
  // Inventory modal
  const inventoryModal = document.getElementById("inventoryModal")
  const closeInventoryModal = document.getElementById("closeInventoryModal")
  const cancelInventory = document.getElementById("cancelInventory")

  closeInventoryModal?.addEventListener("click", () => {
    inventoryModal.style.display = "none"
  })

  cancelInventory?.addEventListener("click", () => {
    inventoryModal.style.display = "none"
  })

  // Menu modal
  const menuModal = document.getElementById("menuModal")
  const closeMenuModal = document.getElementById("closeMenuModal")
  const cancelMenu = document.getElementById("cancelMenu")

  closeMenuModal?.addEventListener("click", () => {
    menuModal.style.display = "none"
  })

  cancelMenu?.addEventListener("click", () => {
    menuModal.style.display = "none"
  })

  // Form submissions
  document.getElementById("inventoryForm")?.addEventListener("submit", handleInventorySubmit)
  document.getElementById("menuForm")?.addEventListener("submit", handleMenuSubmit)

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === inventoryModal) {
      inventoryModal.style.display = "none"
    }
    if (e.target === menuModal) {
      menuModal.style.display = "none"
    }
  })
}

async function loadDashboardStats() {
  try {
    const stats = await getDashboardStats()

    document.getElementById("todayReservations").textContent = stats.todayReservations
    document.getElementById("pendingReservations").textContent = stats.pendingReservations
    document.getElementById("totalGuests").textContent = stats.totalGuests
    document.getElementById("lowStockItems").textContent = stats.lowStockItems
  } catch (error) {
    console.error("Failed to load dashboard stats:", error)
  }
}

async function loadReservations() {
  try {
    const dateFilter = document.getElementById("dateFilter")?.value || "today"
    const statusFilter = document.getElementById("statusFilter")?.value || "all"

    const reservations = await getReservations(dateFilter, statusFilter)
    displayReservations(reservations)
  } catch (error) {
    console.error("Failed to load reservations:", error)
    displayError("reservations-table", "Failed to load reservations")
  }
}

function displayReservations(reservations) {
  const container = document.getElementById("reservations-table")

  if (reservations.length === 0) {
    container.innerHTML = `
            <div class="text-center" style="padding: 2rem;">
                <p>No reservations found for the selected filters.</p>
            </div>
        `
    return
  }

  const tableHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Guests</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${reservations
                  .map(
                    (reservation) => `
                    <tr>
                        <td>#${reservation.id}</td>
                        <td>${reservation.name}</td>
                        <td>
                            <div>${reservation.email}</div>
                            <div style="font-size: 0.875rem; color: #666;">${reservation.phone}</div>
                        </td>
                        <td>${formatDate(reservation.date)}</td>
                        <td>${reservation.time}</td>
                        <td>${reservation.guests}</td>
                        <td>
                            <span class="status-badge status-${reservation.status}">
                                ${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                ${
                                  reservation.status === "pending"
                                    ? `<button class="btn btn-success btn-sm" onclick="updateReservationStatus('${reservation.id}', 'confirmed')">Confirm</button>`
                                    : ""
                                }
                                ${
                                  reservation.status !== "cancelled"
                                    ? `<button class="btn btn-danger btn-sm" onclick="updateReservationStatus('${reservation.id}', 'cancelled')">Cancel</button>`
                                    : ""
                                }
                            </div>
                        </td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    `

  container.innerHTML = tableHTML
}

async function loadInventory() {
  try {
    const inventory = await getInventory()
    displayInventory(inventory)
  } catch (error) {
    console.error("Failed to load inventory:", error)
    displayError("inventory-table", "Failed to load inventory")
  }
}

function displayInventory(inventory) {
  const container = document.getElementById("inventory-table")

  if (inventory.length === 0) {
    container.innerHTML = `
            <div class="text-center" style="padding: 2rem;">
                <p>No inventory items found.</p>
            </div>
        `
    return
  }

  const tableHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Stock</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th>Supplier</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${inventory
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.category}</td>
                        <td>${item.currentStock}</td>
                        <td>${item.minStock}</td>
                        <td>${item.unit}</td>
                        <td>
                            <span class="stock-status ${getStockStatusClass(item.currentStock, item.minStock)}">
                                ${getStockStatus(item.currentStock, item.minStock)}
                            </span>
                        </td>
                        <td>${item.supplier || "-"}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-warning btn-sm" onclick="editInventoryItem('${item.id}')">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteInventoryItem('${item.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    `

  container.innerHTML = tableHTML
}

async function loadMenuItems() {
  try {
    const menuItems = await getMenuItems()
    displayMenuItems(menuItems)
  } catch (error) {
    console.error("Failed to load menu items:", error)
    displayError("menu-table", "Failed to load menu items")
  }
}

function displayMenuItems(menuItems) {
  const container = document.getElementById("menu-table")

  if (menuItems.length === 0) {
    container.innerHTML = `
            <div class="text-center" style="padding: 2rem;">
                <p>No menu items found.</p>
            </div>
        `
    return
  }

  const tableHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Available</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${menuItems
                  .map(
                    (item) => `
                    <tr>
                        <td>
                            <div style="font-weight: 600;">${item.name}</div>
                            <div style="font-size: 0.875rem; color: #666;">${item.description}</div>
                        </td>
                        <td>${item.category}</td>
                        <td>$${item.price}</td>
                        <td>
                            <span class="status-badge ${item.available ? "status-confirmed" : "status-cancelled"}">
                                ${item.available ? "Available" : "Unavailable"}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-warning btn-sm" onclick="editMenuItem('${item.id}')">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteMenuItem('${item.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    `

  container.innerHTML = tableHTML
}

// Modal functions
function openInventoryModal(item = null) {
  const modal = document.getElementById("inventoryModal")
  const form = document.getElementById("inventoryForm")
  const title = document.getElementById("inventoryModalTitle")

  if (item) {
    title.textContent = "Edit Inventory Item"
    // Populate form with item data
    document.getElementById("inventoryId").value = item.id
    document.getElementById("itemName").value = item.name
    document.getElementById("category").value = item.category
    document.getElementById("unit").value = item.unit
    document.getElementById("currentStock").value = item.currentStock
    document.getElementById("minStock").value = item.minStock
    document.getElementById("supplier").value = item.supplier || ""
  } else {
    title.textContent = "Add Inventory Item"
    form.reset()
    document.getElementById("inventoryId").value = ""
  }

  modal.style.display = "block"
}

function openMenuModal(item = null) {
  const modal = document.getElementById("menuModal")
  const form = document.getElementById("menuForm")
  const title = document.getElementById("menuModalTitle")

  if (item) {
    title.textContent = "Edit Menu Item"
    // Populate form with item data
    document.getElementById("menuItemId").value = item.id
    document.getElementById("menuItemName").value = item.name
    document.getElementById("description").value = item.description
    document.getElementById("menuCategory").value = item.category
    document.getElementById("price").value = item.price
    document.getElementById("imageUrl").value = item.imageUrl || ""
    document.getElementById("available").checked = item.available
  } else {
    title.textContent = "Add Menu Item"
    form.reset()
    document.getElementById("menuItemId").value = ""
    document.getElementById("available").checked = true
  }

  modal.style.display = "block"
}

// Form handlers
async function handleInventorySubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const inventoryData = {
    id: formData.get("inventoryId") || null,
    name: formData.get("itemName"),
    category: formData.get("category"),
    unit: formData.get("unit"),
    currentStock: Number.parseFloat(formData.get("currentStock")),
    minStock: Number.parseFloat(formData.get("minStock")),
    supplier: formData.get("supplier"),
  }

  try {
    if (inventoryData.id) {
      await updateInventoryItem(inventoryData)
    } else {
      await createInventoryItem(inventoryData)
    }

    document.getElementById("inventoryModal").style.display = "none"
    loadInventory()
    loadDashboardStats()
  } catch (error) {
    console.error("Failed to save inventory item:", error)
    alert("Failed to save inventory item")
  }
}

async function handleMenuSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const menuData = {
    id: formData.get("menuItemId") || null,
    name: formData.get("menuItemName"),
    description: formData.get("description"),
    category: formData.get("menuCategory"),
    price: Number.parseFloat(formData.get("price")),
    imageUrl: formData.get("imageUrl"),
    available: formData.get("available") === "on",
  }

  try {
    if (menuData.id) {
      await updateMenuItem(menuData)
    } else {
      await createMenuItem(menuData)
    }

    document.getElementById("menuModal").style.display = "none"
    loadMenuItems()
  } catch (error) {
    console.error("Failed to save menu item:", error)
    alert("Failed to save menu item")
  }
}

// Action functions
async function updateReservationStatus(reservationId, status) {
  try {
    await updateReservation(reservationId, { status })
    loadReservations()
    loadDashboardStats()
  } catch (error) {
    console.error("Failed to update reservation:", error)
    alert("Failed to update reservation")
  }
}

async function editInventoryItem(itemId) {
  try {
    const item = await getInventoryItem(itemId)
    openInventoryModal(item)
  } catch (error) {
    console.error("Failed to load inventory item:", error)
    alert("Failed to load inventory item")
  }
}

async function deleteInventoryItem(itemId) {
  if (!confirm("Are you sure you want to delete this inventory item?")) {
    return
  }

  try {
    await deleteInventory(itemId)
    loadInventory()
    loadDashboardStats()
  } catch (error) {
    console.error("Failed to delete inventory item:", error)
    alert("Failed to delete inventory item")
  }
}

async function editMenuItem(itemId) {
  try {
    const item = await getMenuItem(itemId)
    openMenuModal(item)
  } catch (error) {
    console.error("Failed to load menu item:", error)
    alert("Failed to load menu item")
  }
}

async function deleteMenuItem(itemId) {
  if (!confirm("Are you sure you want to delete this menu item?")) {
    return
  }

  try {
    await deleteMenu(itemId)
    loadMenuItems()
  } catch (error) {
    console.error("Failed to delete menu item:", error)
    alert("Failed to delete menu item")
  }
}

// Utility functions
function getStockStatus(current, min) {
  if (current === 0) return "Out of Stock"
  if (current <= min) return "Low Stock"
  return "Good"
}

function getStockStatusClass(current, min) {
  if (current === 0) return "stock-out"
  if (current <= min) return "stock-low"
  return "stock-good"
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function displayError(containerId, message) {
  const container = document.getElementById(containerId)
  if (container) {
    container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `
  }
}

// Mock API functions (replace with actual backend calls)
async function getDashboardStats() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    todayReservations: 12,
    pendingReservations: 3,
    totalGuests: 48,
    lowStockItems: 2,
  }
}

async function getReservations(dateFilter, statusFilter) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "(555) 123-4567",
      date: "2024-01-15",
      time: "7:00 PM",
      guests: 4,
      status: "pending",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "(555) 987-6543",
      date: "2024-01-15",
      time: "6:30 PM",
      guests: 2,
      status: "confirmed",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      phone: "(555) 456-7890",
      date: "2024-01-16",
      time: "8:00 PM",
      guests: 6,
      status: "confirmed",
    },
  ]
}

async function getInventory() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    {
      id: 1,
      name: "Tomatoes",
      category: "vegetables",
      currentStock: 5,
      minStock: 10,
      unit: "kg",
      supplier: "Fresh Farm Co.",
    },
    {
      id: 2,
      name: "Mozzarella Cheese",
      category: "dairy",
      currentStock: 15,
      minStock: 5,
      unit: "kg",
      supplier: "Italian Dairy",
    },
    {
      id: 3,
      name: "Pasta (Spaghetti)",
      category: "grains",
      currentStock: 0,
      minStock: 20,
      unit: "kg",
      supplier: "Pasta Masters",
    },
    {
      id: 4,
      name: "Olive Oil",
      category: "other",
      currentStock: 8,
      minStock: 3,
      unit: "liters",
      supplier: "Mediterranean Oils",
    },
  ]
}

async function getMenuItems() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    {
      id: 1,
      name: "Spaghetti Carbonara",
      description: "Classic Roman pasta with eggs, pecorino cheese, guanciale, and black pepper",
      category: "pasta",
      price: 18.95,
      available: true,
    },
    {
      id: 2,
      name: "Margherita Pizza",
      description: "Traditional pizza with tomato sauce, mozzarella, and fresh basil",
      category: "pasta",
      price: 16.95,
      available: false,
    },
    {
      id: 3,
      name: "Tiramisu",
      description: "Espresso-soaked ladyfingers layered with mascarpone cream and cocoa",
      category: "dolci",
      price: 9.95,
      available: true,
    },
  ]
}

// Additional mock API functions
async function updateReservation(id, data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  console.log("Updating reservation:", id, data)
}

async function getInventoryItem(id) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const inventory = await getInventory()
  return inventory.find((item) => item.id == id)
}

async function createInventoryItem(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  console.log("Creating inventory item:", data)
}

async function updateInventoryItem(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  console.log("Updating inventory item:", data)
}

async function deleteInventory(id) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  console.log("Deleting inventory item:", id)
}

async function getMenuItem(id) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const menuItems = await getMenuItems()
  return menuItems.find((item) => item.id == id)
}

async function createMenuItem(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  console.log("Creating menu item:", data)
}

async function updateMenuItem(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  console.log("Updating menu item:", data)
}

async function deleteMenu(id) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  console.log("Deleting menu item:", id)
}
