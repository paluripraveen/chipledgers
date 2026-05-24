module.exports = [
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/dns [external] (dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("dns", () => require("dns"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/apps/web/lib/firebase.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
// apps/web/lib/firebase.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$firebase$2f$app$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/firebase/app/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/@firebase/app/dist/esm/index.esm.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/firebase/firestore/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__b4__as__getFirestore$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/@firebase/firestore/dist/common-abbd8850.node.mjs [app-ssr] (ecmascript) <export b4 as getFirestore>");
;
;
// 🔐 These will come from your Firebase project settings
const firebaseConfig = {
    //   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    //   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    //   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: "AIzaSyC4UEXrJPCz8dmR9BGzFTxpY7MWVZZFU9E",
    authDomain: "pristine-ally-288321.firebaseapp.com",
    projectId: "pristine-ally-288321",
    storageBucket: "pristine-ally-288321.firebasestorage.app",
    messagingSenderId: "1060159482180",
    appId: "1:1060159482180:web:6b01b49ff042a06ed64f11",
    measurementId: "G-K0V8XB002G"
};
// Initialize Firebase
const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["initializeApp"])(firebaseConfig);
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__b4__as__getFirestore$3e$__["getFirestore"])(app);
}),
"[project]/apps/web/lib/playerService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addPlayer",
    ()=>addPlayer,
    "deletePlayer",
    ()=>deletePlayer,
    "getPlayers",
    ()=>getPlayers
]);
// apps/web/lib/playerService.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/lib/firebase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/firebase/firestore/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__aX__as__collection$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/@firebase/firestore/dist/common-abbd8850.node.mjs [app-ssr] (ecmascript) <export aX as collection>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/@firebase/firestore/dist/index.node.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__a7__as__doc$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/@firebase/firestore/dist/common-abbd8850.node.mjs [app-ssr] (ecmascript) <export a7 as doc>");
;
;
const PLAYERS_COLLECTION = "players";
async function addPlayer(name) {
    if (!name.trim()) throw new Error("Player name is required");
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__aX__as__collection$3e$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], PLAYERS_COLLECTION), {
        name: name.trim(),
        createdAt: new Date().toISOString(),
        active: true
    });
    return docRef.id;
}
async function getPlayers() {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__aX__as__collection$3e$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], PLAYERS_COLLECTION));
    return snapshot.docs.map((doc)=>({
            id: doc.id,
            ...doc.data()
        }));
}
async function deletePlayer(playerId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__a7__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], PLAYERS_COLLECTION, playerId));
}
}),
"[project]/apps/web/lib/sessionService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addPlayerToSession",
    ()=>addPlayerToSession,
    "createSession",
    ()=>createSession,
    "getSession",
    ()=>getSession,
    "getSessions",
    ()=>getSessions
]);
// apps/web/lib/sessionService.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/lib/firebase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/firebase/firestore/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__aX__as__collection$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/@firebase/firestore/dist/common-abbd8850.node.mjs [app-ssr] (ecmascript) <export aX as collection>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/@firebase/firestore/dist/index.node.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__a7__as__doc$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/@firebase/firestore/dist/common-abbd8850.node.mjs [app-ssr] (ecmascript) <export a7 as doc>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__aV__as__arrayUnion$3e$__ = __turbopack_context__.i("[project]/apps/web/node_modules/@firebase/firestore/dist/common-abbd8850.node.mjs [app-ssr] (ecmascript) <export aV as arrayUnion>");
;
;
const SESSIONS_COLLECTION = "sessions";
async function createSession(date) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__aX__as__collection$3e$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], SESSIONS_COLLECTION), {
        date,
        players: [],
        createdAt: new Date().toISOString(),
        status: "active"
    });
    return docRef.id;
}
async function getSessions() {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__aX__as__collection$3e$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], SESSIONS_COLLECTION));
    return snapshot.docs.map((doc)=>({
            id: doc.id,
            ...doc.data()
        }));
}
async function getSession(sessionId) {
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__a7__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], SESSIONS_COLLECTION, sessionId);
    const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDoc"])(ref);
    if (!snap.exists()) throw new Error("Session not found");
    return {
        id: snap.id,
        ...snap.data()
    };
}
async function addPlayerToSession(sessionId, playerId) {
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__a7__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], SESSIONS_COLLECTION, sessionId);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["updateDoc"])(ref, {
        players: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$abbd8850$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__aV__as__arrayUnion$3e$__["arrayUnion"])(playerId)
    });
}
}),
"[project]/apps/web/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Dashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$playerService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/lib/playerService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$sessionService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/lib/sessionService.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function Dashboard() {
    const [players, setPlayers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [sessions, setSessions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [playerName, setPlayerName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [sessionDate, setSessionDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    // Load data
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadData();
    }, []);
    async function loadData() {
        const p = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$playerService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPlayers"])();
        const s = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$sessionService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSessions"])();
        setPlayers(p);
        setSessions(s);
    }
    // Add player
    async function handleAddPlayer() {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$playerService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addPlayer"])(playerName);
        setPlayerName("");
        loadData();
    }
    // Create session
    async function handleCreateSession() {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$lib$2f$sessionService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createSession"])(sessionDate);
        setSessionDate("");
        loadData();
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 20,
            fontFamily: "sans-serif"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                children: "🎰 ChipLedgers Dashboard"
            }, void 0, false, {
                fileName: "[project]/apps/web/app/page.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 30
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Players"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/page.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        placeholder: "Player name",
                        value: playerName,
                        onChange: (e)=>setPlayerName(e.target.value)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/page.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleAddPlayer,
                        children: "Add Player"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/page.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        children: players.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: p.name
                            }, p.id, false, {
                                fileName: "[project]/apps/web/app/page.tsx",
                                lineNumber: 56,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/page.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/page.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 30
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Sessions"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/page.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        value: sessionDate,
                        onChange: (e)=>setSessionDate(e.target.value)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/page.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleCreateSession,
                        children: "Create Session"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/page.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        children: sessions.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "📅 ",
                                    s.date,
                                    " — ",
                                    s.players?.length || 0,
                                    " players"
                                ]
                            }, s.id, true, {
                                fileName: "[project]/apps/web/app/page.tsx",
                                lineNumber: 74,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/web/app/page.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/app/page.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/app/page.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0za55pb._.js.map