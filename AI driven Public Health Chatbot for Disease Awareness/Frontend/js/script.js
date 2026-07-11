// Modal controls
  function openModal(type) {
    document.getElementById(type+'Modal').classList.add('open');
  }
  function closeModal(type) {
    document.getElementById(type+'Modal').classList.remove('open');
  }
  function switchModal(from, to) {
    closeModal(from); openModal(to);
  }
  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
    }
  });
  
  function fakeRegister() {
    closeModal('register');
    alert('Account created! Verification email sent. (Connects to POST /api/auth/register)');
  }

  // Chatbot popup
  function openChat() {
    document.getElementById('chatPopup').classList.add('open');
  }
  function closeChat() {
    document.getElementById('chatPopup').classList.remove('open');
  }

  // Chip toggle
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Simple demo responses
  const responses = {
    dengue: "Dengue symptoms include high fever, severe headache, rash, and joint pain. Prevent it by eliminating standing water and using mosquito repellent.",
    covid: "COVID-19 symptoms include fever, cough, fatigue, and loss of taste/smell. Vaccination, masking, and hand hygiene are the best preventive measures.",
    malaria: "Malaria causes fever, chills, and flu-like symptoms. It's transmitted by Anopheles mosquitoes. Use bed nets and antimalarial medication in high-risk areas.",
    fever: "Fever can indicate infections, inflammation, or other conditions. Stay hydrated, rest, and consult a doctor if temperature exceeds 103°F (39.4°C).",
    headache: "Headaches can result from dehydration, stress, infections, or underlying conditions. Drink water, rest, and see a doctor for persistent or severe headaches.",
    vaccine: "Vaccination is one of the most effective ways to prevent infectious diseases. Consult your local health authority for current vaccination schedules.",
    default: "I can help you with information about diseases, symptoms, prevention, and health guidance. Please note I'm for awareness only — always consult a doctor for medical advice."
  };

  function getResponse(msg) {
    const m = msg.toLowerCase();
    if (m.includes('dengue')) return responses.dengue;
    if (m.includes('covid') || m.includes('corona')) return responses.covid;
    if (m.includes('malaria')) return responses.malaria;
    if (m.includes('fever')) return responses.fever;
    if (m.includes('headache') || m.includes('head')) return responses.headache;
    if (m.includes('vaccine') || m.includes('vaccination')) return responses.vaccine;
    return responses.default;
  }

  function addMessage(container, text, isUser) {
    const div = document.createElement('div');
    div.className = 'msg ' + (isUser ? 'msg-user' : 'msg-bot');
    div.style.maxWidth = '90%';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

 async function sendChat() {

    const input = document.getElementById("cpInput");
    const msgs = document.getElementById("cpMessages");

    const text = input.value.trim();

    if (!text) return;

    addMessage(msgs, text, true);

    input.value = "";

    const typingDiv = document.createElement("div");
    typingDiv.className = "msg msg-bot typing";
    typingDiv.id = "typing-indicator";
    typingDiv.innerHTML = "🤖 <span></span><span></span><span></span>";

    msgs.appendChild(typingDiv);
    msgs.scrollTop = msgs.scrollHeight;

   try {

    const user = JSON.parse(localStorage.getItem("user"));
    console.log("Logged in user:", user);

    const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: text,
            email: user ? user.email : null
        })
    });

    const data = await response.json();

    const typing = document.getElementById("typing-indicator");
    if (typing) typing.remove();

    addMessage(msgs, data.response, false);

} catch (error) {

    const typing = document.getElementById("typing-indicator");
    if (typing) typing.remove();

    console.error("Chat Error:", error);

    addMessage(msgs, "Unable to connect to backend.", false);
}
}

 async function heroSend() {

    const input = document.getElementById("hero-input");

    const text = input.value.trim();

    if (!text) return;

    input.value = "";

    openChat();

    const msgs = document.getElementById("cpMessages");

    addMessage(msgs, text, true);

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const response = await fetch("http://127.0.0.1:5000/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: text
            })

        });

        const data = await response.json();

        addMessage(msgs, data.response, false);

    } catch (error) {

        addMessage(msgs, "Unable to connect to backend.", false);

        console.error(error);

    }

}
function quickAsk(question) {

    document.getElementById("cpInput").value = question;

    sendChat();

}
function toggleTheme() {

    document.body.classList.toggle("dark-mode");

    const btn = document.getElementById("themeToggle");

    if(document.body.classList.contains("dark-mode")){
        btn.innerHTML = "☀️";
        localStorage.setItem("theme","dark");
    }else{
        btn.innerHTML = "🌙";
        localStorage.setItem("theme","light");
    }
}


// Load saved theme
window.onload = function(){

    if(localStorage.getItem("theme") === "dark"){
        document.body.classList.add("dark-mode");
        document.getElementById("themeToggle").innerHTML="☀️";
    }

}
window.onload = function(){

    if(localStorage.getItem("theme") === "dark"){
        document.body.classList.add("dark-mode");

        const btn = document.getElementById("themeToggle");
        if(btn){
            btn.innerHTML = "☀️";
        }
    }

}
async function registerUser(){

    const fullname = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    if(!fullname || !email || !password){
        alert("Please fill all fields.");
        return;
    }

    try{

        const response = await fetch("http://127.0.0.1:5000/register",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                fullname,
                email,
                password
            })

        });

        const data = await response.json();

        alert(data.message);

        if(data.success){

            closeModal("register");

            document.getElementById("regName").value="";
            document.getElementById("regEmail").value="";
            document.getElementById("regPassword").value="";
        }

    }catch(error){

        console.error(error);

        alert("Unable to connect to server.");

    }

}
async function loginUser() {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please fill all fields.");
        return;
    }

    try {

        const response = await fetch("http://127.0.0.1:5000/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await response.json();

        alert(data.message);

        if (data.success) {

    localStorage.setItem("user", JSON.stringify(data));

    closeModal("login");

    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";

    updateNavbar();
}

    } catch (error) {

        console.error(error);
        alert("Unable to connect to server.");

    }

}
function updateNavbar() {

    const user = JSON.parse(localStorage.getItem("user"));

    const nav = document.getElementById("navCTA");

    if (!nav) return;

    if (user) {
    nav.innerHTML = `
    <span style="color:white;font-weight:600;margin-right:15px;">
        👋 ${user.fullname}
    </span>

    <a class="btn-outline"
       href="#"
       onclick="openProfile()">
       Profile
    </a>

    <a class="btn-outline"
       href="#"
       onclick="logoutUser()">
       Logout
    </a>
`;

    } else {

        nav.innerHTML = `
            <a class="btn-outline" href="#" onclick="openModal('login')">
                Sign In
            </a>

            <a class="btn-primary" href="#" onclick="openModal('register')">
                Get Started
            </a>
        `;

    }

}

function logoutUser() {

    localStorage.removeItem("user");

    updateNavbar();

    alert("Logged out successfully.");

}
updateNavbar();
function openProfile(){

    const user = JSON.parse(localStorage.getItem("user"));

    if(!user){

        alert("Please login first.");

        return;

    }

    document.getElementById("profileName").textContent =
        user.fullname;

    document.getElementById("profileEmail").textContent =
        user.email;

    openModal("profile");

}