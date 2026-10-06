const LIBRARY_KEY = "brainHistory.v1";
let weightLibrary = [], chosenBrain, chosenName = "Initial random weights", chosenId = null;
let driveMode = "AI", manualCar = null, runNumber = 1;
const heldKeys = new Set();
const cloneBrain = brain => JSON.parse(JSON.stringify(brain));
const byId = id => document.getElementById(id);
function validBrain(brain) {
    if (!brain || !Array.isArray(brain.levels) || brain.levels.length < 1 || brain.levels.length > 6) return false;
    let count = 5;
    for (const [index, level] of brain.levels.entries()) {
        const n = level.outputs?.length;
        if (!Number.isInteger(n) || n < 1 || n > 16 || level.inputs?.length !== count || level.biases?.length !== n || level.weights?.length !== count) return false;
        if (!level.biases.every(Number.isFinite) || !level.weights.every(row => Array.isArray(row) && row.length === n && row.every(Number.isFinite))) return false;
        if (index === brain.levels.length - 1 && n !== 4) return false;
        count = n;
    }
    return true;
}
function persistLibrary() {
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify({entries: weightLibrary, selectedId: chosenId})); return true; }
    catch { byId("libraryMessage").textContent = "Browser storage is unavailable or full. Changes remain in this session."; return false; }
}
function renderLibrary() {
    const select = byId("weightHistory");
    select.replaceChildren();
    if (!weightLibrary.length) {
        const option = document.createElement("option"); option.textContent = "No saved weights yet"; option.value = ""; select.append(option);
    }
    weightLibrary.forEach(entry => {
        const option = document.createElement("option"); option.value = entry.id;
        option.textContent = `${entry.name} · ${new Date(entry.created).toLocaleString()} · ${[5, ...entry.brain.levels.map(l => l.outputs.length)].join(" → ")}`;
        select.append(option);
    });
    if (weightLibrary.some(e => e.id === chosenId)) select.value = chosenId;
    byId("applyWeights").disabled = byId("deleteWeights").disabled = !weightLibrary.length;
}
function assignBrain(car, brain, name, mutate = false) {
    car.brain = cloneBrain(brain);
    if (mutate) NeuralNetwork.mutate(car.brain, 0.1);
    car.weightSource = name;
    car.weightVariant = mutate ? "mutated candidate (10%)" : "exact weights";
    car.controls.forward = car.controls.left = car.controls.right = car.controls.reverse = false;
}
function applyChosenLive() {
    cars.forEach(car => assignBrain(car, chosenBrain, chosenName));
    renderLayers(); updateRunningWeights();
}
function renderLayers() {
    const editor = byId("layerEditor"); editor.replaceChildren();
    chosenBrain.levels.slice(0, -1).forEach((level, i) => addLayerRow(level.outputs.length, i));
    byId("addLayer").disabled = editor.children.length >= 5;
}
function addLayerRow(count = 6) {
    const row = document.createElement("div"); row.className = "layer-row";
    const label = document.createElement("label"); label.textContent = "Neurons ";
    const input = document.createElement("input"); input.type = "number"; input.min = 1; input.max = 16; input.value = count;
    label.append(input);
    const remove = document.createElement("button"); remove.textContent = "Remove layer";
    remove.onclick = () => { row.remove(); byId("addLayer").disabled = false; };
    row.append(label, remove); byId("layerEditor").append(row);
    byId("addLayer").disabled = byId("layerEditor").children.length >= 5;
}
function updateRunningWeights() {
    const lines = [
        `Restart seed: ${chosenName} · Run ${runNumber}`,
        `Displayed car #${cars.indexOf(bestCar)+1}: ${bestCar.weightSource} · ${bestCar.weightVariant}`,
        `Mode: ${driveMode === "AI" ? "AI training" : "Manual — network outputs are suggestions"}`,
        `Architecture: ${[5, ...bestCar.brain.levels.map(l => l.outputs.length)].join(" → ")}`
    ];
    const signature = lines.join("|");
    if (byId("runningWeights").dataset.signature === signature) return;
    byId("runningWeights").dataset.signature = signature;
    byId("runningWeights").replaceChildren(...lines.map(text => { const li = document.createElement("li"); li.textContent = text; return li; }));
}
function restartTraining() {
    heldKeys.clear();
    const origins = trafficOrigins;
    traffic.forEach((car,i) => {car.x=origins[i].x;car.y=origins[i].y;car.speed=0;car.angle=0;car.damaged=false;});
    cars = generateCars(N);
    cars.forEach((car,i) => assignBrain(car, chosenBrain, chosenName, i !== 0));
    bestCar = cars[0]; manualCar = driveMode === "MANUAL" ? bestCar : null;
    if (manualCar) manualCar.useBrain = false;
    runNumber++; updateRunningWeights();
    byId("libraryMessage").textContent = "Restarted from chosen weights. Car #1 is exact; other cars explore 10% mutations.";
}
let trafficOrigins;
function initializeSession() {
    trafficOrigins = traffic.map(car => ({x:car.x,y:car.y}));
    try {
        const data = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "null");
        weightLibrary = (data?.entries || []).filter(e => typeof e.id === "string" && typeof e.name === "string" && validBrain(e.brain));
        chosenId = data?.selectedId || null;
        if (!data) {
            const legacy = JSON.parse(localStorage.getItem("bestBrain") || "null");
            if (validBrain(legacy)) { chosenId = "legacy"; weightLibrary.push({id:chosenId,name:"Previously saved brain",created:new Date().toISOString(),brain:legacy}); persistLibrary(); }
        }
    } catch { byId("libraryMessage").textContent = "Could not read saved weights; starting a new session."; }
    const selected = weightLibrary.find(e => e.id === chosenId);
    chosenBrain = cloneBrain(selected?.brain || bestCar.brain); chosenName = selected?.name || chosenName;
    cars.forEach((car,i) => assignBrain(car, chosenBrain, chosenName, i !== 0));
    renderLibrary(); renderLayers(); updateRunningWeights();
    byId("saveWeights").onclick = () => {
        const entry = {id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: byId("snapshotName").value.trim() || `Snapshot ${weightLibrary.length+1}`, created:new Date().toISOString(),brain:cloneBrain(bestCar.brain)};
        weightLibrary.push(entry); chosenId=entry.id; chosenName=entry.name; chosenBrain=cloneBrain(entry.brain);
        bestCar.weightSource=entry.name;bestCar.weightVariant="exact weights";
        renderLibrary(); renderLayers(); updateRunningWeights();
        if (persistLibrary()) byId("libraryMessage").textContent = "Saved the displayed vehicle's exact weights and architecture.";
    };
    byId("applyWeights").onclick = () => {
        const entry=weightLibrary.find(e=>e.id===byId("weightHistory").value); if(!entry) return;
        chosenId=entry.id;chosenName=entry.name;chosenBrain=cloneBrain(entry.brain);
        applyChosenLive();
        if(persistLibrary()) byId("libraryMessage").textContent="Applied exact weights to all cars at their current positions. Restart to revive crashed cars.";
    };
    byId("deleteWeights").onclick = () => {
        const id=byId("weightHistory").value; weightLibrary=weightLibrary.filter(e=>e.id!==id);
        if(chosenId===id) {chosenId=null;chosenName += " (deleted snapshot, retained in session)";}
        renderLibrary();updateRunningWeights();
        if(persistLibrary()) byId("libraryMessage").textContent="Deleted snapshot; running weights remain available until this session ends.";
    };
    byId("restartTraining").onclick=restartTraining;
    byId("driveMode").onchange = () => {
        heldKeys.clear();
        byId("driveMode").blur();
        if(manualCar) {manualCar.useBrain=true;manualCar.controls.forward=manualCar.controls.left=manualCar.controls.right=manualCar.controls.reverse=false;}
        driveMode=byId("driveMode").value;
        manualCar=driveMode==="MANUAL" ? bestCar : null;
        if(manualCar) {manualCar.useBrain=false;manualCar.controls.forward=manualCar.controls.left=manualCar.controls.right=manualCar.controls.reverse=false;}
        updateRunningWeights();
    };
    byId("addLayer").onclick=()=>{if(byId("layerEditor").children.length<5)addLayerRow();};
    byId("applyArchitecture").onclick=()=>{
        const counts=[...byId("layerEditor").querySelectorAll("input")].map(input=>Number(input.value));
        if(counts.some(n=>!Number.isInteger(n)||n<1||n>16)) {byId("libraryMessage").textContent="Use whole neuron counts from 1 to 16.";return;}
        const source=bestCar.brain, brain=new NeuralNetwork([5,...counts,4]);
        brain.levels.forEach((level,k)=>{
            const old=k===brain.levels.length-1 ? source.levels[source.levels.length-1] : (k<source.levels.length-1 ? source.levels[k] : null);
            if(!old)return;
            level.biases.forEach((v,j)=>{if(j<old.biases.length)level.biases[j]=old.biases[j];});
            level.weights.forEach((row,i)=>row.forEach((v,j)=>{if(old.weights[i]?.[j]!==undefined)row[j]=old.weights[i][j];}));
        });
        chosenBrain=cloneBrain(brain);chosenId=null;chosenName="Edited architecture (unsaved)";
        applyChosenLive();persistLibrary();byId("libraryMessage").textContent="Applied edited architecture live; save a snapshot to keep it.";
    };
    const keyMap={ArrowUp:"forward",w:"forward",ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right",ArrowDown:"reverse",s:"reverse"};
    const sync=()=>{if(manualCar) for(const action of ["forward","left","right","reverse"]) manualCar.controls[action]=[...heldKeys].some(key=>keyMap[key]===action);};
    window.addEventListener("keydown",event=>{
        if(driveMode!=="MANUAL" || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
        const key=event.key.length===1 ? event.key.toLowerCase() : event.key;
        if(keyMap[key]) {event.preventDefault();heldKeys.add(key);sync();}
    });
    window.addEventListener("keyup",event=>{heldKeys.delete(event.key.length===1 ? event.key.toLowerCase() : event.key);sync();});
    window.addEventListener("blur",()=>{heldKeys.clear();sync();});
}
