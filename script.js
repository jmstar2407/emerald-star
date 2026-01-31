// Variables globales
let selectedDay = null;
let selectedTime = null;
let existingReservation = null;

// Referencias a elementos del DOM
const reservationInfo = document.getElementById('reservation-info');
const calendarSection = document.getElementById('calendar-section');
const calendarGrid = document.getElementById('calendar');

// Elementos del modal de reserva
const reservationModal = document.getElementById('reservation-modal');
const modalSelectedDate = document.getElementById('modal-selected-date');
const modalTimeSlots = document.getElementById('modal-time-slots');
const confirmReservationBtn = document.getElementById('confirm-reservation-btn');
const backToCalendarBtn = document.getElementById('back-to-calendar');

// Elementos de información de reserva
const reservationDate = document.getElementById('reservation-date');
const reservationTime = document.getElementById('reservation-time');
const reservationMessage = document.getElementById('reservation-message');

// Datos iniciales para febrero 2025
const FEBRUARY_2025 = {
    month: 1,
    year: 2025,
    firstDay: 6 // 1 de febrero de 2025 es sábado
};

// Mensajes románticos para mostrar
const romanticMessages = [
    "Los mejores momentos no se planifican, simplemente suceden cuando dos corazones laten al mismo ritmo",
    "Esta fecha quedará marcada en mi corazón como el inicio de algo maravilloso",
    "Algunos días son especiales porque están hechos para ser compartidos contigo",
    "El tiempo pasa, pero los momentos especiales con personas especiales permanecen para siempre",
    "Esta reserva no es solo para una cita, es para el comienzo de nuestra historia"
];

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    checkExistingReservation();
});

// Event Listeners
function initEventListeners() {
    // Botones del modal de reserva
    if (confirmReservationBtn) {
        confirmReservationBtn.addEventListener('click', confirmReservation);
    }
    
    if (backToCalendarBtn) {
        backToCalendarBtn.addEventListener('click', () => {
            reservationModal.classList.add('hidden');
        });
    }
    
    // Cerrar modal haciendo clic fuera
    if (reservationModal) {
        reservationModal.addEventListener('click', (e) => {
            if (e.target === reservationModal) {
                reservationModal.classList.add('hidden');
            }
        });
    }
    
    // Cerrar modal genérico
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('generic-modal').classList.add('hidden');
        });
    }
    
    const genericModal = document.getElementById('generic-modal');
    if (genericModal) {
        genericModal.addEventListener('click', (e) => {
            if (e.target === genericModal) {
                genericModal.classList.add('hidden');
            }
        });
    }
}

// Verificar si ya existe una reserva
async function checkExistingReservation() {
    try {
        const querySnapshot = await db.collection("reserva")
            .where("estado", "==", "confirmada")
            .orderBy("timestamp", "desc")
            .limit(1)
            .get();
        
        if (!querySnapshot.empty) {
            // Hay una reserva existente
            existingReservation = querySnapshot.docs[0].data();
            showReservationInfo(existingReservation);
            
            // Ocultar calendario y mostrar solo información de reserva
            reservationInfo.classList.remove('hidden');
            calendarSection.classList.add('hidden');
            
        } else {
            // No hay reserva, mostrar calendario
            reservationInfo.classList.add('hidden');
            calendarSection.classList.remove('hidden');
            
            // Generar calendario
            generateCalendar();
            loadAvailableDays();
        }
    } catch (error) {
        console.error("Error al verificar reserva existente:", error);
        // En caso de error, mostrar calendario
        reservationInfo.classList.add('hidden');
        calendarSection.classList.remove('hidden');
        generateCalendar();
        loadAvailableDays();
    }
}

// Mostrar información de reserva existente
function showReservationInfo(reservation) {
    // Actualizar información de fecha y hora
    if (reservationDate) {
        reservationDate.textContent = reservation.fecha || `${reservation.diaNumerico || '7'} de Febrero 2025`;
    }
    
    if (reservationTime) {
        reservationTime.textContent = reservation.hora || "7:00 PM";
    }
    
    // Seleccionar un mensaje romántico aleatorio
    if (reservationMessage) {
        const randomMessage = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];
        reservationMessage.textContent = `"${randomMessage}"`;
    }
}

// Generar calendario de febrero
function generateCalendar() {
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Espacios vacíos para los primeros días
    for (let i = 0; i < FEBRUARY_2025.firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Generar los días del mes (febrero tiene 28 días)
    for (let day = 1; day <= 28; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        dayElement.dataset.day = day;
        
        // Agregar event listener
        dayElement.addEventListener('click', () => handleDayClick(day));
        
        calendarGrid.appendChild(dayElement);
    }
}

// Manejar clic en un día del calendario
async function handleDayClick(day) {
    const dayElement = document.querySelector(`.calendar-day[data-day="${day}"]`);
    
    // Verificar si el día está disponible
    if (!dayElement.classList.contains('available')) {
        showModal("Día no disponible", 
            "Este día no está disponible para reservar.<br>Por favor, elige otro día especial.");
        return;
    }
    
    // Deseleccionar día anterior
    document.querySelectorAll('.calendar-day').forEach(element => {
        element.classList.remove('selected');
    });
    
    // Seleccionar nuevo día
    dayElement.classList.add('selected');
    selectedDay = day;
    
    // Cargar horas disponibles desde Firebase
    try {
        const doc = await db.collection("reserva").doc("diasdereservas").get();
        
        if (doc.exists) {
            const data = doc.data();
            const hours = data.horas || ["7:00 PM", "8:00 PM", "8:30 PM", "9:00 PM"];
            showReservationModal(day, hours);
        } else {
            // Horas por defecto
            const defaultHours = ["7:00 PM", "8:00 PM", "8:30 PM", "9:00 PM"];
            showReservationModal(day, defaultHours);
        }
    } catch (error) {
        console.error("Error al cargar horas:", error);
        const defaultHours = ["7:00 PM", "8:00 PM", "8:30 PM", "9:00 PM"];
        showReservationModal(day, defaultHours);
    }
}

// Mostrar modal de reserva
function showReservationModal(day, hours) {
    if (!modalSelectedDate || !modalTimeSlots || !reservationModal) return;
    
    // Actualizar fecha en el modal
    modalSelectedDate.innerHTML = `<p>${day} de Febrero</p>`;
    
    // Limpiar y crear slots de hora
    modalTimeSlots.innerHTML = '';
    selectedTime = null;
    
    hours.forEach(hour => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'modal-time-slot';
        timeSlot.textContent = hour;
        timeSlot.dataset.time = hour;
        
        timeSlot.addEventListener('click', () => {
            document.querySelectorAll('.modal-time-slot').forEach(slot => {
                slot.classList.remove('selected');
            });
            
            timeSlot.classList.add('selected');
            selectedTime = hour;
            
            timeSlot.style.transform = 'scale(0.95)';
            setTimeout(() => {
                timeSlot.style.transform = 'scale(1)';
            }, 150);
        });
        
        modalTimeSlots.appendChild(timeSlot);
    });
    
    // Mostrar modal
    reservationModal.classList.remove('hidden');
}

// Confirmar reserva
async function confirmReservation() {
    if (!selectedDay || !selectedTime) {
        showModal("Selección incompleta", 
            "Por favor, selecciona una hora para nuestra cita especial.");
        return;
    }
    
    try {
        // Crear objeto de reserva
        const reservation = {
            fecha: `${selectedDay} de Febrero 2025`,
            hora: selectedTime,
            estado: "confirmada",
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            diaNumerico: selectedDay
        };
        
        // Guardar en Firestore
        await db.collection("reserva").add(reservation);
        
        // Cerrar modal
        reservationModal.classList.add('hidden');
        
        // Mostrar mensaje de confirmación
        showModal("¡Reserva Confirmada!", 
            `Nuestra cita especial ha sido reservada para el <strong>${selectedDay} de Febrero</strong> a las <strong>${selectedTime}</strong>.<br><br>
            <span style="font-style: italic; color: #7f8c8d;">"Este momento ya está guardado en mi corazón"</span>`);
        
        // Actualizar la vista para mostrar la reserva
        setTimeout(() => {
            checkExistingReservation();
        }, 2000);
        
    } catch (error) {
        console.error("Error al guardar reserva:", error);
        showModal("Error", 
            "No se pudo completar la reserva. Por favor, intenta de nuevo.");
    }
}

// Cargar días disponibles desde Firebase
async function loadAvailableDays() {
    if (!calendarGrid) return;
    
    try {
        const doc = await db.collection("reserva").doc("diasdereservas").get();
        
        if (doc.exists) {
            const data = doc.data();
            const availableDays = data.dias || [];
            
            // Marcar días disponibles
            document.querySelectorAll('.calendar-day:not(.empty)').forEach(dayElement => {
                const day = parseInt(dayElement.dataset.day);
                
                if (availableDays.includes(day)) {
                    dayElement.classList.add('available');
                } else {
                    dayElement.classList.add('disabled');
                    dayElement.style.pointerEvents = 'none';
                    dayElement.style.opacity = '1';
                }
            });
        } else {
            // Todos los días disponibles por defecto
            document.querySelectorAll('.calendar-day:not(.empty)').forEach(dayElement => {
                dayElement.classList.add('available');
            });
        }
    } catch (error) {
        console.error("Error al cargar días disponibles:", error);
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(dayElement => {
            dayElement.classList.add('available');
        });
    }
}

// Mostrar modal genérico
function showModal(title, content) {
    let modal = document.getElementById('generic-modal');
    if (!modal) return;
    
    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <h3>${title}</h3>
        <div class="modal-content-inner">
            ${content}
        </div>
    `;
    
    modal.classList.remove('hidden');
}