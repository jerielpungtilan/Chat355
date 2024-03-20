import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import {
    getFirestore,
    addDoc,
    collection,
    onSnapshot,
    doc,
    getDocs,
    query,
    where,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBuj50BXXv0lLiaF7vcQO993H6spoWrS7U",
    authDomain: "chat-30d66.firebaseapp.com",
    projectId: "chat-30d66",
    storageBucket: "chat-30d66.appspot.com",
    messagingSenderId: "349271227605",
    appId: "1:349271227605:web:9e890398de9eb8a52df65c",
    measurementId: "G-GP7T1C5YMZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const joinButton = document.getElementById("joinButton");
const usernameInput = document.getElementById("usernameInput");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const joinView = document.getElementById("joinView");
const chatsView = document.getElementById("chatsView");
let messages = [];

let specifiedUsername = "";
let userLoggedIn = false;
joinButton.addEventListener("click", () => {
    specifiedUsername = usernameInput.value;
    if (!specifiedUsername) {
        alert("username cannot be empty");
        return;
    }

    signInAnonymously(auth)
        .then(async () => {
            joinView.classList.add("hidden");
            chatsView.classList.remove("hidden");
            userLoggedIn = true;
            await loadHistoricalMessages();
            await subscribeToNewMessages();
            writeMessagesArray();
            console.log("User logged-in");
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            console.log(errorCode, errorMessage);
        });
});

sendButton.addEventListener("click", async () => {
    const message = messageInput.value;
    messageInput.value = "";

    const docRef = await addDoc(collection(db, "messages"), {
        user: specifiedUsername,
        message: message,
        created: new Date(),
    });
    console.log(docRef);
});

function subscribeToNewMessages() {
    const q = query(collection(db, "messages"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages = [];
        querySnapshot.forEach((doc) => {
            newMessages.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        let existingMessageHash = {};
        for (let message of messages) {
            existingMessageHash[message.id] = true;
        }

        for (let message of newMessages) {
            if (!existingMessageHash[message.id]) {
                messages.push(message);
            }
        }

        writeMessagesArray();
    });
}

async function loadHistoricalMessages() {
    messages = [];
    const querySnapshot = await getDocs(collection(db, "messages"));
    querySnapshot.forEach((doc) => {
        messages.push({
            id: doc.id,
            ...doc.data(),
        });
    });
    console.log(messages);
    return messages;
}

function writeMessagesArray() {
    const html = [];
    for (let message of messages) {
        html.push(messageTemplate(message.message, message.user, message.created));
    }
    document.getElementById("messageList").innerHTML = html.join("");
}

function messageTemplate(message, username, timestamp) {
    const currentUser = specifiedUsername;

    // Check if the message is sent by the current user
    const isCurrentUser = username === currentUser;

    // Apply different CSS classes based on whether the message is from the current user or not
    const bubbleClass = isCurrentUser ? 'message-bubble-me' : 'message-bubble-other';

    return `<li class="message">
        <div class="${bubbleClass}">
            <div class="message-header">
                <div class="sender">${username}</div>
                <div class="timestamp">${new Date(timestamp.seconds * 1000).toLocaleString()}</div>
            </div>
            <div class="message-content">${message}</div>
        </div>
    </li>`;
}
