/*  CMSC355, Sect 001
 *  Group Project - Sprint 2
 *  Sawiya Aidarus, Dustin Cam, Colin Drake, Jeriel Pungtilan, James West
 *  JavaScript for setting up Firebase instance, sending/receiving chats, and processing logins/outs
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, addDoc, collection, onSnapshot, getDocs, query } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBuj50BXXv0lLiaF7vcQO993H6spoWrS7U",
    authDomain: "chat-30d66.firebaseapp.com",
    projectId: "chat-30d66",
    storageBucket: "chat-30d66.appspot.com",
    messagingSenderId: "349271227605",
    appId: "1:349271227605:web:9e890398de9eb8a52df65c",
    measurementId: "G-GP7T1C5YMZ"
};

// Initialize Firebase app with the provided configuration
const firebaseApp = initializeApp(firebaseConfig);

// Get references to Firebase services such as Firestore and Authentication
const firebaseFirestore = getFirestore(firebaseApp);
const firebaseAuth = getAuth(firebaseApp);

// Get references to HTML elements for user interface interaction
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const signUpButton = document.getElementById("signUpButton");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const homeButton = document.getElementById("homeButton");
const groupChatButton = document.getElementById("groupChatButton");
const joinView = document.getElementById("joinView");
const homeView = document.getElementById("homeView");
const chatsView = document.getElementById("chatsView");

// Initialize variables for managing user state and message data
let messageList = [];
let isLoggedIn = false;

// Event listener for sign-up button click
signUpButton.addEventListener("click", async () => {
    // Retrieve entered email and password from input fields
    const enteredEmail = emailInput.value.trim();
    const enteredPassword = passwordInput.value.trim();

    // Check if both email and password are provided
    if (!enteredEmail || !enteredPassword) {
        popError("Please enter both email and password.");
        return;
    }

    try {
        // Create user with provided email and password
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, enteredEmail, enteredPassword);
        const user = userCredential.user;

        // Handle successful sign-up by updating UI and loading messages
        console.log("User signed up successfully:", user.uid);
        joinView.classList.add("hidden");
        homeView.classList.remove("hidden");    //Now shows home page first
        isLoggedIn = true;
        console.log("User has successfully signed up and logged in.");

    } catch (error) {
        console.error("An error occurred during sign-up:", error.message);
        popError("An error occurred during sign-up:" + error.message);
        // Handle error (e.g., show error message to the user)
    }
});

// Event listener for login button click
loginButton.addEventListener("click", async () => {
    // Retrieve entered email and password from input fields
    const enteredEmail = emailInput.value.trim();
    const enteredPassword = passwordInput.value.trim();

    // Check if both email and password are provided
    if (!enteredEmail || !enteredPassword) {
        popError("Please enter both email and password.");
        return;
    }

    // Sign in with provided email and password
    try {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, enteredEmail, enteredPassword);
        const user = userCredential.user;

        // Handle successful login by updating UI and loading messages
        console.log("User logged in successfully:", user.uid);
        joinView.classList.add("hidden");
        homeView.classList.remove("hidden");    //Now shows home page first
        isLoggedIn = true;
        console.log("User has successfully logged in.");

    } catch (error) {
        // Handle login error
        console.error("An error occurred during login:", error.message);
        popError("An error occurred during login:" + error.message);
    }
});

// Event listener for group chat button click
groupChatButton.addEventListener("click", async () => {
    try{
        const currentUser = firebaseAuth.currentUser;
            if (!currentUser) {
                console.error("No user is currently authenticated.");
                return;
            }
        homeView.classList.add("hidden");
        chatsView.classList.remove("hidden");
        await loadOldMessages(currentUser.email);
        await getNewMessages(currentUser.email);
        renderMessages(currentUser.email);
        console.log("User has successfully logged in.");
    } catch (error) {
        console.error("An error occurred while opening the group chat:", error.message);
        popError("An error occurred while opening the group chat:" + error.message);
    }
});

// Event listener for home page button click
homeButton.addEventListener("click", async () => {
    try{
        chatsView.classList.add("hidden");
        homeView.classList.remove("hidden");
    } catch (error){
        console.error("An error occurred while opening the home page:", error.message);
        popError("An error occurred while opening the home page:" + error.message);
    }
});

// Listener for authentication state changes
firebaseAuth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        isLoggedIn = true;
        // Update UI for authenticated user
    } else {
        // User is signed out
        isLoggedIn = false;
        // Update UI for signed-out user
    }
});

// Event listener for send button click to send message
sendButton.addEventListener("click", async () => {
    // Retrieve entered message from input field
    const enteredMessage = messageInput.value.trim();
    if (!enteredMessage) return;

    // Clear message input field
    messageInput.value = "";

    try {
        // Get current user
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) {
            console.error("No user is currently authenticated.");
            popError("No user is currently authenticated.");
            return;
        }

        // Add message to Firestore collection
        const docRef = await addDoc(collection(firebaseFirestore, "messages"), {
            user: currentUser.email,
            message: enteredMessage,
            created: new Date(),
        });
        console.log("Message sent successfully:", docRef.id);
    } catch (error) {
        console.error("Error sending message:", error);
        popError("Error sending message:" + error.message);

    }
});

// Event listener for logout button click
logoutButton.addEventListener("click", async () => {
    try {
        // Sign out current user
        await signOut(firebaseAuth);
        console.log("User logged out successfully");
        // Redirect to the login screen or show/hide elements as needed
        joinView.classList.remove("hidden");
        homeView.classList.add("hidden");       //logoutButton returns from home to login now
        //chatsView.classList.add("hidden");
    } catch (error) {
        console.error("Error logging out:", error.message);
        // Handle error (e.g., show error message to the user)
        popError("Error logging out:" + error.message);
    }
});

// Function to retrieve new messages from Firestore in real-time
function getNewMessages(currentUserEmail) {
    const messageQuery = query(collection(firebaseFirestore, "messages"));
    onSnapshot(messageQuery, (querySnapshot) => {
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

        renderMessages(currentUserEmail);
    });
}

// Function to load old messages from Firestore
async function loadOldMessages(currentUserEmail) {
    messageList = [];
    try {
        const messageSnapshot = await getDocs(collection(firebaseFirestore, "messages"), orderBy("timestamp"));
        messageSnapshot.forEach((doc) => {
            messageList.push({
                id: doc.id,
                ...doc.data(),
            });
        });
        console.log("Historical messages loaded successfully.");
        renderMessages(currentUserEmail);
    } catch (error) {
        console.error("Error loading historical messages:", error);
        popError("Error loading historical messages:" + error.message);
    }
}

// Function to render messages in the UI
// Function to render messages in the UI
function renderMessages(currentUserEmail) {
    const messageListElement = document.getElementById("messageList");

    // Sort messages by timestamp
    messageList.sort((a, b) => a.created.seconds - b.created.seconds);

    // Generate HTML for each message
    const messagesHTML = messageList.map(message => getMessageHTML(message, currentUserEmail)).join("");

    // Set innerHTML of message list element
    messageListElement.innerHTML = messagesHTML;
}

// Function to generate HTML for a message
function getMessageHTML(message, currentUserEmail) {
    const isCurrentUser = message.user === currentUserEmail;
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

// Function to generate error message HTML when caught
function popError(message){
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorPopup').style.display = 'block'
}
// Function to hide error popups
function hidePopup(){
    document.getElementById('errorPopup').style.display = 'none';
}
// Listens for page load event, then starts listener for close button click
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('closeButton').addEventListener('click', hidePopup);
});
