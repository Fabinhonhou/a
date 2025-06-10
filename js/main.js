// Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navMenu.classList.toggle("active")
    })

    // Close mobile menu when clicking on a link
    document.querySelectorAll(".nav-link").forEach((n) =>
      n.addEventListener("click", () => {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      }),
    )
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Set minimum date for reservation form
  const dateInput = document.getElementById("date")
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0]
    dateInput.setAttribute("min", today)
  }

  // Initialize navigation after DOM is loaded
  setTimeout(updateNavigation, 100)
})

// Utility functions
function showMessage(elementId, message, isError = false) {
  const element = document.getElementById(elementId)
  if (element) {
    element.style.display = "block"
    if (message) {
      const messageText = element.querySelector("p")
      if (messageText) {
        messageText.textContent = message
      }
    }

    // Auto-hide success messages after 5 seconds
    if (!isError) {
      setTimeout(() => {
        element.style.display = "none"
      }, 5000)
    }
  }
}

function hideMessage(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.style.display = "none"
  }
}

// API helper functions
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Request failed")
    }

    return data
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

// Session management
function getSession() {
  const session = localStorage.getItem("userSession")
  return session ? JSON.parse(session) : null
}

function getAdminSession() {
  const adminToken = localStorage.getItem("adminToken")
  const adminData = localStorage.getItem("adminData")

  if (adminToken && adminData) {
    return {
      token: adminToken,
      admin: JSON.parse(adminData),
    }
  }
  return null
}

function setSession(userData) {
  localStorage.setItem("userSession", JSON.stringify(userData))
}

function clearSession() {
  localStorage.removeItem("userSession")
}

function isLoggedIn() {
  return getSession() !== null
}

// Update navigation based on login status
function updateNavigation() {
  console.log("🔄 Updating navigation...")

  const session = getSession()
  const adminSession = getAdminSession()
  const navMenu = document.querySelector(".nav-menu")

  console.log("Session:", session ? "User logged in" : "No user session")
  console.log("Admin session:", adminSession ? "Admin logged in" : "No admin session")

  if (!navMenu) {
    console.log("❌ Nav menu not found")
    return
  }

  // Limpar todos os botões de logout e links admin existentes
  const existingLogoutBtns = navMenu.querySelectorAll("#logoutBtn, #adminLogoutBtn")
  existingLogoutBtns.forEach((btn) => {
    if (btn.parentElement) {
      btn.parentElement.remove()
    }
  })

  const existingAdminLinks = navMenu.querySelectorAll('a[href="admin.html"]')
  existingAdminLinks.forEach((link) => {
    if (link.parentElement && !link.classList.contains("active")) {
      link.parentElement.remove()
    }
  })

  // Se é admin logado
  if (adminSession) {
    console.log("👨‍💼 Setting up admin navigation")

    // Remover ou modificar link de login
    const loginLink = navMenu.querySelector('a[href="login.html"]')
    if (loginLink && loginLink.parentElement) {
      loginLink.parentElement.remove()
    }

    // Verificar se já existe link para admin panel (que não seja o ativo)
    const existingAdminPanel = navMenu.querySelector('a[href="admin.html"]:not(.active)')

    if (!existingAdminPanel) {
      // Criar link para dashboard admin apenas se não estiver na página admin
      if (!window.location.pathname.includes("admin.html")) {
        const adminItem = document.createElement("li")
        adminItem.className = "nav-item"
        adminItem.innerHTML = `
          <a href="admin.html" class="nav-link" style="color: #d4af37;">
            <i class="fas fa-user-shield"></i> Admin Panel
          </a>
        `
        // Inserir antes do último item (Book a Table)
        const bookTableItem = navMenu.querySelector('a[href="reservations.html"].btn-primary')?.parentElement
        if (bookTableItem) {
          navMenu.insertBefore(adminItem, bookTableItem)
        } else {
          navMenu.appendChild(adminItem)
        }
      }
    }

    // Adicionar logout de admin
    const logoutItem = document.createElement("li")
    logoutItem.className = "nav-item"
    logoutItem.innerHTML = `
      <a href="#" id="logoutBtn" class="nav-link btn-outline">
        <i class="fas fa-sign-out-alt"></i> Logout Admin
      </a>
    `
    // Inserir antes do último item (Book a Table)
    const bookTableItem = navMenu.querySelector('a[href="reservations.html"].btn-primary')?.parentElement
    if (bookTableItem) {
      navMenu.insertBefore(logoutItem, bookTableItem)
    } else {
      navMenu.appendChild(logoutItem)
    }

    // Adicionar evento de logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault()
      adminLogout()
    })

    console.log("✅ Admin navigation setup complete")
  }
  // Se é usuário comum logado
  else if (session) {
    console.log("👤 Setting up user navigation")

    // Modificar link de login para dashboard
    const loginLink = navMenu.querySelector('a[href="login.html"]')
    if (loginLink) {
      loginLink.textContent = "Dashboard"
      loginLink.href = "dashboard.html"
      loginLink.classList.remove("btn-outline")
      loginLink.classList.add("nav-link")
    }

    // Adicionar logout de usuário
    const logoutItem = document.createElement("li")
    logoutItem.className = "nav-item"
    logoutItem.innerHTML = `
      <a href="#" id="logoutBtn" class="nav-link btn-outline">
        <i class="fas fa-sign-out-alt"></i> Logout
      </a>
    `
    // Inserir antes do último item (Book a Table)
    const bookTableItem = navMenu.querySelector('a[href="reservations.html"].btn-primary')?.parentElement
    if (bookTableItem) {
      navMenu.insertBefore(logoutItem, bookTableItem)
    } else {
      navMenu.appendChild(logoutItem)
    }

    // Adicionar evento de logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })

    console.log("✅ User navigation setup complete")
  } else {
    console.log("👥 Setting up guest navigation - keeping default login link")
  }
}

function adminLogout() {
  console.log("🚪 Admin logout")
  localStorage.removeItem("adminToken")
  localStorage.removeItem("adminData")
  window.location.href = "admin-login.html"
}

function logout() {
  console.log("🚪 User logout")
  clearSession()
  window.location.href = "index.html"
}

// Função para ser chamada quando o estado de login muda
function refreshNavigation() {
  updateNavigation()
}

// Expor função globalmente para uso em outras páginas
window.refreshNavigation = refreshNavigation
