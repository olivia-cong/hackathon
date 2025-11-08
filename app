<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SpotCheck - Dartmouth Study Spaces</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #00693e 0%, #004d2c 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .tagline {
            font-size: 1rem;
            opacity: 0.95;
            font-weight: 300;
        }

        .locations-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .location-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .location-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 12px rgba(0,0,0,0.15);
        }

        .location-name {
            font-size: 1.3rem;
            font-weight: 600;
            color: #00693e;
            margin-bottom: 12px;
        }

        .status-section {
            margin-bottom: 16px;
        }

        .status-label {
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }

        .status-display {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .busyness-empty { background: #d1fae5; color: #065f46; }
        .busyness-filling-up { background: #fed7aa; color: #9a3412; }
        .busyness-packed { background: #fecaca; color: #991b1b; }

        .noise-silent { background: #e0e7ff; color: #3730a3; }
        .noise-whispers { background: #fce7f3; color: #831843; }
        .noise-chatty { background: #ffedd5; color: #9a3412; }

        .timestamp {
            font-size: 0.75rem;
            color: #999;
            font-style: italic;
        }

        .button-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 12px;
        }

        .update-btn {
            padding: 10px 8px;
            border: 2px solid #e5e7eb;
            background: white;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }

        .update-btn:hover {
            border-color: #00693e;
            background: #f0fdf4;
        }

        .update-btn:active {
            transform: scale(0.95);
        }

        .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 16px 0;
        }

        .loading {
            text-align: center;
            color: white;
            font-size: 1.2rem;
            padding: 40px;
        }

        .stale {
            opacity: 0.6;
        }

        footer {
            text-align: center;
            color: white;
            margin-top: 40px;
            font-size: 0.9rem;
            opacity: 0.8;
        }

        @media (max-width: 640px) {
            h1 { font-size: 2rem; }
            .locations-grid { grid-template-columns: 1fr; }
            .button-grid { gap: 6px; }
            .update-btn { font-size: 0.75rem; padding: 8px 6px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>SpotCheck</h1>
            <p class="tagline">Know before you go. Real-time Dartmouth study spaces.</p>
        </header>

        <div id="app" class="loading">Loading study spots...</div>

        <footer>
            Made with 💚 for Dartmouth students
        </footer>
    </div>

    <script type="module">
        // ============================================
        // DATABASE MODULE (merged with UI)
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
            appId: "1:940250549229:web:6992a59fa54136aef075e4"
        };

        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);

        // Study locations configuration
        const LOCATIONS = [
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

        // Generate user ID for tracking (abuse prevention)
        function getUserId() {
            let userId = localStorage.getItem('libstatus_userId');
            if (!userId) {
                userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
                localStorage.setItem('libstatus_userId', userId);
            }
            return userId;
        }

        // Time formatting
        function timeAgo(timestamp) {
            if (!timestamp) return 'No updates yet';
            const seconds = Math.floor((Date.now() - timestamp) / 1000);
            
            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            return `${Math.floor(seconds / 86400)}d ago`;
        }

        function isStale(timestamp) {
            if (!timestamp) return true;
            return Date.now() - timestamp > 30 * 60 * 1000; // 30 minutes
        }

        // Update location status
        async function updateLocationStatus(locationId, statusData) {
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
                alert('Error updating status. Please try again.');
                return { success: false, error: error.message };
            }
        }

        // Report abuse
        async function reportAbuse(locationId, reason = 'Suspicious update') {
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
                alert('Report submitted. Thank you!');
                return { success: true };
            } catch (error) {
                console.error('❌ Error reporting abuse:', error);
                return { success: false, error: error.message };
            }
        }

        // Initialize database with default locations if empty
        async function initializeLocations() {
            const locationsRef = ref(database, 'locations');
            const snapshot = await get(locationsRef);
            
            if (!snapshot.exists()) {
                console.log('🔧 Initializing database with default locations...');
                for (const location of LOCATIONS) {
                    await updateLocationStatus(location.id, {
                        busyness: 'empty',
                        noise: 'silent'
                    });
                }
            }
        }

        // Render location card
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

        // Initialize app
        async function initApp() {
            const appDiv = document.getElementById('app');
            const locationData = {};

            // Initialize database if needed
            await initializeLocations();

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

        initApp();
    </script>
</body>
</html>