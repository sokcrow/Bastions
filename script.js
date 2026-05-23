
window.updateEditModeUI = function() {
    const body = document.body;
    const modeLabel = document.getElementById('mode-label');
    const tbRasgos = document.getElementById('toolbar-rasgos');
    const tbEstados = document.getElementById('toolbar-estados');
    const tbAtributos = document.getElementById('toolbar-atributos');

    if (document.body.dataset.editMode === 'true') {
        body.classList.add('edit-mode');
        if(modeLabel) modeLabel.textContent = "Modo Edición";
        if(tbRasgos) tbRasgos.style.display = 'block';
        if(tbEstados) tbEstados.style.display = 'block';
        if(tbAtributos) tbAtributos.style.display = 'block';
    } else {
        body.classList.remove('edit-mode');
        if(modeLabel) modeLabel.textContent = "Modo Juego";
        if(tbRasgos) tbRasgos.style.display = 'none';
        if(tbEstados) tbEstados.style.display = 'none';
        if(tbAtributos) tbAtributos.style.display = 'none';
    }
};

// Estructura de Datos Global
let appState = {
    players: [],
    currentPlayerId: null,
    globalStates: []
};

// Plantilla de nuevo jugador (ahora con atributos D&D)
function createNewPlayer(name, currencyName) {
    return {
        id: 'player_' + Date.now(),
        name: name || 'Jugador 1',
        currencyName: currencyName || 'Mérito',
        currencyAmount: 0,
        type: 'player',
        hp: 100,
        maxHp: 100,
        attributes: {
            str: 10, // Fuerza
            dex: 10, // Destreza
            con: 10, // Constitución
            int: 10, // Inteligencia
            wis: 10, // Sabiduría
            cha: 10  // Carisma
        },
        traits: [],
        estados: []
    };
}

// Mapeo amigable de atributos
const attrNames = {
    str: 'Fuerza',
    dex: 'Destreza',
    con: 'Constitución',
    int: 'Inteligencia',
    wis: 'Sabiduría',
    cha: 'Carisma'
};


let editingItem = null;

// ==========================================

// ==========================================

// ==========================================
// CATÁLOGO GLOBAL DE ESTADOS (ÁRBOL)
// ==========================================

window.editGlobalState = function(id) {
    const estado = appState.globalStates.find(s => s.id === id);
    if(!estado) return;
    editingItem = estado;
    document.getElementById('modal-state-title').textContent = "Editar Estado Base";
    document.getElementById('input-state-name').value = estado.nombreBase;
    document.getElementById('input-state-desc').value = estado.descripcion || '';

    if(document.getElementById('select-state-tier')) document.getElementById('select-state-tier').value = estado.tier || 1;

    if(typeof populateStateReqSelect === 'function') populateStateReqSelect(estado.id);
    const reqSelect = document.getElementById('select-state-req');
    if (reqSelect) {
        if (estado.requisitos && estado.requisitos.length > 0) reqSelect.value = estado.requisitos[0];
        else reqSelect.value = "";
    }

    const btnDel = document.getElementById('btn-delete-state');
    if(btnDel) btnDel.style.display = 'block';

    openModal('modal-state');
};

function renderGlobalStatesTree() {
    const container = document.getElementById('states-nodes-container');
    if(!container) return;
    container.innerHTML = '';

    if(!appState.globalStates) appState.globalStates = [];

    const tiers = {};
    appState.globalStates.forEach(state => {
        const t = state.tier || 1;
        if (!tiers[t]) tiers[t] = [];
        tiers[t].push(state);
    });

    const sortedTiers = Object.keys(tiers).sort((a, b) => parseInt(a) - parseInt(b));

    sortedTiers.forEach(tierKey => {
        const tierDiv = document.createElement('div');
        tierDiv.className = 'tier';

        tiers[tierKey].forEach(state => {
            const node = document.createElement('div');
            node.className = 'node unlocked'; // Visualmente como una tarjeta disponible
            node.id = `gstate-${state.id}`;

            const name = state.nombreBase;
            const descHtml = state.descripcion ? `<div class="state-desc">${state.descripcion}</div>` : '';
            const badge = window.isEditMode ? `<div class="edit-badge">✎</div>` : '';

            const btnApply = (document.body.dataset.editMode === "true") ? `<button class="btn btn-primary btn-small" style="margin-top:10px; width:100%;" onclick="event.stopPropagation(); openAssignModal('${state.id}')">Aplicar a...</button>` : '';

            node.innerHTML = `
                ${badge}
                <div class="node-name">${name}</div>
                ${descHtml}
                ${btnApply}
            `;

            node.addEventListener('click', () => {
                if(document.body.dataset.editMode === "true") editGlobalState(state.id);
            });

            tierDiv.appendChild(node);
        });

        container.appendChild(tierDiv);
    });

    if (document.getElementById('tab-estados').classList.contains('active')) {
        setTimeout(drawStatesLines, 50);
    }
}






var btnManageGlobalStates = document.getElementById('btn-manage-global-states');
if(btnManageGlobalStates) {
    btnManageGlobalStates.onclick = () => {

    };
}

function renderGlobalStatesList() {
    const list = document.getElementById('global-states-list');
    if(!list) return;
    list.innerHTML = '';
    if(!appState.globalStates || appState.globalStates.length === 0) {
        list.innerHTML = '<p class="text-muted">No hay estados base definidos.</p>';
        return;
    }
    appState.globalStates.forEach(s => {
        const div = document.createElement('div');
        div.className = 'global-state-item';
        div.innerHTML = `
            <div><strong>${s.nombreBase}</strong></div>
            <div>
                <button class="btn btn-small btn-danger" onclick="deleteGlobalState('${s.id}')">X</button>
            </div>
        `;
        list.appendChild(div);
    });
}

var btnNewGlobalState = document.getElementById('btn-new-global-state');
if(btnNewGlobalState) {
    btnNewGlobalState.onclick = () => {
        editingItem = null;
        document.getElementById('modal-state-title').textContent = "Nuevo Estado Base";
        document.getElementById('input-state-name').value = '';
        document.getElementById('input-state-desc').value = '';
        closeModal('modal-global-states');
        openModal('modal-state');
    };
}


// ==========================================
// ASIGNAR ESTADO AL JUGADOR
// ==========================================





    // ==========================================
    // EVENTOS DE ESTADOS
    // ==========================================
    var btnManageGlobalStates = document.getElementById('btn-manage-global-states');
    if(btnManageGlobalStates) {
        btnManageGlobalStates.onclick = () => {
            if(typeof renderGlobalStatesList === 'function') renderGlobalStatesTree();
            openModal('modal-global-states');
        };
    }

    var btnNewGlobalState = document.getElementById('btn-new-global-state');
    if(btnNewGlobalState) {
        btnNewGlobalState.onclick = () => {
            editingItem = null;
            document.getElementById('modal-state-title').textContent = "Nuevo Estado Base";
            document.getElementById('input-state-name').value = '';
            document.getElementById('input-state-desc').value = '';
            closeModal('modal-global-states');
            openModal('modal-state');
        };
    }


window.changeCurrency = function(amount) {
    const player = getCurrentPlayer();
    if(!player) return;

    player.currencyAmount += amount;
    if(player.currencyAmount < 0) player.currencyAmount = 0; // No permitir moneda negativa

    saveAppState();
    updateCurrencyDisplay();
};

// INICIALIZACIÓN Y GUARDADO
// ==========================================

// ==========================================
// PAN & ZOOM (Cámara Libre)
// ==========================================
let treeTransform = { x: 0, y: 0, scale: 1 };
let isDragging = false;
let startDragX = 0;
let startDragY = 0;

let statesTransform = { x: 0, y: 0, scale: 1 };

function initPanZoom() {
    setupViewport('tree-viewport', 'tree-container', treeTransform);
    setupViewport('states-viewport', 'states-tree-container', statesTransform);
}

function setupViewport(viewportId, containerId, transformObj) {
    const viewport = document.getElementById(viewportId);
    const container = document.getElementById(containerId);
    if(!viewport || !container) return;

    // Mouse Drag
    viewport.addEventListener('mousedown', (e) => {
        if(e.button !== 0) return; // Solo click izquierdo
        if(e.target.closest('.node')) return; // No arrastrar si clickeas un nodo
        isDragging = true;
        startDragX = e.clientX - transformObj.x;
        startDragY = e.clientY - transformObj.y;
    });

    window.addEventListener('mousemove', (e) => {
        if(!isDragging) return;
        transformObj.x = e.clientX - startDragX;
        transformObj.y = e.clientY - startDragY;
        updateTransform(container, transformObj);
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });


    // Touch Drag (Mobile)
    let lastTouchX = 0;
    let lastTouchY = 0;

    viewport.addEventListener('touchstart', (e) => {
        if(e.touches.length === 1) {
            if(e.target.closest('.node')) return;
            isDragging = true;
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        }
    });

    viewport.addEventListener('touchmove', (e) => {
        if(!isDragging || e.touches.length !== 1) return;
        e.preventDefault(); // Prevenir scroll nativo
        const deltaX = e.touches[0].clientX - lastTouchX;
        const deltaY = e.touches[0].clientY - lastTouchY;
        transformObj.x += deltaX;
        transformObj.y += deltaY;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        updateTransform(container, transformObj);
    }, {passive: false});

    viewport.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Mouse Wheel Zoom
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;

        const zoom = Math.exp(wheel * zoomIntensity);
        const newScale = transformObj.scale * zoom;
        if(newScale < 0.2 || newScale > 3) return;

        transformObj.scale = newScale;
        updateTransform(container, transformObj);
    }, {passive: false});
}

function updateTransform(container, transformObj) {
    if(container) {
        container.style.transform = `translate(${transformObj.x}px, ${transformObj.y}px) scale(${transformObj.scale})`;
    }
}


function initGlobalEvents() {
    // EVENTOS DE MENU MÓVIL
    const btnOpen = document.getElementById('btn-open-sidebar');
    const btnClose = document.getElementById('btn-close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    function openSidebar() {
        if(sidebar) sidebar.classList.add('open');
        if(overlay) overlay.classList.add('active');
    }

    function closeSidebar() {
        if(sidebar) sidebar.classList.remove('open');
        if(overlay) overlay.classList.remove('active');
    }

    if (btnOpen) btnOpen.addEventListener('click', openSidebar);
    if (btnClose) btnClose.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    const originalSelectPlayer = window.selectPlayer;
window.selectPlayer = function(id) {
    if (!appState || !appState.players) return;
    appState.currentPlayerId = id;
    currentPlayer = appState.players.find(p => p.id === id);
    if (!currentPlayer) return;

    document.querySelectorAll('#players-list li, #npcs-list li').forEach(li => li.classList.remove('active'));
    const activeLi = document.querySelector(`li[onclick="selectPlayer('${id}')"]`);
    if (activeLi) activeLi.classList.add('active');

    const contentContainer = document.getElementById('content-container');
    if(contentContainer) contentContainer.style.display = 'block';

    const characterNameEl = document.getElementById('character-name');
    const meritDisplayEl = document.getElementById('merit-display');
    const currencyNameEl = document.getElementById('currency-name-display');

    if (characterNameEl) characterNameEl.textContent = currentPlayer.name;
    if (meritDisplayEl) meritDisplayEl.textContent = currentPlayer.merit;
    if (currencyNameEl) currencyNameEl.textContent = currentPlayer.currencyName;

    if (typeof updateHpUI === 'function') updateHpUI();
    if (typeof renderAttributes === 'function') renderAttributes();
    if (typeof renderTree === 'function') renderTree();
    if (typeof renderActiveStates === 'function') renderActiveStates();

    if (typeof updateEditModeUI === 'function') {
        updateEditModeUI();
    }
    if (window.innerWidth <= 768 && typeof closeSidebar === 'function') closeSidebar();
    if (typeof saveAppState === 'function') saveAppState();

    // EVENTOS DEL CATALOGO GLOBAL
    const btnManageGlobalStates = document.getElementById('btn-manage-global-states');
    if(btnManageGlobalStates) {
        btnManageGlobalStates.onclick = () => {
            if(typeof renderGlobalStatesList === 'function') renderGlobalStatesTree();
            openModal('modal-global-states');
        };
    }

        const btnNewGlobalState = document.getElementById('btn-new-global-state');
    if(btnNewGlobalState) {
        btnNewGlobalState.onclick = () => {
            editingItem = null;
            document.getElementById('modal-state-title').textContent = "Nuevo Estado Base";
            document.getElementById('input-state-name').value = '';
            document.getElementById('input-state-desc').value = '';
            document.getElementById('select-state-tier').value = '1';

            populateStateReqSelect(null);

            openModal('modal-state');
        };
    }

    const btnAssignState = document.getElementById('btn-add-state-to-player');
    if(btnAssignState) {
        btnAssignState.onclick = () => {
            const select = document.getElementById('select-assign-state');
            if(!select) return;
            select.innerHTML = '';
            const player = getCurrentPlayer();

            if(!appState.globalStates) appState.globalStates = [];
            const available = appState.globalStates;

            if(available.length === 0) {
                select.innerHTML = '<option value="">No hay estados globales creados.</option>';
                document.getElementById('btn-confirm-assign-state').disabled = true;
            } else {
                document.getElementById('btn-confirm-assign-state').disabled = false;
                available.forEach(gs => {
                    const opt = document.createElement('option');
                    opt.value = gs.id;
                    opt.textContent = gs.nombreBase;
                    select.appendChild(opt);
                });
            }
            openModal('modal-assign-state');
        };
    }

    const btnConfirmAssign = document.getElementById('btn-confirm-assign-state');
    if(btnConfirmAssign) {
        btnConfirmAssign.onclick = () => {
            const targetPlayerId = document.getElementById('select-assign-player').value;
            const player = appState.players.find(p => p.id === targetPlayerId);
            const globalId = document.getElementById('hidden-assign-state-id').value;
            const bodyPart = document.getElementById('select-assign-bodypart') ? document.getElementById('select-assign-bodypart').value : 'general';

            if(player && globalId) {
                if(!player.activeStates) player.activeStates = [];
                player.activeStates.push({
                    id: 'astate_' + Date.now(),
                    globalId: globalId,
                    nivel: 0,
                    bodyPart: bodyPart,
                    desbloqueado: true
                });
                saveAppState();

                // Si el jugador al que se le aplicó es el que se está viendo, renderizamos
                if(player.id === appState.currentPlayerId) {
                    renderStates();
                }
                closeModal('modal-assign-state');
                alert(`Estado aplicado a ${player.name} en ${bodyPart}`);
            }
        };
    }
}

window.deleteGlobalState = function(id) {
    if(confirm("¿Eliminar este estado del catálogo global? Los jugadores que lo tengan asignado perderán la referencia.")){
        appState.globalStates = appState.globalStates.filter(s => s.id !== id);
        saveAppState();
        renderGlobalStatesTree();
        renderStates();
    }
};

function init() {
    document.body.dataset.editMode = "false";
    initGlobalEvents();
    loadAppState();

    // Auto-crear un jugador inicial si la lista está completamente vacía
    if (appState.players.length === 0) {
        const defaultPlayer = createNewPlayer("Jugador 1", "Mérito");
        appState.players.push(defaultPlayer);
        appState.currentPlayerId = defaultPlayer.id;
        saveAppState();
    }

    renderSidebar();

    // Seleccionar el jugador actual (o el primero)
    if (appState.currentPlayerId && appState.players.find(p => p.id === appState.currentPlayerId)) {
        selectPlayer(appState.currentPlayerId);
    } else if (appState.players.length > 0) {
        selectPlayer(appState.players[0].id);
    }

    setupEventListeners();
    initPanZoom();
}

function loadAppState() {
    const saved = localStorage.getItem('skillTreeAdminState');
    if (saved) {
        try {
            appState = JSON.parse(saved);
            // Asegurar que jugadores viejos tengan objeto de atributos
            appState.players.forEach(p => {
                if (p.hp === undefined) p.hp = 100;
                if (p.maxHp === undefined) p.maxHp = 100;
                if (!p.type) p.type = 'player';
                if (!p.attributes) {
                    p.attributes = { str:10, dex:10, con:10, int:10, wis:10, cha:10 };
                }
                if (!p.activeStates) {
                    p.activeStates = [];
                    // Move existing states to global if needed, or just let them be legacy
                }
            });
            if (!appState.globalStates) appState.globalStates = [];
        } catch (e) {
            console.error("Error parsing saved state", e);
        }
    }
}

function saveAppState() {
    localStorage.setItem('skillTreeAdminState', JSON.stringify(appState));
}

function getCurrentPlayer() {
    return appState.players.find(p => p.id === appState.currentPlayerId);
}

// ==========================================
// UI: SIDEBAR Y ESTADO PRINCIPAL
// ==========================================

function renderSidebar() {
    const listPlayers = document.getElementById('players-list');
    const listNpcs = document.getElementById('npcs-list');

    if(listPlayers) listPlayers.innerHTML = '';
    if(listNpcs) listNpcs.innerHTML = '';

    appState.players.forEach(player => {
        const li = document.createElement('li');
        li.className = `player-item ${player.id === appState.currentPlayerId ? 'active' : ''}`;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = player.name;
        nameSpan.onclick = () => selectPlayer(player.id);

        const delBtn = document.createElement('button');
        delBtn.className = 'player-delete';
        delBtn.innerHTML = '×';
        delBtn.title = "Eliminar";
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deletePlayer(player.id);
        };

        li.appendChild(nameSpan);
        li.appendChild(delBtn);

        if(player.type === 'npc' && listNpcs) {
            listNpcs.appendChild(li);
        } else if(listPlayers) {
            listPlayers.appendChild(li);
        }
    });
}


function showEmptyState() {
    document.getElementById('empty-state').style.display = 'flex';
    document.getElementById('currency-container').style.display = 'none';
    document.getElementById('tabs-container').style.display = 'none';
    document.getElementById('content-container').style.display = 'none';
    document.getElementById('current-player-name').textContent = "Selecciona un Jugador";
}

function updateCurrencyDisplay() {
    const player = getCurrentPlayer();
    if (player) {
        document.getElementById('currency-count').textContent = player.currencyAmount;
    }
}

function deletePlayer(id) {
    if (confirm("¿Seguro que deseas eliminar este jugador?")) {
        appState.players = appState.players.filter(p => p.id !== id);
        if (appState.currentPlayerId === id) {
            appState.currentPlayerId = appState.players.length > 0 ? appState.players[0].id : null;
        }
        saveAppState();
        renderSidebar();
        selectPlayer(appState.currentPlayerId);
    }
}

// ==========================================

// ==========================================
// PUNTOS DE GOLPE (HP)
// ==========================================
function renderHp() {
    const player = getCurrentPlayer();
    if (!player) return;

    document.getElementById('current-hp').textContent = player.hp;
    document.getElementById('max-hp').textContent = player.maxHp;

    // Cambiar color si está bajo
    const hpDisplay = document.getElementById('current-hp');
    const ratio = player.hp / player.maxHp;
    if (ratio <= 0) hpDisplay.style.color = 'var(--danger-color)';
    else if (ratio <= 0.3) hpDisplay.style.color = 'orange';
    else hpDisplay.style.color = 'var(--success-color)';
}

window.changeHp = function(amount) {
    const player = getCurrentPlayer();
    if(!player) return;

    player.hp += amount;
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    // Permito que baje de 0 para control narrativo del GM (inconsciente, etc)

    saveAppState();
    renderHp();
};

// RENDER: ATRIBUTOS (D&D)
// ==========================================
function renderAttributes() {
    const player = getCurrentPlayer();
    if (!player) return;

    const container = document.getElementById('attributes-container');
    container.innerHTML = '';

    Object.keys(player.attributes).forEach(key => {
        const val = player.attributes[key];
        const attrName = attrNames[key];

        const card = document.createElement('div');
        card.className = 'attr-card';
        card.innerHTML = `
            <div class="attr-name">${attrName}</div>
            <div class="attr-value" id="val-${key}">${val}</div>
            <div class="attr-controls">
                <button class="btn-attr" onclick="changeAttr('${key}', -1)">-</button>
                <button class="btn-attr" onclick="changeAttr('${key}', 1)">+</button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.changeAttr = function(key, delta) {
    if (document.body.dataset.editMode !== 'true') return;
    const player = getCurrentPlayer();
    if (!player) return;

    player.attributes[key] += delta;
    if(player.attributes[key] < 1) player.attributes[key] = 1; // Mínimo 1

    document.getElementById(`val-${key}`).textContent = player.attributes[key];
    saveAppState();

    // Al cambiar un atributo, puede que se desbloqueen o bloqueen cosas
    recalculateUnlockedStates(player);
    renderTree();
    renderStates();
    if (document.getElementById('tab-rasgos').classList.contains('active')) setTimeout(drawLines, 50);
};

// ==========================================
// LÓGICA DEL ÁRBOL Y ESTADOS
// ==========================================
function recalculateUnlockedStates(player) {
    // Para Rasgos
    player.traits.forEach(trait => {
        // 1. Verificar Requisitos de Árbol (Padres)
        let parentsMet = true;
        if (trait.requisitos && trait.requisitos.length > 0) {
            parentsMet = trait.requisitos.every(reqId => {
                const reqTrait = player.traits.find(t => t.id === reqId);
                return reqTrait && reqTrait.nivel > 0;
            });
        }

        // 2. Verificar Requisitos de Atributo D&D
        let attrMet = true;
        trait.reqAttrFailMsg = null;
        if (trait.reqAttr && trait.reqAttr.key && trait.reqAttr.val) {
            const currentVal = player.attributes[trait.reqAttr.key] || 0;
            if (currentVal < trait.reqAttr.val) {
                attrMet = false;
                trait.reqAttrFailMsg = `Requiere ${attrNames[trait.reqAttr.key]} ${trait.reqAttr.val}`;
            }
        }

        trait.desbloqueado = parentsMet && attrMet;
    });
}

// ==========================================
// MODO EDICIÓN Y MODALES
// ==========================================
























function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); editingItem = null; }

// Modal Jugador
document.getElementById('btn-add-player').onclick = () => {
    editingItem = null;
    document.getElementById('input-player-name').value = '';
    document.getElementById('input-currency-name').value = 'Puntos de Atributo';
    if(document.getElementById('select-player-type')) document.getElementById('select-player-type').value = 'player';
    document.getElementById('modal-player-title').textContent = "Nuevo Personaje";
    openModal('modal-player');
};
document.getElementById('btn-edit-player').onclick = () => {
    const player = getCurrentPlayer();
    if (!player) return;
    editingItem = player;
    document.getElementById('input-player-name').value = player.name;
    document.getElementById('input-currency-name').value = player.currencyName;
    if(document.getElementById('select-player-type')) document.getElementById('select-player-type').value = player.type || 'player';
    document.getElementById('modal-player-title').textContent = "Editar Personaje";
    openModal('modal-player');
};
document.getElementById('btn-save-player').onclick = () => {
    const name = document.getElementById('input-player-name').value.trim() || 'Personaje';
    const curr = document.getElementById('input-currency-name').value.trim() || 'Moneda';
    const typeSelect = document.getElementById('select-player-type');
    const pType = typeSelect ? typeSelect.value : 'player';

    if (editingItem && appState.players.find(p => p.id === editingItem.id)) {
        editingItem.name = name;
        editingItem.currencyName = curr;
        editingItem.type = pType;
    } else {
        const newP = createNewPlayer(name, curr);
        newP.type = pType;
        appState.players.push(newP);
        appState.currentPlayerId = newP.id;
    }
    saveAppState();
    renderSidebar();
    selectPlayer(appState.currentPlayerId);
    closeModal('modal-player');
};

// Modal Rasgos
function populateReqSelect(currentPlayer, currentTraitId) {
    const select = document.getElementById('select-trait-req');
    select.innerHTML = '<option value="">Ninguno (Nodo Raíz)</option>';
    if (!currentPlayer) return;

    currentPlayer.traits.forEach(t => {
        if (t.id !== currentTraitId) {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.nombreBase;
            select.appendChild(opt);
        }
    });
}

document.getElementById('btn-add-trait').onclick = () => {
    editingItem = null;
    document.getElementById('modal-trait-title').textContent = "Nuevo Rasgo";
    document.getElementById('input-trait-name').value = '';
    document.getElementById('input-trait-desc').value = '';
    document.getElementById('input-trait-cost1').value = '10';
    document.getElementById('input-trait-cost2').value = '20';
    document.getElementById('select-trait-tier').value = '1';
    document.getElementById('select-trait-req-attr').value = '';
    document.getElementById('input-trait-req-attr-val').value = '10';
    document.getElementById('btn-delete-trait').style.display = 'none';

    if(document.getElementById('check-trait-unique')) {
        document.getElementById('check-trait-unique').checked = false;
        document.getElementById('group-cost2').style.opacity = '1';
    }
    if(document.getElementById('check-trait-hidden')) document.getElementById('check-trait-hidden').checked = false;

    populateReqSelect(getCurrentPlayer(), null);
    openModal('modal-trait');
};

function openModalTrait(trait) {
    editingItem = trait;
    document.getElementById('modal-trait-title').textContent = "Editar Rasgo";
    document.getElementById('input-trait-name').value = trait.nombreBase;
    document.getElementById('input-trait-desc').value = trait.descripcion || '';

    const costs = trait.costeMerito || [10,20];
    document.getElementById('input-trait-cost1').value = costs[0];
    document.getElementById('input-trait-cost2').value = costs[1];
    document.getElementById('select-trait-tier').value = trait.tier || 1;

    if(document.getElementById('check-trait-unique')) {
        document.getElementById('check-trait-unique').checked = !!trait.isUnique;
        document.getElementById('group-cost2').style.opacity = trait.isUnique ? '0.3' : '1';
    }
    if(document.getElementById('check-trait-hidden')) document.getElementById('check-trait-hidden').checked = !!trait.isHiddenWhenLocked;

    populateReqSelect(getCurrentPlayer(), trait.id);
    const reqSelect = document.getElementById('select-trait-req');
    if (trait.requisitos && trait.requisitos.length > 0) reqSelect.value = trait.requisitos[0];
    else reqSelect.value = "";

    if (trait.reqAttr) {
        document.getElementById('select-trait-req-attr').value = trait.reqAttr.key || '';
        document.getElementById('input-trait-req-attr-val').value = trait.reqAttr.val || 10;
    } else {
        document.getElementById('select-trait-req-attr').value = '';
        document.getElementById('input-trait-req-attr-val').value = 10;
    }

    document.getElementById('btn-delete-trait').style.display = 'block';
    openModal('modal-trait');
}

document.getElementById('btn-save-trait').onclick = () => {
    const player = getCurrentPlayer();
    if (!player) return;

    const name = document.getElementById('input-trait-name').value.trim() || 'Nuevo Rasgo';
    const desc = document.getElementById('input-trait-desc').value.trim();
    const c1 = parseInt(document.getElementById('input-trait-cost1').value) || 0;
    const c2 = parseInt(document.getElementById('input-trait-cost2').value) || 0;
    const tier = parseInt(document.getElementById('select-trait-tier').value) || 1;
    const req = document.getElementById('select-trait-req').value;

    const isUnique = document.getElementById('check-trait-unique') ? document.getElementById('check-trait-unique').checked : false;
    const isHidden = document.getElementById('check-trait-hidden') ? document.getElementById('check-trait-hidden').checked : false;

    const reqAttrKey = document.getElementById('select-trait-req-attr').value;
    const reqAttrVal = parseInt(document.getElementById('input-trait-req-attr-val').value) || 1;
    const reqAttrObj = reqAttrKey ? { key: reqAttrKey, val: reqAttrVal } : null;

    if (editingItem) {
        editingItem.nombreBase = name;
        editingItem.descripcion = desc;
        editingItem.costeMerito = [c1, c2];
        editingItem.tier = tier;
        editingItem.requisitos = req ? [req] : [];
        editingItem.reqAttr = reqAttrObj;
        editingItem.isUnique = isUnique;
        editingItem.isHiddenWhenLocked = isHidden;
    } else {
        const newTrait = {
            id: 'trait_' + Date.now(),
            nombreBase: name,
            descripcion: desc,
            nivel: 0,
            costeMerito: [c1, c2],
            requisitos: req ? [req] : [],
            tier: tier,
            reqAttr: reqAttrObj,
            isUnique: isUnique,
            isHiddenWhenLocked: isHidden
        };
        player.traits.push(newTrait);
    }

    recalculateUnlockedStates(player);
    saveAppState();
    renderTree();
    setTimeout(drawLines, 50);
    closeModal('modal-trait');
};

document.getElementById('btn-delete-trait').onclick = () => {
    const player = getCurrentPlayer();
    if (!player || !editingItem) return;
    if (confirm("¿Eliminar rasgo? Los hijos que dependan de él podrían romperse.")) {
        player.traits = player.traits.filter(t => t.id !== editingItem.id);
        player.traits.forEach(t => {
            if(t.requisitos) t.requisitos = t.requisitos.filter(r => r !== editingItem.id);
        });
        recalculateUnlockedStates(player);
        saveAppState();
        renderTree();
        setTimeout(drawLines, 50);
        closeModal('modal-trait');
    }
};

// Modal Estados
const btnAddStateOld = document.getElementById('btn-add-state'); if(btnAddStateOld) btnAddStateOld.onclick = () => {
    editingItem = null;
    document.getElementById('modal-state-title').textContent = "Nuevo Estado";
    document.getElementById('input-state-name').value = '';
    document.getElementById('input-state-desc').value = '';

    document.getElementById('btn-delete-state').style.display = 'none';
    openModal('modal-state');
};

function openModalState(estado) {
    editingItem = estado;
    document.getElementById('modal-state-title').textContent = "Editar Estado";
    document.getElementById('input-state-name').value = estado.nombreBase;
    document.getElementById('input-state-desc').value = estado.descripcion || '';



    document.getElementById('btn-delete-state').style.display = 'block';
    openModal('modal-state');
}


// ==========================================
// ASIGNAR ESTADO AL JUGADOR
// ==========================================




document.addEventListener('DOMContentLoaded', init);


// ==========================================
// RENDER: RASGOS (ÁRBOL)
// ==========================================

function getLevelSuffix(nivel, isUnique) {
    if(isUnique) return "";
    if (nivel === 1) return "+";
    if (nivel === 2) return "++";
    return "";
}

function getCurrentCost(item) {
    if (item.isUnique && item.nivel >= 1) return "MÁXIMO";
    if (item.nivel >= 2) return "MÁXIMO";
    const costArray = item.costeMerito || [0,0];
    const cost = costArray[item.nivel] || 0;
    const player = getCurrentPlayer();
    return cost + " " + (player ? player.currencyName : "");
}

function handleUpgrade(item, type, elementId) {
    const player = getCurrentPlayer();
    if (!player) return;

    const maxLevel = item.isUnique ? 1 : 2;
    if (!item.desbloqueado || item.nivel >= maxLevel) {
        shakeElement(elementId); return;
    }

    const costArray = item.costeMerito || [0,0];
    const cost = costArray[item.nivel] || 0;

    if (player.currencyAmount >= cost) {
        player.currencyAmount -= cost;
        item.nivel++;

        if (type === 'trait') {
            recalculateUnlockedStates(player);
            renderTree();
            if (document.getElementById('tab-rasgos').classList.contains('active')) setTimeout(drawLines, 50);
        } else {
            renderStates();
        }

        saveAppState();
        updateCurrencyDisplay();
    } else {
        shakeElement(elementId);
    }
}

function shakeElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.transform = "translateX(-5px)";
        setTimeout(() => el.style.transform = "translateX(5px)", 100);
        setTimeout(() => el.style.transform = "translateX(0)", 200);
    }
}

function renderTree() {
    const player = getCurrentPlayer();
    if (!player) return;

    const container = document.getElementById('nodes-container');
    if(!container) return;
    container.innerHTML = '';

    const tiers = {};
    if(!player.traits) player.traits = [];
    player.traits.forEach(trait => {
        const t = trait.tier || 1;
        if (!tiers[t]) tiers[t] = [];
        tiers[t].push(trait);
    });

    const sortedTiers = Object.keys(tiers).sort((a, b) => parseInt(a) - parseInt(b));

    sortedTiers.forEach(tierKey => {
        const tierDiv = document.createElement('div');
        tierDiv.className = 'tier';

        tiers[tierKey].forEach(trait => {
            const node = document.createElement('div');
            node.className = 'node';
            node.id = `node-${trait.id}`;

            if (trait.nivel === 2) node.classList.add('maxed');
            else if (trait.desbloqueado) node.classList.add('unlocked');
            else node.classList.add('locked');


            const name = trait.nombreBase + getLevelSuffix(trait.nivel, trait.isUnique);
            const costText = getCurrentCost(trait);
            const descHtml = trait.descripcion ? `<div class="state-desc">${trait.descripcion}</div>` : '';

            let warningHtml = '';

            if (!trait.desbloqueado && trait.reqAttrFailMsg && trait.nivel === 0) {
                warningHtml = `<div class="req-warning">${trait.reqAttrFailMsg}</div>`;
            }

            const badge = `<div class="edit-badge">✎</div>`;

            let isHidden = false;
            if (trait.isHiddenWhenLocked && !trait.desbloqueado && document.body.dataset.editMode !== 'true') {
                isHidden = true;
            }

            if (isHidden) {
                node.style.visibility = 'hidden';
            } else {
                const eyeIcon = (trait.isHiddenWhenLocked && document.body.dataset.editMode === 'true') ? `<div style="position:absolute; top:-10px; left:-10px; background:#444; border-radius:50%; width:24px; height:24px; display:flex; justify-content:center; align-items:center;" title="Rasgo Oculto en Modo Juego">👁️</div>` : '';
                node.innerHTML = `
                    ${badge}
                    ${eyeIcon}
                    <div class="node-name">${name}</div>
                    <div class="node-cost">${costText}</div>
                    ${warningHtml}
                    ${descHtml}
                `;
            }

            node.addEventListener('click', () => {
                if (document.body.dataset.editMode === 'true') openModalTrait(trait);
                else handleUpgrade(trait, 'trait', `node-${trait.id}`);
            });

            tierDiv.appendChild(node);
        });

        container.appendChild(tierDiv);
    });
}


// ==========================================
// RENDER: ESTADOS (ZONAS DEL CUERPO)
// ==========================================

window.scaleState = function(activeStateId, delta) {
    const player = getCurrentPlayer();
    if(!player || !player.activeStates) return;
    const aState = player.activeStates.find(s => s.id === activeStateId);
    if(aState) {
        aState.nivel += delta;
        if(aState.nivel < 0) aState.nivel = 0; // Min 0
        if(aState.nivel > 2) aState.nivel = 2; // Max 2 (++, siguiendo regla)
        saveAppState();
        renderStates();
    }
};

function renderStates() {
    const player = getCurrentPlayer();
    if (!player) return;

    const container = document.getElementById('body-zones-container');
    if(!container) return;
    container.innerHTML = '';

    const zones = {
        general: 'General',
        cabeza: 'Cabeza',
        torso: 'Torso',
        brazo_izq: 'Brazo Izquierdo',
        brazo_der: 'Brazo Derecho',
        pierna_izq: 'Pierna Izquierda',
        pierna_der: 'Pierna Derecha'
    };

    const statesByZone = {};
    Object.keys(zones).forEach(z => statesByZone[z] = []);

    if (player.activeStates) {
        player.activeStates.forEach(ast => {
            const z = ast.bodyPart || 'general';
            if(!statesByZone[z]) statesByZone[z] = [];
            statesByZone[z].push(ast);
        });
    }

    Object.keys(zones).forEach(zoneKey => {
        const zoneStates = statesByZone[zoneKey];
        if(zoneStates.length === 0 && zoneKey !== 'general') return;

        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'body-zone';
        zoneDiv.innerHTML = `<h4>${zones[zoneKey]}</h4>`;

        if (zoneStates.length === 0) {
            zoneDiv.innerHTML += '<p class="text-muted" style="font-size:0.8rem;">Limpio</p>';
        } else {
            const statesGrid = document.createElement('div');
            statesGrid.className = 'states-grid';

            zoneStates.forEach(activeState => {
                if(!appState.globalStates) return;
                const globalState = appState.globalStates.find(s => s.id === activeState.globalId);
                if(!globalState) return;

                const card = document.createElement('div');
                card.className = 'state-card unlocked';
                card.id = `state-${activeState.id}`;

                const name = globalState.nombreBase + getLevelSuffix(activeState.nivel);
                const descText = globalState.descripcion || '';
                const badge = `<div class="edit-badge" title="Remover de jugador">×</div>`;

                const scaleControls = document.body.dataset.editMode === 'true' ? `
                    <div class="state-scale-controls">
                        <button class="btn btn-small" onclick="event.stopPropagation(); scaleState('${activeState.id}', -1)">- Lvl</button>
                        <button class="btn btn-small" onclick="event.stopPropagation(); scaleState('${activeState.id}', 1)">+ Lvl</button>
                    </div>
                ` : '';

                card.innerHTML = `
                    ${badge}
                    <div class="state-name">${name}</div>
                    ${descText ? `<div class="state-desc">${descText}</div>` : ''}
                    ${scaleControls}
                `;

                card.addEventListener('click', (e) => {
                    if (document.body.dataset.editMode === 'true') {
                        if(confirm(`¿Sanar/Remover '${globalState.nombreBase}' de esta zona?`)){
                            player.activeStates = player.activeStates.filter(s => s.id !== activeState.id);
                            saveAppState();
                            renderStates();
                        }
                    }
                });

                statesGrid.appendChild(card);
            });
            zoneDiv.appendChild(statesGrid);
        }

        container.appendChild(zoneDiv);
    });
}


// ==========================================
// SVG LINES
// ==========================================
function drawLines() {
    const svg = document.getElementById('connections-svg');
    if (!svg) return;
    svg.innerHTML = '';

    if (!document.getElementById('tab-rasgos') || !document.getElementById('tab-rasgos').classList.contains('active')) return;

    const player = getCurrentPlayer();
    if (!player) return;

    if(!player.traits) player.traits = [];

    player.traits.forEach(trait => {
        if (trait.requisitos && trait.requisitos.length > 0) {
            const targetNode = document.getElementById(`node-${trait.id}`);
            if (!targetNode) return;

            trait.requisitos.forEach(reqId => {
                const sourceNode = document.getElementById(`node-${reqId}`);
                if (!sourceNode) return;

                const sourceRect = sourceNode.getBoundingClientRect();
                const targetRect = targetNode.getBoundingClientRect();
                const svgRect = svg.getBoundingClientRect();

                // Compensar el scale del viewport para que las lineas queden ancladas exactamente en los nodos sin importar el zoom
                const scale = typeof treeTransform !== 'undefined' ? treeTransform.scale : 1;
                const startX = (sourceRect.left + sourceRect.width / 2 - svgRect.left) / scale;
                const startY = (sourceRect.bottom - svgRect.top) / scale;
                const endX = (targetRect.left + targetRect.width / 2 - svgRect.left) / scale;
                const endY = (targetRect.top - svgRect.top) / scale;

                const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const pathData = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
                line.setAttribute("d", pathData);

                const reqTrait = player.traits.find(t => t.id === reqId);
                const isReqMet = reqTrait && reqTrait.nivel > 0;
                const isActive = isReqMet && (trait.nivel > 0 || trait.desbloqueado);

                // No dibujar si el nodo objetivo está bajo niebla de guerra
                if (trait.isHiddenWhenLocked && !trait.desbloqueado && document.body.dataset.editMode !== 'true') {
                    line.style.display = 'none';
                }

                line.setAttribute("class", `connection-line ${isActive ? 'active' : 'inactive'}`);
                line.setAttribute("fill", "none");
                svg.appendChild(line);
            });
        }
    });
}



const btnSaveState = document.getElementById('btn-save-state');
if(btnSaveState) {
    btnSaveState.onclick = () => {
        const name = document.getElementById('input-state-name').value.trim() || 'Nuevo Estado';
        const desc = document.getElementById('input-state-desc').value.trim();
        const tier = document.getElementById('select-state-tier') ? parseInt(document.getElementById('select-state-tier').value) || 1 : 1;
        const req = document.getElementById('select-state-req') ? document.getElementById('select-state-req').value : '';

        if (editingItem) {
            editingItem.nombreBase = name;
            editingItem.descripcion = desc;
            editingItem.tier = tier;
            editingItem.requisitos = req ? [req] : [];
            // Eliminar data vieja si viene heredada
            delete editingItem.costeMerito;
            delete editingItem.reqAttr;
        } else {
            const newState = {
                id: 'gstate_' + Date.now(),
                nombreBase: name,
                descripcion: desc,
                tier: tier,
                requisitos: req ? [req] : []
            };
            if(!appState.globalStates) appState.globalStates = [];
            appState.globalStates.push(newState);
        }

        saveAppState();
        closeModal('modal-state');
        if(typeof renderGlobalStatesTree === 'function') renderGlobalStatesTree();

        const player = getCurrentPlayer();
        if(player && typeof renderStates === 'function') {
            renderStates();
        }
    };
}



// ==========================================
// EVENT LISTENERS GENERALES
// ==========================================
function setupEventListeners() {
    const btnAddCurrency = document.getElementById('btn-add-currency');
    if(btnAddCurrency) {
        btnAddCurrency.addEventListener('click', () => {
            const player = getCurrentPlayer();
            if (player) {
                player.currencyAmount += 10;
                saveAppState();
                updateCurrencyDisplay();
            }
        });
    }

    const toggleInput = document.getElementById('mode-toggle');
    if(toggleInput) {
        toggleInput.addEventListener('change', () => {
            document.body.dataset.editMode = toggleInput.checked ? 'true' : 'false';
            window.updateEditModeUI();
        });
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = '';
            });

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if(targetEl) {
                targetEl.classList.add('active');
            }

            if (targetId === 'tab-rasgos') {
                setTimeout(drawLines, 50);
            }
            window.updateEditModeUI();
        });
    });

    window.addEventListener('resize', () => {
        if (document.getElementById('tab-rasgos') && document.getElementById('tab-rasgos').classList.contains('active')) {
            drawLines();
        }
    });
}


function drawStatesLines() {
    const svg = document.getElementById('states-connections-svg');
    if (!svg) return;
    svg.innerHTML = '';

    if (!document.getElementById('tab-estados') || !document.getElementById('tab-estados').classList.contains('active')) return;

    if(!appState.globalStates) return;

    appState.globalStates.forEach(state => {
        if (state.requisitos && state.requisitos.length > 0) {
            const targetNode = document.getElementById(`gstate-${state.id}`);
            if (!targetNode) return;

            state.requisitos.forEach(reqId => {
                const sourceNode = document.getElementById(`gstate-${reqId}`);
                if (!sourceNode) return;

                const sourceRect = sourceNode.getBoundingClientRect();
                const targetRect = targetNode.getBoundingClientRect();
                const svgRect = svg.getBoundingClientRect();

                const scale = typeof statesTransform !== 'undefined' ? statesTransform.scale : 1;
                const startX = (sourceRect.left + sourceRect.width / 2 - svgRect.left) / scale;
                const startY = (sourceRect.bottom - svgRect.top) / scale;
                const endX = (targetRect.left + targetRect.width / 2 - svgRect.left) / scale;
                const endY = (targetRect.top - svgRect.top) / scale;

                const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const pathData = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
                line.setAttribute("d", pathData);

                // Las conexiones de plantillas globales siempre son grises (inactivas/base) visualmente
                line.setAttribute("class", `connection-line inactive`);
                line.setAttribute("fill", "none");
                svg.appendChild(line);
            });
        }
    });
}


function populateStateReqSelect(currentStateId) {
    const select = document.getElementById('select-state-req');
    if(!select) return;
    select.innerHTML = '<option value="">Ninguno</option>';
    if (!appState.globalStates) return;

    appState.globalStates.forEach(s => {
        if (s.id !== currentStateId) {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.nombreBase;
            select.appendChild(opt);
        }
    });
}

window.openAssignModal = function(globalStateId) {
    document.getElementById('hidden-assign-state-id').value = globalStateId;
    const selectPlayer = document.getElementById('select-assign-player');
    selectPlayer.innerHTML = '';

    if(appState.players.length === 0) {
        selectPlayer.innerHTML = '<option value="">No hay jugadores creados.</option>';
        document.getElementById('btn-confirm-assign-state').disabled = true;
    } else {
        document.getElementById('btn-confirm-assign-state').disabled = false;
        appState.players.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            selectPlayer.appendChild(opt);
        });
    }
    openModal('modal-assign-state');
};
document.addEventListener('DOMContentLoaded', init);

}
