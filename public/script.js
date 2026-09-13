const UPI_ID = "sunnypro@fam"; 
const UPI_NAME = "Sunny Kumar";
const TIME_LIMIT = 10 * 60 * 1000; 

let currentData = { method: null, amount: 0, note: "", time: 0, invoiceId: null, paymentUrl: null };
let timerInterval = null;
let pollingInterval = null;

// LOAD PERSISTENT STATE ON REFRESH (Fixed Blank Screen Issue)
window.onload = () => {
    const saved = localStorage.getItem("nexaActiveTxn");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const timePassed = Date.now() - parsed.time;
            if (timePassed < TIME_LIMIT) {
                currentData = parsed;
                // Let switchStep safely handle the transition without crashing
                if (currentData.method === "upi") { 
                    showUpiScreen(TIME_LIMIT - timePassed); 
                } else if (currentData.method === "payzy") { 
                    showPayzyScreen(TIME_LIMIT - timePassed); 
                }
            } else {
                localStorage.removeItem("nexaActiveTxn");
            }
        } catch (e) {
            localStorage.removeItem("nexaActiveTxn");
        }
    }
};

// Safely Switch Between Screens
function switchStep(fromId, toId) {
    const fromEl = fromId ? document.getElementById(fromId) : null;
    const toEl = document.getElementById(toId);
    
    if (fromEl) {
        fromEl.classList.remove("active");
        setTimeout(() => {
            fromEl.style.display = "none";
            if (toEl) {
                toEl.style.display = "flex";
                setTimeout(() => toEl.classList.add("active"), 30);
            }
        }, 400); 
    } else if (toEl) {
        toEl.style.display = "flex";
        setTimeout(() => toEl.classList.add("active"), 30);
    }
}

function selectMethod(method) {
    currentData.method = method;
    switchStep("step0", "step1");
}

function generatePayment() {
    const amt = document.getElementById("customAmountInput").value;
    if (!amt || amt <= 0) { alert("Please enter a valid amount!"); return; }

    currentData.amount = parseFloat(amt);
    currentData.note = "SK" + Math.floor(10000 + Math.random() * 90000); 
    currentData.time = Date.now();
    
    const activeStep = document.querySelector(".step-container.active");
    switchStep(activeStep ? activeStep.id : "step1", "stepLoading");

    if (currentData.method === "upi") {
        setTimeout(() => {
            saveData();
            showUpiScreen(TIME_LIMIT);
        }, 1500);
    } else if (currentData.method === "payzy") {
        createPayzyInvoice();
    }
}

// ----------------- UPI LOGIC -----------------
function showUpiScreen(durationMs) {
    const activeStep = document.querySelector(".step-container.active");
    switchStep(activeStep ? activeStep.id : "step0", "stepUpi");
    
    document.getElementById("amountDisplayUpi").innerText = "₹" + currentData.amount;

    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${currentData.amount}&tn=${currentData.note}&tr=${currentData.note}&cu=INR`;
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), { 
        text: upiUrl, width: 180, height: 180, colorDark : "#000000", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H 
    });

    startTimer(durationMs, "timeRemainingUpi");
    pollingInterval = setInterval(autoCheckUpi, 5000);
}

async function autoCheckUpi() {
    try {
        const response = await fetch(`/api/fetch?note=${currentData.note}`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            const verifiedTxn = result.data.find(txn => 
                txn.type === "Credit" && parseFloat(txn.amount) === currentData.amount && txn.purpose.includes(currentData.note)
            );
            if (verifiedTxn) { paymentSuccess(verifiedTxn.amount, verifiedTxn.name, "stepUpi"); }
        }
    } catch (e) {}
}

// ----------------- PAYZY LOGIC -----------------
async function createPayzyInvoice() {
    try {
        const response = await fetch(`/api/payzy/create?amount=${currentData.amount}&order_id=${currentData.note}`);
        const result = await response.json();
        
        if (result.status === "success" && result.invoice_id) {
            currentData.invoiceId = result.invoice_id;
            currentData.paymentUrl = result.payment_url;
            saveData();
            showPayzyScreen(TIME_LIMIT);
        } else {
            alert("Error creating Payzy invoice");
            cancelPayment();
        }
    } catch (error) {
        alert("Server error connecting to Payzy.");
        cancelPayment();
    }
}

function showPayzyScreen(durationMs) {
    const activeStep = document.querySelector(".step-container.active");
    switchStep(activeStep ? activeStep.id : "step0", "stepPayzy");
    
    document.getElementById("amountDisplayPayzy").innerText = "₹" + currentData.amount;
    startTimer(durationMs, "timeRemainingPayzy");
}

function openPayzy() {
    if (currentData.paymentUrl) {
        window.open(currentData.paymentUrl, "_blank");
    }
}

async function verifyPayzyPayment() {
    const btn = document.getElementById("verifyPayzyBtn");
    const originalText = btn.innerText;
    btn.innerText = "Verifying...";
    
    try {
        const response = await fetch(`/api/payzy/status?invoice_id=${currentData.invoiceId}`);
        const result = await response.json();
        
        btn.innerText = originalText;

        if (result.inv_status === "paid" || result.status === "success") {
            paymentSuccess(result.amount || currentData.amount, result.payer_mobile || "Verified Payzy User", "stepPayzy");
        } else {
            document.getElementById('errorOverlay').style.display = 'flex';
        }
    } catch (e) {
        btn.innerText = originalText;
        document.getElementById('errorOverlay').style.display = 'flex';
    }
}

// ----------------- COMMON LOGIC -----------------
function saveData() { 
    localStorage.setItem("nexaActiveTxn", JSON.stringify(currentData)); 
}

function startTimer(durationMs, elementId) {
    if (timerInterval) clearInterval(timerInterval);
    
    let timeLeft = Math.floor(durationMs / 1000);
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            cancelPayment(); 
            alert("Payment session expired!");
            return;
        }
        let m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        let s = (timeLeft % 60).toString().padStart(2, '0');
        const el = document.getElementById(elementId);
        if (el) el.innerText = `${m}:${s}`;
        timeLeft--;
    }, 1000);
}

function paymentSuccess(amt, name, currentStepId) {
    clearInterval(timerInterval);
    clearInterval(pollingInterval);
    localStorage.removeItem("nexaActiveTxn");
    
    document.getElementById("s_amt").innerText = "₹" + amt;
    document.getElementById("s_name").innerText = name;
    
    const now = new Date();
    document.getElementById("s_time").innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    switchStep(currentStepId, "stepSuccess");
}

function cancelPayment() {
    clearInterval(timerInterval);
    clearInterval(pollingInterval);
    localStorage.removeItem("nexaActiveTxn");
    
    currentData = { method: null, amount: 0, note: "", time: 0, invoiceId: null, paymentUrl: null };
    document.getElementById("customAmountInput").value = "";
    document.getElementById('errorOverlay').style.display = 'none';
    
    const activeStep = document.querySelector(".step-container.active");
    switchStep(activeStep ? activeStep.id : "stepPayzy", "step0"); // Navigate back to method selection
}

function resetGateway() { 
    cancelPayment(); 
}
