const UPI_ID = "sunnypro@fam"; 
const UPI_NAME = "Sunny Kumar";
const TIME_LIMIT = 10 * 60 * 1000; 

let currentAmount = 0;
let currentNote = "";
let timerInterval = null;
let pollingInterval = null;

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

function generatePayment() {
    const amt = document.getElementById("customAmountInput").value;
    if (!amt || amt <= 0) { alert("Please enter a valid amount!"); return; }

    currentAmount = parseFloat(amt);
    currentNote = "SK" + Math.floor(10000 + Math.random() * 90000); 
    
    // Switch to Loading Screen first
    switchStep("step1", "stepLoading");

    // Wait 1.5 seconds then show QR Screen
    setTimeout(() => {
        showQRScreen(TIME_LIMIT);
    }, 1500);
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
    switchStep("step2", "step1");
}

function resetGateway() {
    document.getElementById("customAmountInput").value = "";
    switchStep("step3", "step1");
}
