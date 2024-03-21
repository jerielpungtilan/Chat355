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
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const signUpButton = document.getElementById("signUpButton");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const joinView = document.getElementById("joinView");
const chatsView = document.getElementById("chatsView");

// Initialize variables for managing user state and message data
let messageList = [];
let enteredUsername = "";
let isLoggedIn = false;

// Event listener for sign-up button click
signUpButton.addEventListener("click", async () => {
    // Retrieve entered email and password from input fields
    const enteredEmail = emailInput.value.trim();
    const enteredPassword = passwordInput.value.trim();

    // Check if both email and password are provided
    if (!enteredEmail || !enteredPassword) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        // Create user with provided email and password
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, enteredEmail, enteredPassword);
        const user = userCredential.user;

        // Handle successful sign-up by updating UI and loading messages
        console.log("User signed up successfully:", user.uid);
        joinView.classList.add("hidden");
        chatsView.classList.remove("hidden");
        isLoggedIn = true;
        await loadOldMessages();
        await getNewMessages(user.email);
        renderMessages(user.email);
        console.log("User has successfully signed up and logged in.");
    } catch (error) {
        console.error("An error occurred during sign-up:", error.message);
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
        alert("Please enter both email and password.");
        return;
    }

    // Sign in with provided email and password
    signInWithEmailAndPassword(firebaseAuth, enteredEmail, enteredPassword)
        .then(async (userCredential) => {
            const user = userCredential.user;

            // Handle successful login by updating UI and loading messages
            console.log("User logged in successfully:", user.uid);
            joinView.classList.add("hidden");
            chatsView.classList.remove("hidden");
            isLoggedIn = true;
            await loadOldMessages();
            await getNewMessages(user.email);
            renderMessages(user.email); // Pass the current user's email
            console.log("User has successfully logged in.");
        })
        .catch((error) => {
            // Handle login error
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("An error occurred during login:", errorMessage);
        });
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
        // Update UI for signed out user
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
        chatsView.classList.add("hidden");
    } catch (error) {
        console.error("Error logging out:", error.message);
        // Handle error (e.g., show error message to the user)
    }
});

// Function to retrieve new messages from Firestore in real-time
function getNewMessages(currentUserEmail) {
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

        renderMessages(currentUserEmail);
    });
}

// Function to load old messages from Firestore
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

// Function to render messages in the UI
function renderMessages(currentUserEmail) {
    const messageListElement = document.getElementById("messageList");
    messageListElement.innerHTML = messageList.map(message => getMessageHTML(message, currentUserEmail)).join("");
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