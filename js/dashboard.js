document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Dashboard carregado")

  // Check if user is logged in
  if (!isLoggedIn()) {
    console.log("❌ Usuário não logado, redirecionando...")
    window.location.href = "login.html"
    return
  }

  console.log("✅ Usuário logado, carregando dados...")

  // Load user data and reservations
  loadUserData()
  loadReservations()

  // Setup logout functionality
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })
  }
})

async function loadUserData() {
  console.log("=== CARREGANDO DADOS DO USUÁRIO ===")

  try {
    const session = getSession()
    console.log("Sessão encontrada:", session ? "Sim" : "Não")
    console.log("Dados da sessão:", session)

    // Se temos dados da sessão, usar eles primeiro
    if (session && session.user) {
      console.log("Usando dados da sessão:", session.user)
      updateUserDisplay(session.user)
    }

    // Tentar buscar dados atualizados do servidor apenas se temos token
    if (session && session.token) {
      console.log("Buscando dados atualizados do servidor...")
      console.log("Token:", session.token.substring(0, 20) + "...")

      const response = await fetch("/api/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Status da resposta:", response.status)
      console.log("Content-Type:", response.headers.get("content-type"))

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          console.log("Dados recebidos do servidor:", data)

          if (data.success) {
            updateUserDisplay(data.user)

            // Atualizar a sessão com dados mais recentes
            setSession({
              ...session,
              user: data.user,
            })
            console.log("✅ Dados do usuário atualizados com sucesso")
          }
        } else {
          console.log("⚠️ Resposta não é JSON, usando dados da sessão")
        }
      } else {
        console.log("❌ Erro na resposta:", response.status, response.statusText)
        const errorText = await response.text()
        console.log("Texto do erro:", errorText)
      }
    } else {
      console.log("⚠️ Sem token de autenticação, usando apenas dados da sessão")
    }
  } catch (error) {
    console.error("❌ Erro ao carregar dados do usuário:", error)

    // Fallback para dados da sessão se a API falhar
    const session = getSession()
    if (session && session.user) {
      console.log("📋 Usando fallback - dados da sessão")
      updateUserDisplay(session.user)
    } else {
      console.log("❌ Nenhum dado disponível, redirecionando para login")
      window.location.href = "login.html"
    }
  }
}

function updateUserDisplay(user) {
  console.log("Atualizando display do usuário:", user)

  // Update user information
  const nameElement = document.getElementById("user-name")
  const emailElement = document.getElementById("user-email")
  const memberSinceElement = document.getElementById("member-since")

  if (nameElement) {
    nameElement.textContent = user.name || "Nome não disponível"
    console.log("Nome atualizado:", nameElement.textContent)
  }

  if (emailElement) {
    emailElement.textContent = user.email || "Email não disponível"
    console.log("Email atualizado:", emailElement.textContent)
  }

  if (memberSinceElement) {
    if (user.created_at) {
      try {
        // Formatar a data de criação
        const createdDate = new Date(user.created_at)
        const formattedDate = createdDate.toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        memberSinceElement.textContent = formattedDate
        console.log("Data formatada:", formattedDate)
      } catch (error) {
        console.error("Erro ao formatar data:", error)
        memberSinceElement.textContent = "Data não disponível"
      }
    } else {
      // Fallback se não temos a data
      memberSinceElement.textContent = "Membro recente"
      console.log("Usando fallback para data de criação")
    }
  }
}

async function loadReservations() {
  console.log("=== CARREGANDO RESERVAS ===")

  try {
    const session = getSession()
    console.log("Sessão para reservas:", session ? "Encontrada" : "Não encontrada")

    if (!session || !session.token) {
      throw new Error("No authentication token")
    }

    console.log("Token para reservas:", session.token.substring(0, 20) + "...")
    console.log("User ID da sessão:", session.user?.id)

    console.log("Fazendo requisição para /api/reservations...")
    const response = await fetch("/api/reservations", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Status da resposta das reservas:", response.status)
    console.log("Headers da resposta:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log("Texto do erro:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    console.log("Content-Type das reservas:", contentType)

    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text()
      console.log("Resposta não-JSON:", responseText)
      throw new Error("Response is not JSON")
    }

    const data = await response.json()
    console.log("Dados das reservas recebidos:", data)

    if (data.success) {
      console.log("Número de reservas:", data.reservations.length)
      displayReservations(data.reservations)
      console.log("✅ Reservas carregadas com sucesso")
    } else {
      console.log("❌ API retornou success: false")
      throw new Error(data.message || "Failed to load reservations")
    }
  } catch (error) {
    console.error("❌ Erro ao carregar reservas:", error)
    displayReservationsError(error.message)
  }
}

function displayReservations(reservations) {
  const container = document.getElementById("reservations-list")

  if (!container) {
    console.error("❌ Container de reservas não encontrado!")
    return
  }

  console.log("📋 Exibindo", reservations.length, "reservas")
  console.log("Detalhes das reservas:", reservations)

  if (reservations.length === 0) {
    console.log("Nenhuma reserva encontrada, mostrando mensagem padrão")
    container.innerHTML = `
      <div class="text-center" style="padding: 2rem;">
        <p>You don't have any reservations yet.</p>
        <a href="reservations.html" class="btn btn-primary" style="margin-top: 1rem;">Make a Reservation</a>
      </div>
    `
    return
  }

  // Traduzir status para exibição
  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmed"
      case "pending":
        return "Pending"
      case "cancelled":
        return "Cancelled"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  // Formatar data para exibição
  const formatDisplayDate = (dateString) => {
    console.log("Formatando data:", dateString)
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const tableHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Guests</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${reservations
          .map((reservation) => {
            console.log("Renderizando reserva:", reservation)
            return `
          <tr>
            <td>${formatDisplayDate(reservation.date)}</td>
            <td>${reservation.time}</td>
            <td>${reservation.guests}</td>
            <td>
              <span class="status-badge status-${reservation.status}">
                ${getStatusText(reservation.status)}
              </span>
            </td>
            <td>
              ${
                reservation.status !== "cancelled"
                  ? `<button class="btn btn-outline" onclick="cancelReservation('${reservation.id}')" style="padding: 0.5rem 1rem; font-size: 0.875rem;">Cancel</button>`
                  : "-"
              }
            </td>
          </tr>
        `
          })
          .join("")}
      </tbody>
    </table>
  `

  container.innerHTML = tableHTML
  console.log("✅ Tabela de reservas renderizada com sucesso")
}

function displayReservationsError(errorMessage) {
  const container = document.getElementById("reservations-list")
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load reservations: ${errorMessage}</p>
        <button onclick="loadReservations()" class="btn btn-primary" style="margin-top: 1rem;">Try Again</button>
      </div>
    `
  }
}

async function cancelReservation(reservationId) {
  if (!confirm("Are you sure you want to cancel this reservation?")) {
    return
  }

  try {
    const session = getSession()

    if (!session || !session.token) {
      throw new Error("No authentication token")
    }

    const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to cancel reservation")
    }

    // Reload reservations
    loadReservations()

    // Show success message
    alert("Reservation cancelled successfully.")
  } catch (error) {
    console.error("Failed to cancel reservation:", error)
    alert("Failed to cancel reservation. Please try again.")
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Utility functions from main.js
function getSession() {
  const session = localStorage.getItem("userSession")
  return session ? JSON.parse(session) : null
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

function logout() {
  clearSession()
  window.location.href = "index.html"
}
