import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, addDoc, collection, onSnapshot, getDocs, query } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBuj50BXXv0lLiaF7vcQO993H6spoWrS7U",
    authDomain: "chat-30d66.firebaseapp.com",
    projectId: "chat-30d66",
    storageBucket: "chat-30d66.appspot.com",
    messagingSenderId: "349271227605",
    appId: "1:349271227605:web:9e890398de9eb8a52df65c",
    measurementId: "G-GP7T1C5YMZ"
};
const firebaseApp = initializeApp(firebaseConfig);
const firebaseFirestore = getFirestore(firebaseApp);
const firebaseAuth = getAuth(firebaseApp);

const loginButton = document.getElementById("loginButton");
const signUpButton = document.getElementById("signUpButton");
const usernameInput = document.getElementById("usernameInput");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const joinView = document.getElementById("joinView");
const chatsView = document.getElementById("chatsView");
let messageList = [];

let enteredUsername = "";
let isLoggedIn = false;

// Add event listener for sign-up
signUpButton.addEventListener("click", async () => {
    const enteredEmail = emailInput.value.trim();
    const enteredPassword = passwordInput.value.trim();

    if (!enteredEmail || !enteredPassword) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, enteredEmail, enteredPassword);
        const user = userCredential.user;
        console.log("User signed up successfully:", user.uid);
        // Hide join view and display chat view upon successful sign-up
        joinView.classList.add("hidden");
        chatsView.classList.remove("hidden");
        isLoggedIn = true;
        await loadOldMessages();
        await getNewMessages();
        renderMessages();
        console.log("User has successfully signed up and logged in.");
    } catch (error) {
        console.error("An error occurred during sign-up:", error.message);
        // Handle error (e.g., show error message to the user)
    }
});

// Add event listener for login
loginButton.addEventListener("click", async () => {
    const enteredEmail = emailInput.value.trim();
    const enteredPassword = passwordInput.value.trim();

    if (!enteredEmail || !enteredPassword) {
        alert("Please enter both email and password.");
        return;
    }

    signInWithEmailAndPassword(firebaseAuth, enteredEmail, enteredPassword)
        .then(async(userCredential) => {
            const user = userCredential.user;
            console.log("User logged in successfully:", user.uid);
            // Hide join view and display chat view upon successful login
            joinView.classList.add("hidden");
            chatsView.classList.remove("hidden");
            isLoggedIn = true;
            await loadOldMessages();
            await getNewMessages();
            renderMessages();
            console.log("User has successfully logged in.");
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("An error occurred during login:", errorMessage);
            // Handle error (e.g., show error message to the user)
        });
});



// Add listener for authentication state changes
firebaseAuth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        isLoggedIn = true;
        // Update UI for authenticated user
    } else {
        // User is signed out
        isLoggedIn = false;
        // Update UI for signed out user
    }
});


sendButton.addEventListener("click", async () => {
    const enteredMessage = messageInput.value.trim();
    if (!enteredMessage) return;

    messageInput.value = "";

    try {
        const docRef = await addDoc(collection(firebaseFirestore, "messages"), {
            user: enteredUsername,
            message: enteredMessage,
            created: new Date(),
        });
        console.log("Message sent successfully:", docRef.id);
    } catch (error) {
        console.error("Error sending message:", error);
    }
});

function getNewMessages() {
    const messageQuery = query(collection(firebaseFirestore, "messages"));
    const unsubscribe = onSnapshot(messageQuery, (querySnapshot) => {
        const newMessages = [];
        querySnapshot.forEach((doc) => {
            newMessages.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        const existingMessageIds = new Set(messageList.map(msg => msg.id));

        newMessages.forEach((message) => {
            if (!existingMessageIds.has(message.id)) {
                messageList.push(message);
            }
        });

        renderMessages();
    });
}

async function loadOldMessages() {
    messageList = [];
    try {
        const messageSnapshot = await getDocs(collection(firebaseFirestore, "messages"));
        messageSnapshot.forEach((doc) => {
            messageList.push({
                id: doc.id,
                ...doc.data(),
            });
        });
        console.log("Historical messages loaded successfully.");
    } catch (error) {
        console.error("Error loading historical messages:", error);
    }
}

function renderMessages() {
    const messageListElement = document.getElementById("messageList");
    messageListElement.innerHTML = messageList.map(message => getMessageHTML(message)).join("");
}

function getMessageHTML(message) {
    const isCurrentUser = message.user === enteredUsername;
    const bubbleClass = isCurrentUser ? "message-bubble-me" : "message-bubble-other";
    const timestamp = new Date(message.created.seconds * 1000).toLocaleString();

    return `<li class="message">
        <div class="${bubbleClass}">
            <div class="message-header">
                <div class="sender">${message.user}</div>
                <div class="timestamp">${timestamp}</div>
            </div>
            <div class="message-content">${message.message}</div>
        </div>
    </li>`;
}