// ============================================
// UI MODULE
// This file handles all UI rendering and interactions
// ============================================

import {
    LOCATIONS,
    updateLocationStatus,
    reportAbuse,
    initializeLocations,
    database
} from './database.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Busyness and noise level configurations
const busynessLevels = [
    { value: 'empty', label: 'Empty', emoji: '✨' },
    { value: 'filling-up', label: 'Filling Up', emoji: '📊' },
    { value: 'packed', label: 'Packed', emoji: '🔥' }
];

const noiseLevels = [
    { value: 'silent', label: 'Silent', emoji: '🤫' },
    { value: 'whispers', label: 'Whispers', emoji: '💬' },
    { value: 'chatty', label: 'Chatty', emoji: '☕' }
];

/**
 * Format timestamp to human-readable "time ago"
 */
function timeAgo(timestamp) {
    if (!timestamp) return 'No updates yet';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Check if data is stale (older than 30 minutes)
 */
function isStale(timestamp) {
    if (!timestamp) return true;
    return Date.now() - timestamp > 30 * 60 * 1000; // 30 minutes
}

/**
 * Render a single location card
 */
function renderLocationCard(location, data) {
    const busyness = data?.busyness || null;
    const noise = data?.noise || null;
    const lastUpdated = data?.lastUpdated || null;
    const stale = isStale(lastUpdated);

    const busynessInfo = busynessLevels.find(b => b.value === busyness);
    const noiseInfo = noiseLevels.find(n => n.value === noise);

    return `
        <div class="location-card ${stale ? 'stale' : ''}">
            <div class="location-name">${location.name}</div>

            <div class="status-section">
                <div class="status-label">Busyness</div>
                <div class="status-display">
                    ${busyness ? `
                        <span class="status-badge busyness-${busyness}">
                            ${busynessInfo.emoji} ${busynessInfo.label}
                        </span>
                    ` : '<span style="color: #999;">Not reported</span>'}
                </div>
                <div class="button-grid">
                    ${busynessLevels.map(level => `
                        <button
                            class="update-btn"
                            onclick="window.updateBusyness('${location.id}', '${level.value}')"
                        >
                            ${level.emoji} ${level.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="divider"></div>

            <div class="status-section">
                <div class="status-label">Noise Level</div>
                <div class="status-display">
                    ${noise ? `
                        <span class="status-badge noise-${noise}">
                            ${noiseInfo.emoji} ${noiseInfo.label}
                        </span>
                    ` : '<span style="color: #999;">Not reported</span>'}
                </div>
                <div class="button-grid">
                    ${noiseLevels.map(level => `
                        <button
                            class="update-btn"
                            onclick="window.updateNoise('${location.id}', '${level.value}')"
                        >
                            ${level.emoji} ${level.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="timestamp">${timeAgo(lastUpdated)}</div>
            <button
                class="report-btn"
                onclick="window.reportLocation('${location.id}')"
                style="margin-top: 8px; font-size: 0.75rem; color: #666; background: none; border: none; cursor: pointer; text-decoration: underline;"
            >
                Report incorrect status
            </button>
        </div>
    `;
}

/**
 * Initialize and start the app
 */
async function initApp() {
    console.log('🚀 initApp started');
    const appDiv = document.getElementById('app');
    const locationData = {};

    // Initialize database if needed
    console.log('🔧 Initializing locations...');
    await initializeLocations();
    console.log('✅ Locations initialized');

    // Listen to all locations
    LOCATIONS.forEach(location => {
        const locationRef = ref(database, `locations/${location.id}`);
        onValue(locationRef, (snapshot) => {
            locationData[location.id] = snapshot.val();
            renderApp();
        });
    });

    function renderApp() {
        appDiv.innerHTML = `
            <div class="locations-grid">
                ${LOCATIONS.map(loc => renderLocationCard(loc, locationData[loc.id])).join('')}
            </div>
        `;
    }

    // Make update functions globally available
    window.updateBusyness = async (locationId, value) => {
        const currentData = locationData[locationId] || {};
        await updateLocationStatus(locationId, {
            busyness: value,
            noise: currentData.noise || 'silent'
        });
    };

    window.updateNoise = async (locationId, value) => {
        const currentData = locationData[locationId] || {};
        await updateLocationStatus(locationId, {
            busyness: currentData.busyness || 'empty',
            noise: value
        });
    };

    window.reportLocation = (locationId) => {
        const reason = prompt('Why are you reporting this? (optional)') || 'Incorrect status';
        reportAbuse(locationId, reason);
    };

    renderApp();
}

// Start the app when DOM is loaded
console.log('📱 UI module loaded, document state:', document.readyState);
if (document.readyState === 'loading') {
    console.log('⏳ Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    console.log('✅ DOM already loaded, starting app...');
    initApp();
}
