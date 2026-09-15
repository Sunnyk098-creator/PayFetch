const UPI_ID = "sunnypro@fam"; 
const UPI_NAME = "Sunny Kumar";
const TIME_LIMIT = 10 * 60 * 1000; 

let currentAmount = 0;
let currentNote = "";
let timerInterval = null;
let pollingInterval = null;
let selectedMethod = "upi"; // Tracks user selection

function switchStep(fromId, toId) {
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    
    fromEl.classList.remove("active");
    setTimeout(() => {
        fromEl.style.display = "none";
        toEl.style.display = "flex";
        // Chhota delay taaki display flex apply ho jaye animation se pehle
        setTimeout(() => toEl.classList.add("active"), 30);
    }, 400); 
}

// Set selected method and move to enter amount screen
function selectMethod(method) {
    selectedMethod = method;
    switchStep("step0", "step1");
}

function generatePayment() {
    const amt = document.getElementById("customAmountInput").value;
    if (!amt || amt <= 0) { alert("Please enter a valid amount!"); return; }

    currentAmount = parseFloat(amt);
    currentNote = "SK" + Math.floor(10000 + Math.random() * 90000); 
    
    if (selectedMethod === "upi") {
        // Standard UPI Flow
        switchStep("step1", "stepLoading");
        setTimeout(() => {
            showQRScreen(TIME_LIMIT);
        }, 1500);
    } else if (selectedMethod === "payzy") {
        // Payzy API Flow
        switchStep("step1", "stepPayzyInstructions");
        // User gets 3.5 seconds to read instructions before redirect
        setTimeout(() => {
            processPayzyPayment(currentAmount, currentNote);
        }, 3500); 
    }
}

// Function to call secure backend API and redirect
async function processPayzyPayment(amount, orderId) {
    try {
        const response = await fetch(`/api/payzy/create?amount=${amount}&order_id=${orderId}`);
        const result = await response.json();

        if (result.status === "success" && result.payment_url) {
            window.location.href = result.payment_url; // Redirect to external URL
        } else {
            alert("Failed to create Payzy link. Server may be down.");
            switchStep("stepPayzyInstructions", "step1");
        }
    } catch (error) {
        console.error("Error generating Payzy link:", error);
        alert("Something went wrong!");
        switchStep("stepPayzyInstructions", "step1");
    }
}

function showQRScreen(durationMs) {
    switchStep("stepLoading", "step2");
    document.getElementById("amountDisplay").innerText = "₹" + currentAmount;

    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${currentAmount}&tn=${currentNote}&tr=${currentNote}&cu=INR`;
    
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), { 
        text: upiUrl, width: 180, height: 180, 
        colorDark : "#000000", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H 
    });

    startTimer(durationMs);
    pollingInterval = setInterval(autoCheckPayment, 5000);
}

function startTimer(durationMs) {
    let timeLeft = Math.floor(durationMs / 1000);
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            cancelPayment(); 
            alert("Payment session expired!");
            return;
        }
        let m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        let s = (timeLeft % 60).toString().padStart(2, '0');
        document.getElementById("timeRemaining").innerText = `${m}:${s}`;
        timeLeft--;
    }, 1000);
}

async function autoCheckPayment() {
    try {
        const response = await fetch(`/api/fetch?note=${currentNote}`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            const verifiedTxn = result.data.find(txn => 
                txn.type === "Credit" && 
                parseFloat(txn.amount) === currentAmount && 
                txn.purpose.includes(currentNote)
            );

            if (verifiedTxn) {
                clearInterval(timerInterval);
                clearInterval(pollingInterval);
                
                document.getElementById("s_amt").innerText = "₹" + verifiedTxn.amount;
                document.getElementById("s_name").innerText = verifiedTxn.name || "Verified User";
                
                const now = new Date();
                document.getElementById("s_time").innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                switchStep("step2", "step3");
            }
        }
    } catch (error) {
        console.log("Checking payment status...");
    }
}

function cancelPayment() {
    clearInterval(timerInterval);
    clearInterval(pollingInterval);
    currentAmount = 0; currentNote = "";
    document.getElementById("customAmountInput").value = "";
    // Send them back to selection screen on cancel
    switchStep("step2", "step0"); 
}

function resetGateway() {
    document.getElementById("customAmountInput").value = "";
    // Send them back to selection screen on finish
    switchStep("step3", "step0");
}
