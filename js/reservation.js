// Conteúdo do arquivo js/reservations.js
document.addEventListener("DOMContentLoaded", () => {
  const reservationForm = document.getElementById("reservationForm")

  if (reservationForm) {
    reservationForm.addEventListener("submit", handleReservationSubmit)
  }
})

async function handleReservationSubmit(e) {
  e.preventDefault()

  console.log("=== INICIANDO SUBMISSÃO DE RESERVA ===")

  const formData = new FormData(e.target)
  const reservationData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    guests: formData.get("guests"),
    date: formData.get("date"),
    time: formData.get("time"),
    specialRequests: formData.get("special-requests") || "",
  }

  console.log("Dados da reserva:", reservationData)

  // Validate form data
  if (!validateReservationData(reservationData)) {
    console.log("❌ Validação falhou")
    return
  }

  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalText = submitBtn.textContent
    submitBtn.textContent = "Enviando..."
    submitBtn.disabled = true

    // Hide any previous messages
    hideMessage("error-message")
    hideMessage("success-message")

    console.log("Enviando para API...")

    // Submit reservation
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reservationData),
    })

    console.log("Status da resposta:", response.status)

    const responseData = await response.json()
    console.log("Dados da resposta:", responseData)

    if (!response.ok) {
      throw new Error(responseData.message || "Erro ao enviar reserva")
    }

    // Show success message
    console.log("✅ Reserva enviada com sucesso!")
    showMessage("success-message")

    // Hide form and show success
    document.querySelector(".reservation-form").style.display = "none"

    // Reset form
    e.target.reset()
  } catch (error) {
    console.error("❌ Erro na submissão da reserva:", error)
    showMessage("error-message", error.message, true)
  } finally {
    // Reset button state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    if (submitBtn) {
      submitBtn.textContent = "Book Reservation"
      submitBtn.disabled = false
    }
  }
}

function validateReservationData(data) {
  console.log("Validando dados da reserva...")

  // Check required fields
  const requiredFields = ["name", "email", "phone", "guests", "date", "time"]

  for (const field of requiredFields) {
    if (!data[field] || data[field].trim() === "") {
      console.log(`❌ Campo obrigatório vazio: ${field}`)
      showMessage("error-message", `Por favor, preencha o campo ${field}.`, true)
      return false
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    console.log("❌ Email inválido")
    showMessage("error-message", "Por favor, insira um email válido.", true)
    return false
  }

  // Validate phone format (basic validation)
  const phoneRegex = /^[\d\s\-()]+$/
  if (!phoneRegex.test(data.phone) || data.phone.replace(/\D/g, "").length < 10) {
    console.log("❌ Telefone inválido")
    showMessage("error-message", "Por favor, insira um telefone válido.", true)
    return false
  }

  // Validate date is not in the past
  const selectedDate = new Date(data.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate < today) {
    console.log("❌ Data no passado")
    showMessage("error-message", "Por favor, selecione uma data futura.", true)
    return false
  }

  console.log("✅ Validação passou")
  return true
}

function hideMessage(messageId) {
  const messageElement = document.getElementById(messageId)
  if (messageElement) {
    messageElement.style.display = "none"
  }
}

function showMessage(messageId, message = "", isError = false) {
  const messageElement = document.getElementById(messageId)
  if (messageElement) {
    messageElement.style.display = "block"

    // Se há uma mensagem personalizada, atualize o texto
    if (message) {
      const messageText = messageElement.querySelector("p")
      if (messageText) {
        messageText.textContent = message
      }
    }

    // Auto-hide success messages after 5 seconds
    if (!isError) {
      setTimeout(() => {
        messageElement.style.display = "none"
      }, 5000)
    }
  }
}
