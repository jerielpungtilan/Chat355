import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, addDoc, collection, onSnapshot, getDocs, query } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

const joinButton = document.getElementById("joinButton");
const usernameInput = document.getElementById("usernameInput");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const joinView = document.getElementById("joinView");
const chatsView = document.getElementById("chatsView");
let messageList = [];

let enteredUsername = "";
let isLoggedIn = false;

joinButton.addEventListener("click", () => {
    enteredUsername = usernameInput.value.trim();
    if (!enteredUsername) {
        alert("Please enter a username.");
        return;
    }

    signInAnonymously(firebaseAuth)
        .then(async () => {
            joinView.classList.add("hidden");
            chatsView.classList.remove("hidden");
            isLoggedIn = true;
            await loadOldMessages();
            await subscribeToNewMessages();
            renderMessages();
            console.log("User has successfully logged in.");
        })
        .catch((error) => {
            console.error("An error occurred during sign-in:", error);
        });
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

function subscribeToNewMessages() {
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