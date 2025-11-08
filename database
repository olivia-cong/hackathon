// ============================================
// DATABASE MODULE
// This file handles all Firebase database operations
// Can be moved to a separate file without affecting UI
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, get, onValue, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqeSCpUc9bP5s-ATMAE9_jK7cF4_5KXKk",
    authDomain: "libstatus-97ab1.firebaseapp.com",
    databaseURL: "https://libstatus-97ab1-default-rtdb.firebaseio.com",
    projectId: "libstatus-97ab1",
    storageBucket: "libstatus-97ab1.firebasestorage.app",
    messagingSenderId: "940250549229",
    appId: "1:940250549229:web:15b80dcd14988a92f075e4"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Study locations configuration
export const LOCATIONS = [
    { id: 'first-floor-berry', name: 'FFB' },
    { id: 'second-floor-berry', name: '2FB' },
    { id: 'third-floor-berry', name: '3FB' },
    { id: 'fourth-floor-berry', name: '4FB' },
    { id: 'sanborn', name: 'Sanborn' },
    { id: 'novack', name: 'Novack' },
    { id: 'blobby', name: 'Blobby' },
    { id: '1902-room', name: '1902 Room' },
    { id: '1913-room', name: '1913 Room' },
    { id: 'tower-room', name: 'Tower Room' },
    { id: 'orozco-mural-rooms', name: 'Orozco Mural Rooms' },
    { id: 'stacks', name: 'Stacks' }
];

/**
 * Generate a simple user ID (stored in localStorage for tracking)
 * Used for abuse prevention - tracks who submitted what
 */
function getUserId() {
    let userId = localStorage.getItem('libstatus_userId');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('libstatus_userId', userId);
    }
    return userId;
}

/**
 * Updates the status of a specific location in the database
 *
 * Database Structure:
 * locations/
 *   ├── {locationId}/
 *       ├── name: "Location Name"
 *       ├── busyness: "empty" | "filling-up" | "packed"
 *       ├── noise: "silent" | "whispers" | "chatty"
 *       ├── lastUpdated: timestamp
 *       └── updatedBy: userID
 *
 * @param {string} locationId - The unique ID of the location
 * @param {object} statusData - Object containing { busyness, noise }
 * @returns {Promise<object>} - { success: boolean, data?: object, error?: string }
 */
export async function updateLocationStatus(locationId, statusData) {
    const locationRef = ref(database, `locations/${locationId}`);
    const userId = getUserId();

    const updateData = {
        name: LOCATIONS.find(loc => loc.id === locationId)?.name || locationId,
        busyness: statusData.busyness || 'empty',
        noise: statusData.noise || 'silent',
        lastUpdated: Date.now(),
        updatedBy: userId
    };

    try {
        await set(locationRef, updateData);
        console.log(`✅ Updated ${locationId}:`, updateData);
        return { success: true, data: updateData };
    } catch (error) {
        console.error(`❌ Error updating ${locationId}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetches the current status for a specific location
 *
 * @param {string} locationId - The unique ID of the location
 * @returns {Promise<object>} - { success: boolean, data?: object, message?: string }
 */
export async function getLocationStatus(locationId) {
    const locationRef = ref(database, `locations/${locationId}`);

    try {
        const snapshot = await get(locationRef);
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: false, message: 'No data available' };
        }
    } catch (error) {
        console.error(`❌ Error fetching ${locationId}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetches all study locations and their current status
 *
 * @returns {Promise<object>} - { success: boolean, data: object }
 */
export async function getAllLocations() {
    const locationsRef = ref(database, 'locations');

    try {
        const snapshot = await get(locationsRef);
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: true, data: {} };
        }
    } catch (error) {
        console.error('❌ Error fetching all locations:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reports suspicious or abusive updates for a location
 *
 * Database Structure for Reports:
 * reports/
 *   ├── {timestamp}/
 *       ├── locationId: "location-id"
 *       ├── reason: "Report reason"
 *       ├── reportedBy: userID
 *       └── timestamp: timestamp
 *
 * @param {string} locationId - The location being reported
 * @param {string} reason - Reason for the report
 * @returns {Promise<object>} - { success: boolean, error?: string }
 */
export async function reportAbuse(locationId, reason = 'Suspicious update') {
    const reportRef = ref(database, `reports/${Date.now()}`);
    const userId = getUserId();

    const reportData = {
        locationId: locationId,
        reason: reason,
        reportedBy: userId,
        timestamp: Date.now()
    };

    try {
        await set(reportRef, reportData);
        console.log('📢 Abuse reported:', reportData);
        return { success: true };
    } catch (error) {
        console.error('❌ Error reporting abuse:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sets up a real-time listener for a specific location
 * Calls the callback function whenever data changes
 *
 * @param {string} locationId - The location to listen to
 * @param {function} callback - Function to call with new data: callback(data)
 * @returns {function} - Unsubscribe function
 */
export function listenToLocation(locationId, callback) {
    const locationRef = ref(database, `locations/${locationId}`);

    return onValue(locationRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        }
    });
}

/**
 * Initializes all locations in the database with default values
 * Only runs if database is empty
 *
 * @returns {Promise<void>}
 */
export async function initializeLocations() {
    const allLocations = await getAllLocations();

    if (!allLocations.success || Object.keys(allLocations.data).length === 0) {
        console.log('🔧 Initializing database with default locations...');

        for (const location of LOCATIONS) {
            await updateLocationStatus(location.id, {
                busyness: 'empty',
                noise: 'silent'
            });
        }
    }
}

// Export database instance for advanced use cases
export { database };
